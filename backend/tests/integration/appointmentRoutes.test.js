process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signTestToken } = require('../helpers/authState');

// --- Mock dos repositórios/use cases ANTES de importar o app ---
// O Prisma Client usa lazy proxies, então mock.method falha.
// Em vez disso, substituímos os métodos diretamente nos módulos singleton.

const createAppointmentUseCase = require('../../src/useCases/appointments/CreateAppointmentUseCase');
const listAppointmentsUseCase = require('../../src/useCases/appointments/ListAppointmentsUseCase');
const updateAppointmentStatusUseCase = require('../../src/useCases/appointments/UpdateAppointmentStatusUseCase');

const app = require('../../src/app');
const { APPOINTMENT_STATUS } = require('../../src/constants/appointmentStatus');
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

// --- Fixtures ---

function makeFormattedAppointment(overrides = {}) {
  return {
    id: 'appt-001',
    provider_id: 'provider-hotel-001',
    service_id: 'service-hotel-001',
    pet_id: 'pet-a-001',
    start_time: '2026-11-10T14:00:00.000Z',
    end_time: '2026-11-12T10:00:00.000Z',
    status: APPOINTMENT_STATUS.CONFIRMED,
    total_price: 240,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pet: {
      id: 'pet-a-001',
      tutor_id: TUTOR_A_ID,
      name: 'Rex',
      species: 'Cachorro',
      tutor: {
        id: TUTOR_A_ID,
        full_name: 'Tutor A',
        email: 'tutora@test.com',
        role_id: 5,
        // password_hash DEVE estar ausente após formatação
      },
    },
    service: {
      id: 'service-hotel-001',
      provider_id: 'provider-hotel-001',
      name: 'Hospedagem',
      category: 'BOARDING',
      price: 120,
      is_active: true,
    },
    provider: {
      id: 'provider-hotel-001',
      user_id: HOTEL_USER_ID,
      business_name: 'Hotel Bom Pêlo',
      status: 'APROVADO',
      payment_policy: PAYMENT_POLICY.ON_SITE,
      daily_rate: 120,
      hourly_rate: null,
      // document DEVE estar ausente após formatação
    },
    ...overrides,
  };
}

// ============================================================
// POST /api/v1/appointments
// ============================================================

