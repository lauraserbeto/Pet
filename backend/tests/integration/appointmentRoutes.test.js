process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signTestToken } = require('../helpers/authState');

// Criação e troca de status passam pelos use cases REAIS (E-04): só o Prisma é
// simulado. O Prisma Client usa lazy proxies, então mock.method falha; os
// métodos são substituídos diretamente e restaurados ao fim de cada teste.
// As listagens continuam com o use case substituído (cobertas no teste unitário).

const prisma = require('../../src/config/database');
const listAppointmentsUseCase = require('../../src/useCases/appointments/ListAppointmentsUseCase');

const app = require('../../src/app');
const { APPOINTMENT_STATUS: S } = require('../../src/constants/appointmentStatus');
const { PAYMENT_POLICY } = require('../../src/constants/paymentPolicy');

// --- Helpers ---

function generateToken(roleId, userId) {
  return signTestToken({ id: userId, role_id: roleId });
}

const TUTOR_A_ID = '00000000-0000-4000-a000-000000000001';
const TUTOR_B_ID = '00000000-0000-4000-a000-000000000002';
const HOTEL_USER_ID = '00000000-0000-4000-a000-000000000003';
const SITTER_USER_ID = '00000000-0000-4000-a000-000000000004';

const TUTOR_A_TOKEN = generateToken(5, TUTOR_A_ID);
const TUTOR_B_TOKEN = generateToken(5, TUTOR_B_ID);
const HOTEL_TOKEN = generateToken(3, HOTEL_USER_ID);
const SITTER_TOKEN = generateToken(4, SITTER_USER_ID);

const HOTEL_PROVIDER_ID = 'provider-hotel-001';
const SITTER_PROVIDER_ID = 'provider-sitter-001';
const SERVICE_ID = '00000000-0000-4000-a000-000000000010';
const PET_ID = '00000000-0000-4000-a000-000000000020';
const APPOINTMENT_ID = '00000000-0000-4000-a000-000000000099';

// Os use cases usam o relógio real: as datas são relativas a agora.
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const fromNow = (days, hours = 0) => new Date(Date.now() + days * DAY + hours * HOUR);
const iso = (days, hours = 0) => fromNow(days, hours).toISOString();

/** Substitui métodos do Prisma ('model.method' ou '$method') até o fim do teste. */
function stubPrisma(t, stubs) {
  for (const [path, fn] of Object.entries(stubs)) {
    const [model, method] = path.includes('.') ? path.split('.') : [null, path];
    const target = model ? prisma[model] : prisma;
    const original = target[method];
    target[method] = fn;
    t.after(() => {
      target[method] = original;
    });
  }
}

// --- Fixtures ---

/** Parceiro operacional (E-01); tarifas do perfil diferentes do preço do serviço. */
function partner(roleId, overrides = {}) {
  return {
    id: roleId === 3 ? HOTEL_PROVIDER_ID : SITTER_PROVIDER_ID,
    user_id: roleId === 3 ? HOTEL_USER_ID : SITTER_USER_ID,
    business_name: roleId === 3 ? 'Hotel Bom Pêlo' : 'Sitter da Ana',
    document: '12345678000190',
    document_type: 'CNPJ',
    payment_policy: PAYMENT_POLICY.ON_SITE,
    status: 'APROVADO',
    daily_rate: 999,
    hourly_rate: 999,
    ...overrides,
    user: {
      role_id: roleId,
      is_active: true,
      sitter_evaluations: roleId === 4 ? [{ status: 'APPROVED' }] : [],
      ...overrides.user,
    },
  };
}

const tutorA = {
  id: TUTOR_A_ID,
  full_name: 'Tutor A',
  email: 'tutora@test.com',
  phone: '(11) 99999-0000',
  password_hash: 'nao-pode-vazar',
  role_id: 5,
};

/**
 * Prisma da criação: serviço com o parceiro, pet do tutor A e a transação
 * (lock, conflito, gravação). `created` guarda o que foi gravado.
 */
function stubCreation(t, { provider, price = '120.00', pet = { id: PET_ID, tutor_id: TUTOR_A_ID }, conflict = null } = {}) {
  const state = { created: null };
  const service = { id: SERVICE_ID, provider_id: provider.id, name: 'Serviço', is_active: true, price, provider };

  stubPrisma(t, {
    'service.findUnique': async () => service,
    'pet.findUnique': async () => pet,
    $transaction: async (fn) =>
      fn({
        $queryRaw: async () => [],
        appointment: {
          findFirst: async () => conflict,
          create: async ({ data }) => {
            state.created = data;
            const { user: _user, ...providerRow } = provider;
            return {
              id: APPOINTMENT_ID,
              ...data,
              created_at: new Date(),
              updated_at: new Date(),
              pet: { id: PET_ID, tutor_id: TUTOR_A_ID, name: 'Rex', tutor: tutorA },
              service: { id: SERVICE_ID, name: 'Serviço', price },
              provider: providerRow,
            };
          },
        },
      }),
  });

  return state;
}

const postAppointment = (token, body) =>
  request(app)
    .post('/api/v1/appointments')
    .set('Authorization', `Bearer ${token}`)
    .send({ service_id: SERVICE_ID, pet_id: PET_ID, ...body });

// ============================================================
// POST /api/v1/appointments
// ============================================================