describe('POST /api/v1/appointments', () => {
  let originalExecute;

  beforeEach(() => {
    originalExecute = createAppointmentUseCase.execute;
  });

  test('PRESENCIAL cria agendamento com status CONFIRMADO', async (t) => {
    createAppointmentUseCase.execute = async (params) => {
      assert.equal(params.userId, TUTOR_A_ID);
      return makeFormattedAppointment({ status: APPOINTMENT_STATUS.CONFIRMED });
    };
    t.after(() => { createAppointmentUseCase.execute = originalExecute; });

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${TUTOR_A_TOKEN}`)
      .send({
        service_id: '00000000-0000-4000-a000-000000000010',
        pet_id: '00000000-0000-4000-a000-000000000020',
        start_time: '2026-11-10T14:00:00Z',
        end_time: '2026-11-12T10:00:00Z',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.status, APPOINTMENT_STATUS.CONFIRMED);
    assert.equal(typeof res.body.total_price, 'number');
    assert.ok(res.body.total_price > 0);
  });

  test('PRE_PAGO cria agendamento com status AGUARDANDO_CONFIRMACAO', async (t) => {
    createAppointmentUseCase.execute = async () => {
      return makeFormattedAppointment({
        status: APPOINTMENT_STATUS.AWAITING_CONFIRMATION,
        provider: {
          ...makeFormattedAppointment().provider,
          payment_policy: PAYMENT_POLICY.PREPAID,
        },
      });
    };
    t.after(() => { createAppointmentUseCase.execute = originalExecute; });

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${TUTOR_A_TOKEN}`)
      .send({
        service_id: '00000000-0000-4000-a000-000000000010',
        pet_id: '00000000-0000-4000-a000-000000000020',
        start_time: '2026-11-10T14:00:00Z',
        end_time: '2026-11-10T16:00:00Z',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.status, APPOINTMENT_STATUS.AWAITING_CONFIRMATION);
  });

  test('pet de outro tutor retorna 403', async (t) => {
    const AppError = require('../../src/utils/AppError');
    createAppointmentUseCase.execute = async () => {
      throw AppError.forbidden('Este pet não pertence a você.');
    };
    t.after(() => { createAppointmentUseCase.execute = originalExecute; });

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${TUTOR_A_TOKEN}`)
      .send({
        service_id: '00000000-0000-4000-a000-000000000010',
        pet_id: '00000000-0000-4000-a000-000000000020',
        start_time: '2026-11-10T14:00:00Z',
        end_time: '2026-11-12T10:00:00Z',
      });

    assert.equal(res.status, 403);
  });

  test('serviço inexistente retorna 404', async (t) => {
    const AppError = require('../../src/utils/AppError');
    createAppointmentUseCase.execute = async () => {
      throw AppError.notFound('Serviço não encontrado.');
    };
    t.after(() => { createAppointmentUseCase.execute = originalExecute; });

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${TUTOR_A_TOKEN}`)
      .send({
        service_id: '00000000-0000-4000-a000-999999999999',
        pet_id: '00000000-0000-4000-a000-000000000020',
        start_time: '2026-11-10T14:00:00Z',
        end_time: '2026-11-12T10:00:00Z',
      });

    assert.equal(res.status, 404);
  });

  test('parceiro não pode criar agendamento (role 3)', async (t) => {
    const AppError = require('../../src/utils/AppError');
    createAppointmentUseCase.execute = async () => {
      throw AppError.forbidden('Apenas tutores podem criar agendamentos.');
    };
    t.after(() => { createAppointmentUseCase.execute = originalExecute; });

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${HOTEL_TOKEN}`)
      .send({
        service_id: '00000000-0000-4000-a000-000000000010',
        pet_id: '00000000-0000-4000-a000-000000000020',
        start_time: '2026-11-10T14:00:00Z',
        end_time: '2026-11-12T10:00:00Z',
      });

    assert.equal(res.status, 403);
  });

  test('body inválido retorna 422', async (t) => {
    // Não precisa mock — o Zod rejeita antes de chegar ao use case
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

describe('PATCH /api/v1/appointments/:id/status', () => {
  let origExecute;

  beforeEach(() => {
    origExecute = updateAppointmentStatusUseCase.execute;
  });

  test('parceiro confirma agendamento AGUARDANDO_CONFIRMACAO → CONFIRMADO', async (t) => {
    updateAppointmentStatusUseCase.execute = async ({ status }) => {
      assert.equal(status, 'CONFIRMADO');
      return makeFormattedAppointment({ status: APPOINTMENT_STATUS.CONFIRMED });
    };
    t.after(() => { updateAppointmentStatusUseCase.execute = origExecute; });

    const res = await request(app)
      .patch('/api/v1/appointments/00000000-0000-4000-a000-000000000099/status')
      .set('Authorization', `Bearer ${SITTER_TOKEN}`)
      .send({ status: 'CONFIRMADO' });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, APPOINTMENT_STATUS.CONFIRMED);
  });

  test('parceiro recusa agendamento PRE_PAGO → RECUSADO com estorno', async (t) => {
    updateAppointmentStatusUseCase.execute = async () => {
      return {
        ...makeFormattedAppointment({ status: APPOINTMENT_STATUS.REJECTED }),
        refund: { status: 'ESTORNADO', simulated: true, amount: 240 },
      };
    };
    t.after(() => { updateAppointmentStatusUseCase.execute = origExecute; });

    const res = await request(app)
      .patch('/api/v1/appointments/00000000-0000-4000-a000-000000000099/status')
      .set('Authorization', `Bearer ${SITTER_TOKEN}`)
      .send({ status: 'RECUSADO' });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, APPOINTMENT_STATUS.REJECTED);
    assert.ok(res.body.refund, 'Deveria ter campo refund para PRE_PAGO recusado');
    assert.equal(res.body.refund.status, 'ESTORNADO');
    assert.equal(res.body.refund.simulated, true);
    assert.equal(typeof res.body.refund.amount, 'number');
  });

  test('parceiro conclui agendamento CONFIRMADO → CONCLUIDO', async (t) => {
    updateAppointmentStatusUseCase.execute = async () => {
      return makeFormattedAppointment({ status: APPOINTMENT_STATUS.COMPLETED });
    };
    t.after(() => { updateAppointmentStatusUseCase.execute = origExecute; });

    const res = await request(app)
      .patch('/api/v1/appointments/00000000-0000-4000-a000-000000000099/status')
      .set('Authorization', `Bearer ${HOTEL_TOKEN}`)
      .send({ status: 'CONCLUIDO' });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, APPOINTMENT_STATUS.COMPLETED);
  });

  test('tutor cancela agendamento CONFIRMADO → CANCELADO', async (t) => {
    updateAppointmentStatusUseCase.execute = async () => {
      return makeFormattedAppointment({ status: APPOINTMENT_STATUS.CANCELLED });
    };
    t.after(() => { updateAppointmentStatusUseCase.execute = origExecute; });

    const res = await request(app)
      .patch('/api/v1/appointments/00000000-0000-4000-a000-000000000099/status')
      .set('Authorization', `Bearer ${TUTOR_A_TOKEN}`)
      .send({ status: 'CANCELADO' });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, APPOINTMENT_STATUS.CANCELLED);
  });

  test('transição inválida retorna 422', async (t) => {
    const AppError = require('../../src/utils/AppError');
    updateAppointmentStatusUseCase.execute = async () => {
      throw AppError.validation('Transição inválida: "PENDENTE" → "CONCLUIDO".');
    };
    t.after(() => { updateAppointmentStatusUseCase.execute = origExecute; });

    const res = await request(app)
      .patch('/api/v1/appointments/00000000-0000-4000-a000-000000000099/status')
      .set('Authorization', `Bearer ${HOTEL_TOKEN}`)
      .send({ status: 'CONCLUIDO' });

    assert.equal(res.status, 422);
  });

  test('estado terminal CONCLUIDO não aceita nova transição → 422', async (t) => {
    const AppError = require('../../src/utils/AppError');
    updateAppointmentStatusUseCase.execute = async () => {
      throw AppError.validation('Transição inválida.');
    };
    t.after(() => { updateAppointmentStatusUseCase.execute = origExecute; });

    const res = await request(app)
      .patch('/api/v1/appointments/00000000-0000-4000-a000-000000000099/status')
      .set('Authorization', `Bearer ${HOTEL_TOKEN}`)
      .send({ status: 'CANCELADO' });

    assert.equal(res.status, 422);
  });

  test('tutor não pode confirmar (só cancelar) → 403', async (t) => {
    const AppError = require('../../src/utils/AppError');
    updateAppointmentStatusUseCase.execute = async () => {
      throw AppError.forbidden('Tutores só podem cancelar agendamentos.');
    };
    t.after(() => { updateAppointmentStatusUseCase.execute = origExecute; });

    const res = await request(app)
      .patch('/api/v1/appointments/00000000-0000-4000-a000-000000000099/status')
      .set('Authorization', `Bearer ${TUTOR_A_TOKEN}`)
      .send({ status: 'CONFIRMADO' });

    assert.equal(res.status, 403);
  });

  test('terceiro sem ownership recebe 403', async (t) => {
    const AppError = require('../../src/utils/AppError');
    updateAppointmentStatusUseCase.execute = async () => {
      throw AppError.forbidden('Sem permissão.');
    };
    t.after(() => { updateAppointmentStatusUseCase.execute = origExecute; });

    const res = await request(app)
      .patch('/api/v1/appointments/00000000-0000-4000-a000-000000000099/status')
      .set('Authorization', `Bearer ${TUTOR_B_TOKEN}`)
      .send({ status: 'CANCELADO' });

    assert.equal(res.status, 403);
  });

  test('agendamento inexistente retorna 404', async (t) => {
    const AppError = require('../../src/utils/AppError');
    updateAppointmentStatusUseCase.execute = async () => {
      throw AppError.notFound('Agendamento não encontrado.');
    };
    t.after(() => { updateAppointmentStatusUseCase.execute = origExecute; });

    const res = await request(app)
      .patch('/api/v1/appointments/00000000-0000-4000-a000-999999999999/status')
      .set('Authorization', `Bearer ${HOTEL_TOKEN}`)
      .send({ status: 'CONFIRMADO' });

    assert.equal(res.status, 404);
  });

  test('body sem status retorna 422', async () => {
    const res = await request(app)
      .patch('/api/v1/appointments/00000000-0000-4000-a000-000000000099/status')
      .set('Authorization', `Bearer ${HOTEL_TOKEN}`)
      .send({});

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

  test('document do provider não aparece na resposta', async (t) => {
    const appt = makeFormattedAppointment();
    listAppointmentsUseCase.listForTutor = async () => [appt];
    t.after(() => { listAppointmentsUseCase.listForTutor = origListTutor; });

    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${TUTOR_A_TOKEN}`);

    assert.equal(res.status, 200);
    const json = JSON.stringify(res.body[0]);
    assert.ok(!json.includes('"document"'), 'document vazou na resposta');
    assert.ok(!json.includes('"document_type"'), 'document_type vazou na resposta');
  });
});