describe('POST /api/v1/appointments', () => {
  test('hotel PRESENCIAL: 201, nasce PENDENTE e cobra o preço do serviço por diária', async (t) => {
    const state = stubCreation(t, { provider: partner(3) });

    const res = await postAppointment(TUTOR_A_TOKEN, { start_time: iso(10), end_time: iso(12) });

    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.status, S.PENDING);
    assert.equal(res.body.payment_policy, PAYMENT_POLICY.ON_SITE);
    assert.deepEqual(res.body.pricing, { unit: 'DIARIA', quantity: 2, unit_price: 120 });
    assert.equal(res.body.total_price, 240);
    assert.equal(state.created.status, S.PENDING);
  });

  test('sitter PRE_PAGO: 201, também nasce PENDENTE, com a política gravada', async (t) => {
    const state = stubCreation(t, {
      provider: partner(4, { payment_policy: PAYMENT_POLICY.PREPAID }),
      price: '45.00',
    });

    const res = await postAppointment(TUTOR_A_TOKEN, { start_time: iso(10), end_time: iso(10, 2) });

    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.status, S.PENDING);
    assert.equal(res.body.payment_policy, PAYMENT_POLICY.PREPAID);
    assert.equal(res.body.total_price, 90);
    assert.equal(state.created.payment_policy, PAYMENT_POLICY.PREPAID);
  });

  test('a resposta não expõe senha do tutor nem documento do parceiro', async (t) => {
    stubCreation(t, { provider: partner(3) });

    const res = await postAppointment(TUTOR_A_TOKEN, { start_time: iso(10), end_time: iso(12) });

    assert.equal(res.status, 201);
    assert.deepEqual(Object.keys(res.body.pet.tutor).sort(), ['email', 'full_name', 'id', 'phone']);
    const json = JSON.stringify(res.body);
    assert.ok(!json.includes('nao-pode-vazar'));
    assert.ok(!json.includes('"document"'));
  });

  test('pet de outro tutor retorna 403', async (t) => {
    const state = stubCreation(t, { provider: partner(3), pet: { id: PET_ID, tutor_id: TUTOR_B_ID } });

    const res = await postAppointment(TUTOR_A_TOKEN, { start_time: iso(10), end_time: iso(12) });

    assert.equal(res.status, 403);
    assert.equal(state.created, null);
  });

  test('serviço inexistente retorna 404', async (t) => {
    stubPrisma(t, { 'service.findUnique': async () => null });

    const res = await postAppointment(TUTOR_A_TOKEN, { start_time: iso(10), end_time: iso(12) });

    assert.equal(res.status, 404);
  });

  test('parceiro não pode criar agendamento, nem mandando outro usuário no body', async (t) => {
    const state = stubCreation(t, { provider: partner(3) });

    const res = await postAppointment(HOTEL_TOKEN, {
      start_time: iso(10),
      end_time: iso(12),
      userId: TUTOR_A_ID,
      userRole: 5,
    });

    assert.equal(res.status, 403);
    assert.equal(state.created, null);
  });

  test('parceiro que não está operando retorna 403 PROVIDER_NOT_OPERATIONAL', async (t) => {
    const state = stubCreation(t, { provider: partner(4, { user: { sitter_evaluations: [] } }) });

    const res = await postAppointment(TUTOR_A_TOKEN, { start_time: iso(10), end_time: iso(10, 2) });

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'PROVIDER_NOT_OPERATIONAL');
    assert.equal(state.created, null);
  });

  test('conflito de horário retorna 409 SCHEDULE_CONFLICT', async (t) => {
    const state = stubCreation(t, { provider: partner(3), conflict: { pet_id: PET_ID } });

    const res = await postAppointment(TUTOR_A_TOKEN, { start_time: iso(10), end_time: iso(12) });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'SCHEDULE_CONFLICT');
    assert.equal(state.created, null);
  });

  test('início no passado retorna 422', async (t) => {
    stubCreation(t, { provider: partner(3) });

    const res = await postAppointment(TUTOR_A_TOKEN, { start_time: iso(-1), end_time: iso(1) });

    assert.equal(res.status, 422);
  });

  test('período acima do limite retorna 422', async (t) => {
    stubCreation(t, { provider: partner(4) });

    const res = await postAppointment(TUTOR_A_TOKEN, { start_time: iso(10), end_time: iso(10, 13) });

    assert.equal(res.status, 422);
  });

  test('data sem fuso retorna 422', async () => {
    const res = await postAppointment(TUTOR_A_TOKEN, {
      start_time: '2030-11-10T14:00:00',
      end_time: '2030-11-12T10:00:00',
    });

    assert.equal(res.status, 422);
  });

  test('body inválido retorna 422', async () => {
    // Não precisa de stub — o Zod rejeita antes de chegar ao use case
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${TUTOR_A_TOKEN}`)
      .send({ service_id: 'nao-e-uuid' });

    assert.equal(res.status, 422);
  });
});

// ============================================================
// GET /api/v1/appointments
// ============================================================

function makeFormattedAppointment(overrides = {}) {
  return {
    id: 'appt-001',
    provider_id: HOTEL_PROVIDER_ID,
    service_id: SERVICE_ID,
    pet_id: PET_ID,
    start_time: '2026-11-10T14:00:00.000Z',
    end_time: '2026-11-12T10:00:00.000Z',
    status: S.CONFIRMED,
    payment_policy: PAYMENT_POLICY.ON_SITE,
    total_price: 240,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pet: {
      id: PET_ID,
      tutor_id: TUTOR_A_ID,
      name: 'Rex',
      species: 'Cachorro',
      tutor: {
        id: TUTOR_A_ID,
        full_name: 'Tutor A',
        email: 'tutora@test.com',
        phone: '(11) 99999-0000',
      },
    },
    service: {
      id: SERVICE_ID,
      provider_id: HOTEL_PROVIDER_ID,
      name: 'Hospedagem',
      category: 'BOARDING',
      price: 120,
      is_active: true,
    },
    provider: {
      id: HOTEL_PROVIDER_ID,
      user_id: HOTEL_USER_ID,
      business_name: 'Hotel Bom Pêlo',
      status: 'APROVADO',
      payment_policy: PAYMENT_POLICY.ON_SITE,
      daily_rate: 120,
      hourly_rate: null,
    },
    ...overrides,
  };
}

describe('GET /api/v1/appointments', () => {
  let origListTutor;
  let origListProvider;

  beforeEach(() => {
    origListTutor = listAppointmentsUseCase.listForTutor;
    origListProvider = listAppointmentsUseCase.listForProvider;
  });

  test('tutor lista apenas seus agendamentos', async (t) => {
    const appt = makeFormattedAppointment({ id: 'appt-tutor-a' });
    listAppointmentsUseCase.listForTutor = async (userId) => {
      assert.equal(userId, TUTOR_A_ID);
      return [appt];
    };
    t.after(() => { listAppointmentsUseCase.listForTutor = origListTutor; });

    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${TUTOR_A_TOKEN}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].id, 'appt-tutor-a');
  });

  test('parceiro lista apenas sua agenda', async (t) => {
    const appt = makeFormattedAppointment({ id: 'appt-hotel-1' });
    listAppointmentsUseCase.listForProvider = async (userId) => {
      assert.equal(userId, HOTEL_USER_ID);
      return [appt];
    };
    t.after(() => { listAppointmentsUseCase.listForProvider = origListProvider; });

    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${HOTEL_TOKEN}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].id, 'appt-hotel-1');
  });

  test('tutor B não vê agendamentos do tutor A (ownership)', async (t) => {
    listAppointmentsUseCase.listForTutor = async (userId) => {
      // tutor B não tem agendamentos
      if (userId === TUTOR_B_ID) return [];
      return [makeFormattedAppointment()];
    };
    t.after(() => { listAppointmentsUseCase.listForTutor = origListTutor; });

    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${TUTOR_B_TOKEN}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.length, 0);
  });
});

// ============================================================
// PATCH /api/v1/appointments/:id/status
// ============================================================

const PROVIDERS_BY_USER = {
  [HOTEL_USER_ID]: { id: HOTEL_PROVIDER_ID },
  [SITTER_USER_ID]: { id: SITTER_PROVIDER_ID },
};

/**
 * Agendamento gravado + Prisma da troca de status. `updateMany` só altera se o
 * status ainda for o lido (como o banco faria); `lostRace` simula outra
 * requisição mudando o status antes.
 */
function stubStoredAppointment(t, overrides = {}, { lostRace = false } = {}) {
  let current = {
    id: APPOINTMENT_ID,
    provider_id: HOTEL_PROVIDER_ID,
    service_id: SERVICE_ID,
    pet_id: PET_ID,
    status: S.PENDING,
    payment_policy: PAYMENT_POLICY.ON_SITE,
    start_time: fromNow(5),
    end_time: fromNow(7),
    total_price: '240.00',
    pet: { id: PET_ID, tutor_id: TUTOR_A_ID, name: 'Rex', tutor: tutorA },
    service: { id: SERVICE_ID, price: '120.00' },
    provider: partner(3),
    ...overrides,
  };

  stubPrisma(t, {
    'appointment.findUnique': async ({ where }) => (where.id === current.id ? current : null),
    'appointment.updateMany': async ({ where, data }) => {
      if (lostRace || where.id !== current.id || where.status !== current.status) return { count: 0 };
      current = { ...current, ...data };
      return { count: 1 };
    },
    'provider.findUnique': async ({ where }) => PROVIDERS_BY_USER[where.user_id] ?? null,
  });
}

const patchStatus = (token, status, id = APPOINTMENT_ID) =>
  request(app)
    .patch(`/api/v1/appointments/${id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send(status === undefined ? {} : { status });

describe('PATCH /api/v1/appointments/:id/status', () => {
  test('PRESENCIAL: parceiro confirma um PENDENTE', async (t) => {
    stubStoredAppointment(t);

    const res = await patchStatus(HOTEL_TOKEN, 'CONFIRMADO');

    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.status, S.CONFIRMED);
  });

  test('PRE_PAGO pago: sitter confirma um AGUARDANDO_CONFIRMACAO', async (t) => {
    stubStoredAppointment(t, {
      provider_id: SITTER_PROVIDER_ID,
      status: S.AWAITING_CONFIRMATION,
      payment_policy: PAYMENT_POLICY.PREPAID,
    });

    const res = await patchStatus(SITTER_TOKEN, 'CONFIRMADO');

    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.status, S.CONFIRMED);
  });

  test('PRE_PAGO pago: recusa sem estorno inventado na resposta (estorno é da PAG-2)', async (t) => {
    stubStoredAppointment(t, {
      status: S.AWAITING_CONFIRMATION,
      payment_policy: PAYMENT_POLICY.PREPAID,
    });

    const res = await patchStatus(HOTEL_TOKEN, 'RECUSADO');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, S.REJECTED);
    assert.equal('refund' in res.body, false);
  });

  test('PRE_PAGO não pago: parceiro não confirma (422)', async (t) => {
    stubStoredAppointment(t, { payment_policy: PAYMENT_POLICY.PREPAID });

    const res = await patchStatus(HOTEL_TOKEN, 'CONFIRMADO');

    assert.equal(res.status, 422);
  });

  test('AGUARDANDO_CONFIRMACAO e PENDENTE não são aceitos pela rota (422)', async (t) => {
    stubStoredAppointment(t, { payment_policy: PAYMENT_POLICY.PREPAID });

    for (const status of ['AGUARDANDO_CONFIRMACAO', 'PENDENTE']) {
      const res = await patchStatus(HOTEL_TOKEN, status);
      assert.equal(res.status, 422, status);
    }
  });

  test('parceiro conclui um CONFIRMADO depois do início', async (t) => {
    stubStoredAppointment(t, { status: S.CONFIRMED, start_time: fromNow(0, -2), end_time: fromNow(1) });

    const res = await patchStatus(HOTEL_TOKEN, 'CONCLUIDO');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, S.COMPLETED);
  });

  test('concluir antes do início retorna 422', async (t) => {
    stubStoredAppointment(t, { status: S.CONFIRMED });

    const res = await patchStatus(HOTEL_TOKEN, 'CONCLUIDO');

    assert.equal(res.status, 422);
  });

  test('tutor cancela um CONFIRMADO antes do início', async (t) => {
    stubStoredAppointment(t, { status: S.CONFIRMED });

    const res = await patchStatus(TUTOR_A_TOKEN, 'CANCELADO');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, S.CANCELLED);
  });

  test('cancelar depois do início retorna 422', async (t) => {
    stubStoredAppointment(t, { status: S.CONFIRMED, start_time: fromNow(0, -1), end_time: fromNow(1) });

    const res = await patchStatus(TUTOR_A_TOKEN, 'CANCELADO');

    assert.equal(res.status, 422);
  });

  test('transição inexistente (PENDENTE → CONCLUIDO) retorna 422', async (t) => {
    stubStoredAppointment(t, { start_time: fromNow(0, -2) });

    const res = await patchStatus(HOTEL_TOKEN, 'CONCLUIDO');

    assert.equal(res.status, 422);
  });

  test('estado terminal CONCLUIDO não aceita nova transição → 422', async (t) => {
    stubStoredAppointment(t, { status: S.COMPLETED });

    const res = await patchStatus(TUTOR_A_TOKEN, 'CANCELADO');

    assert.equal(res.status, 422);
  });

  test('tutor não pode confirmar → 403', async (t) => {
    stubStoredAppointment(t);

    const res = await patchStatus(TUTOR_A_TOKEN, 'CONFIRMADO');

    assert.equal(res.status, 403);
  });

  test('terceiro sem ownership recebe 403', async (t) => {
    stubStoredAppointment(t);

    assert.equal((await patchStatus(TUTOR_B_TOKEN, 'CANCELADO')).status, 403);
    assert.equal((await patchStatus(SITTER_TOKEN, 'CONFIRMADO')).status, 403);
  });

  test('agendamento inexistente retorna 404', async (t) => {
    stubStoredAppointment(t);

    const res = await patchStatus(HOTEL_TOKEN, 'CONFIRMADO', '00000000-0000-4000-a000-999999999999');

    assert.equal(res.status, 404);
  });

  test('outra requisição mudou o status antes → 409', async (t) => {
    stubStoredAppointment(t, {}, { lostRace: true });

    const res = await patchStatus(HOTEL_TOKEN, 'CONFIRMADO');

    assert.equal(res.status, 409);
  });

  test('body sem status retorna 422', async () => {
    const res = await patchStatus(HOTEL_TOKEN, undefined);

    assert.equal(res.status, 422);
  });
});

// ============================================================
// Serialização e segurança
// ============================================================

describe('Serialização — campos sensíveis', () => {
  let origListTutor;

  beforeEach(() => {
    origListTutor = listAppointmentsUseCase.listForTutor;
  });

  test('total_price é numérico e password_hash não aparece', async (t) => {
    const appt = makeFormattedAppointment();
    listAppointmentsUseCase.listForTutor = async () => [appt];
    t.after(() => { listAppointmentsUseCase.listForTutor = origListTutor; });

    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${TUTOR_A_TOKEN}`);

    assert.equal(res.status, 200);
    const item = res.body[0];
    assert.equal(typeof item.total_price, 'number');

    const json = JSON.stringify(item);
    assert.ok(!json.includes('password_hash'), 'password_hash vazou na resposta');
  });

  test('document do provider não aparece na troca de status', async (t) => {
    stubStoredAppointment(t);

    const res = await patchStatus(HOTEL_TOKEN, 'CONFIRMADO');

    assert.equal(res.status, 200);
    const json = JSON.stringify(res.body);
    assert.ok(!json.includes('"document"'), 'document vazou na resposta');
    assert.ok(!json.includes('"document_type"'), 'document_type vazou na resposta');
    assert.ok(!json.includes('nao-pode-vazar'), 'password_hash do tutor vazou na resposta');
  });
});
