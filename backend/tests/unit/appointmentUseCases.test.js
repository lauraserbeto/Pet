process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../../src/config/database');
const appointmentRepo = require('../../src/repositories/AppointmentRepository');
const {
  CreateAppointmentUseCase,
  MAX_HOTEL_DAILY_RATES,
  MAX_SITTER_HOURS,
} = require('../../src/useCases/appointments/CreateAppointmentUseCase');
const listAppointmentsUseCase = require('../../src/useCases/appointments/ListAppointmentsUseCase');
const { UpdateAppointmentStatusUseCase } = require('../../src/useCases/appointments/UpdateAppointmentStatusUseCase');

const { APPOINTMENT_STATUS: S, ACTIVE_APPOINTMENT_STATUSES } = require('../../src/constants/appointmentStatus');
const { PAYMENT_POLICY } = require('../../src/constants/paymentPolicy');
const AppError = require('../../src/utils/AppError');

const TUTOR_A_ID = '00000000-0000-4000-a000-000000000001';
const TUTOR_B_ID = '00000000-0000-4000-a000-000000000002';
const HOTEL_USER_ID = '00000000-0000-4000-a000-000000000003';
const SITTER_USER_ID = '00000000-0000-4000-a000-000000000004';
const STRANGER_USER_ID = '00000000-0000-4000-a000-000000000099';

// Relógio fixo: "agora" é 01/11/2026 ao meio-dia (-03:00).
const NOW = new Date('2026-11-01T12:00:00-03:00');
const now = () => NOW;

const rejectsWith = (promise, statusCode, code) =>
  assert.rejects(promise, (err) => {
    assert.ok(err instanceof AppError, `esperava AppError, veio ${err}`);
    assert.equal(err.statusCode, statusCode, err.message);
    if (code) assert.equal(err.code, code);
    return true;
  });

// ============================================================
// CreateAppointmentUseCase
// ============================================================

// Parceiro operacional (E-01) com tarifas do perfil diferentes do preço do
// serviço, para provar que o total segue o serviço (DEC-B).
function partner(roleId, overrides = {}) {
  return {
    id: roleId === 3 ? 'prov-hotel-1' : 'prov-sitter-1',
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

function serviceOf(provider, overrides = {}) {
  return { id: `srv-${provider.id}`, is_active: true, price: '100.00', provider, ...overrides };
}

/** Banco falso: registra as consultas e responde o que o teste definir. */
function fakeCreateDb({ service, pet = { id: 'pet-1', tutor_id: TUTOR_A_ID }, conflict = null } = {}) {
  const calls = { locks: [], conflictQuery: null, created: null };
  const tx = {
    $queryRaw: async (strings, ...values) => {
      calls.locks.push({ sql: strings.join('?'), values });
      return [];
    },
    appointment: {
      findFirst: async (args) => {
        calls.conflictQuery = args;
        return conflict;
      },
      create: async ({ data }) => {
        calls.created = data;
        return { id: 'appt-new', ...data, created_at: NOW, updated_at: NOW };
      },
    },
  };
  const db = {
    service: { findUnique: async () => service },
    pet: { findUnique: async () => pet },
    $transaction: async (fn) => fn(tx),
  };
  return { db, calls };
}

const createWith = (db) => new CreateAppointmentUseCase({ db, now });

const booking = (overrides = {}) => ({
  userId: TUTOR_A_ID,
  userRole: 5,
  service_id: 'srv-1',
  pet_id: 'pet-1',
  start_time: '2026-11-10T14:00:00-03:00',
  end_time: '2026-11-12T10:00:00-03:00', // 2 diárias
  ...overrides,
});

describe('CreateAppointmentUseCase (DEC-A, DEC-B, P2, P3)', () => {
  test('hotel PRESENCIAL: nasce PENDENTE, grava a política e cobra o preço do serviço × diárias', async () => {
    const { db, calls } = fakeCreateDb({ service: serviceOf(partner(3)) });

    const result = await createWith(db).execute(booking());

    assert.equal(calls.created.status, S.PENDING);
    assert.equal(calls.created.payment_policy, PAYMENT_POLICY.ON_SITE);
    assert.equal(calls.created.total_price, 200); // 100 × 2, não 999 × 2
    assert.equal(result.status, S.PENDING);
    assert.equal(result.payment_policy, PAYMENT_POLICY.ON_SITE);
    assert.deepEqual(result.pricing, { unit: 'DIARIA', quantity: 2, unit_price: 100 });
  });

  test('sitter PRE_PAGO: também nasce PENDENTE (só o pagamento leva a AGUARDANDO_CONFIRMACAO)', async () => {
    const provider = partner(4, { payment_policy: PAYMENT_POLICY.PREPAID });
    const { db, calls } = fakeCreateDb({ service: serviceOf(provider, { price: 50 }) });

    const result = await createWith(db).execute(
      booking({ start_time: '2026-11-10T14:00:00Z', end_time: '2026-11-10T16:00:00Z' })
    );

    assert.equal(calls.created.status, S.PENDING);
    assert.equal(calls.created.payment_policy, PAYMENT_POLICY.PREPAID);
    assert.equal(result.total_price, 100);
    assert.deepEqual(result.pricing, { unit: 'HORA', quantity: 2, unit_price: 50 });
  });

  test('parceiro sem política definida grava PRESENCIAL', async () => {
    const { db, calls } = fakeCreateDb({ service: serviceOf(partner(3, { payment_policy: null })) });

    await createWith(db).execute(booking());

    assert.equal(calls.created.payment_policy, PAYMENT_POLICY.ON_SITE);
  });

  test('só tutor cria agendamento', async () => {
    const { db } = fakeCreateDb({ service: serviceOf(partner(3)) });

    await rejectsWith(createWith(db).execute(booking({ userRole: 3 })), 403);
    await rejectsWith(createWith(db).execute(booking({ userRole: undefined })), 403);
  });

  test('404 para serviço ou pet inexistente', async () => {
    await rejectsWith(createWith(fakeCreateDb({ service: null }).db).execute(booking()), 404);
    await rejectsWith(
      createWith(fakeCreateDb({ service: serviceOf(partner(3)), pet: null }).db).execute(booking()),
      404
    );
  });

  test('403 se o pet pertencer a outro tutor', async () => {
    const { db, calls } = fakeCreateDb({
      service: serviceOf(partner(3)),
      pet: { id: 'pet-1', tutor_id: TUTOR_B_ID },
    });

    await rejectsWith(createWith(db).execute(booking()), 403);
    assert.equal(calls.created, null);
  });

  test('400 se o serviço estiver desativado ou não for de hotel/pet sitter', async () => {
    const desativado = fakeCreateDb({ service: serviceOf(partner(3), { is_active: false }) });
    await rejectsWith(createWith(desativado.db).execute(booking()), 400);

    const lojista = fakeCreateDb({ service: serviceOf(partner(2)) });
    await rejectsWith(createWith(lojista.db).execute(booking()), 400);
  });

  test('403 PROVIDER_NOT_OPERATIONAL para parceiro não aprovado, inativo ou sitter sem avaliação', async () => {
    const naoOperacionais = [
      partner(3, { status: 'PENDENTE' }),
      partner(3, { status: 'REJEITADO' }),
      partner(3, { user: { is_active: false } }),
      partner(4, { user: { sitter_evaluations: [] } }),
    ];

    for (const provider of naoOperacionais) {
      const { db, calls } = fakeCreateDb({ service: serviceOf(provider) });
      await rejectsWith(createWith(db).execute(booking()), 403, 'PROVIDER_NOT_OPERATIONAL');
      assert.equal(calls.created, null);
    }
  });

  test('422 para início no passado ou agora', async () => {
    const { db, calls } = fakeCreateDb({ service: serviceOf(partner(3)) });

    await rejectsWith(
      createWith(db).execute(booking({ start_time: '2026-10-30T14:00:00-03:00' })),
      422
    );
    await rejectsWith(createWith(db).execute(booking({ start_time: NOW.toISOString() })), 422);
    assert.equal(calls.created, null);
  });

  test('422 para fim igual ou anterior ao início', async () => {
    const { db } = fakeCreateDb({ service: serviceOf(partner(3)) });

    await rejectsWith(
      createWith(db).execute(
        booking({ start_time: '2026-11-10T14:00:00Z', end_time: '2026-11-10T14:00:00Z' })
      ),
      422
    );
  });

  test(`hotel: até ${MAX_HOTEL_DAILY_RATES} diárias; acima disso 422`, async () => {
    const { db } = fakeCreateDb({ service: serviceOf(partner(3)) });

    const ok = await createWith(db).execute(
      booking({ start_time: '2026-11-10T14:00:00-03:00', end_time: '2026-12-10T10:00:00-03:00' })
    );
    assert.equal(ok.pricing.quantity, 30);

    await rejectsWith(
      createWith(db).execute(
        booking({ start_time: '2026-11-10T14:00:00-03:00', end_time: '2026-12-11T10:00:00-03:00' })
      ),
      422
    );
  });

  test(`sitter: até ${MAX_SITTER_HOURS} horas; acima disso 422`, async () => {
    const { db } = fakeCreateDb({ service: serviceOf(partner(4)) });

    const ok = await createWith(db).execute(
      booking({ start_time: '2026-11-10T08:00:00Z', end_time: '2026-11-10T20:00:00Z' })
    );
    assert.equal(ok.pricing.quantity, 12);

    await rejectsWith(
      createWith(db).execute(
        booking({ start_time: '2026-11-10T08:00:00Z', end_time: '2026-11-10T20:01:00Z' })
      ),
      422
    );
  });

  test('conflito: procura agendamentos ativos que se sobrepõem ao período', async () => {
    const { db, calls } = fakeCreateDb({ service: serviceOf(partner(3)) });

    await createWith(db).execute(booking());

    const { where } = calls.conflictQuery;
    assert.deepEqual(where.status.in, [...ACTIVE_APPOINTMENT_STATUSES]);
    assert.equal(where.start_time.lt.toISOString(), '2026-11-12T13:00:00.000Z');
    assert.equal(where.end_time.gt.toISOString(), '2026-11-10T17:00:00.000Z');
  });

  test('hotel: só o pet entra no conflito (vários pets ao mesmo tempo são permitidos)', async () => {
    const { db, calls } = fakeCreateDb({ service: serviceOf(partner(3)) });

    await createWith(db).execute(booking());

    assert.deepEqual(calls.conflictQuery.where.OR, [{ pet_id: 'pet-1' }]);
    assert.equal(calls.locks.length, 1);
    assert.match(calls.locks[0].sql, /FROM pets/);
  });

  test('sitter: o pet e o sitter entram no conflito, com lock nos dois', async () => {
    const { db, calls } = fakeCreateDb({ service: serviceOf(partner(4)) });

    await createWith(db).execute(
      booking({ start_time: '2026-11-10T14:00:00Z', end_time: '2026-11-10T16:00:00Z' })
    );

    assert.deepEqual(calls.conflictQuery.where.OR, [
      { pet_id: 'pet-1' },
      { provider_id: 'prov-sitter-1' },
    ]);
    assert.deepEqual(
      calls.locks.map((lock) => lock.sql.match(/FROM (\w+)/)[1]),
      ['pets', 'providers']
    );
  });

  test('409 SCHEDULE_CONFLICT quando o mesmo pet já tem agendamento ativo no período', async () => {
    const { db, calls } = fakeCreateDb({
      service: serviceOf(partner(3)),
      conflict: { pet_id: 'pet-1' },
    });

    await assert.rejects(createWith(db).execute(booking()), (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, 'SCHEDULE_CONFLICT');
      assert.match(err.message, /pet já tem/);
      return true;
    });
    assert.equal(calls.created, null);
  });

  test('409 SCHEDULE_CONFLICT quando o pet sitter já atende outro pet no período', async () => {
    const { db, calls } = fakeCreateDb({
      service: serviceOf(partner(4)),
      conflict: { pet_id: 'pet-de-outro-tutor' },
    });

    await assert.rejects(
      createWith(db).execute(
        booking({ start_time: '2026-11-10T14:00:00Z', end_time: '2026-11-10T16:00:00Z' })
      ),
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.code, 'SCHEDULE_CONFLICT');
        assert.match(err.message, /pet sitter já tem/);
        return true;
      }
    );
    assert.equal(calls.created, null);
  });
});

// ============================================================
// ListAppointmentsUseCase
// ============================================================

describe('ListAppointmentsUseCase (Lógica Real e Isolamento)', () => {
  test('listForTutor consome appointmentRepo.findByCustomerId', async (t) => {
    const origFindByCust = appointmentRepo.findByCustomerId;
    t.after(() => {
      appointmentRepo.findByCustomerId = origFindByCust;
    });

    let queriedCustomerId = null;
    appointmentRepo.findByCustomerId = async (cid) => {
      queriedCustomerId = cid;
      return [{ id: 'appt-tutor', total_price: '120.00' }];
    };

    const res = await listAppointmentsUseCase.listForTutor(TUTOR_A_ID);
    assert.equal(queriedCustomerId, TUTOR_A_ID);
    assert.equal(res[0].total_price, 120);
  });

  test('listForProvider consome appointmentRepo.findByProviderId resolvendo provider.id', async (t) => {
    const origProviderFind = prisma.provider.findUnique;
    const origFindByProv = appointmentRepo.findByProviderId;

    t.after(() => {
      prisma.provider.findUnique = origProviderFind;
      appointmentRepo.findByProviderId = origFindByProv;
    });

    prisma.provider.findUnique = async ({ where }) => {
      if (where.user_id === HOTEL_USER_ID) return { id: 'prov-hotel-real' };
      return null;
    };

    let queriedProviderId = null;
    appointmentRepo.findByProviderId = async (pid) => {
      queriedProviderId = pid;
      return [{ id: 'appt-prov', total_price: '240.00' }];
    };

    const res = await listAppointmentsUseCase.listForProvider(HOTEL_USER_ID);
    assert.equal(queriedProviderId, 'prov-hotel-real');
    assert.equal(res[0].total_price, 240);
  });

  test('listForProvider bloqueia com 403 parceiro sem cadastro de Provider correspondente', async (t) => {
    const origProviderFind = prisma.provider.findUnique;
    t.after(() => {
      prisma.provider.findUnique = origProviderFind;
    });

    prisma.provider.findUnique = async () => null;

    await assert.rejects(
      () => listAppointmentsUseCase.listForProvider(HOTEL_USER_ID),
      (err) => err instanceof AppError && err.statusCode === 403
    );
  });

  test('findById bloqueia terceiro com 403 quando não é tutor do pet nem provider do agendamento', async (t) => {
    const origFindById = appointmentRepo.findById;
    t.after(() => {
      appointmentRepo.findById = origFindById;
    });

    appointmentRepo.findById = async () => ({
      id: 'appt-privado',
      provider_id: 'prov-1',
      pet: { tutor_id: TUTOR_A_ID },
    });

    await assert.rejects(
      () => listAppointmentsUseCase.findById('appt-privado', STRANGER_USER_ID, 5),
      (err) => err instanceof AppError && err.statusCode === 403
    );
  });
});

// ============================================================
// UpdateAppointmentStatusUseCase
// ============================================================

// Atendimento às 14h de 10/11 (depois do NOW).
const FUTURE_START = new Date('2026-11-10T14:00:00-03:00');

function storedAppointment(overrides = {}) {
  return {
    id: 'appt-1',
    provider_id: 'prov-hotel-1',
    status: S.PENDING,
    payment_policy: PAYMENT_POLICY.ON_SITE,
    start_time: FUTURE_START,
    end_time: new Date('2026-11-12T10:00:00-03:00'),
    total_price: '200.00',
    pet: { id: 'pet-1', tutor_id: TUTOR_A_ID },
    ...overrides,
  };
}

/**
 * Repositório e banco falsos. `currentProviderPolicy` simula o parceiro com a
 * política ATUAL — que o use case não deve consultar (vale a gravada).
 */
function fakeUpdateDeps({ appointment, count = 1, currentProviderPolicy = PAYMENT_POLICY.ON_SITE }) {
  const calls = { updateMany: null };
  const repository = {
    findById: async () =>
      appointment && calls.updateMany
        ? { ...appointment, status: calls.updateMany.data.status }
        : appointment,
  };
  const db = {
    provider: {
      findUnique: async ({ where }) => {
        if (where.user_id === HOTEL_USER_ID) {
          return { id: 'prov-hotel-1', payment_policy: currentProviderPolicy };
        }
        if (where.user_id === SITTER_USER_ID) {
          return { id: 'prov-sitter-1', payment_policy: currentProviderPolicy };
        }
        return null;
      },
    },
    appointment: {
      updateMany: async (args) => {
        calls.updateMany = args;
        return { count };
      },
    },
  };
  return { repository, db, calls };
}

const updateWith = (deps, at = NOW) =>
  new UpdateAppointmentStatusUseCase({ db: deps.db, repository: deps.repository, now: () => at });

const asHotel = (status) => ({ appointmentId: 'appt-1', status, userId: HOTEL_USER_ID, userRole: 3 });
const asTutor = (status) => ({ appointmentId: 'appt-1', status, userId: TUTOR_A_ID, userRole: 5 });

describe('UpdateAppointmentStatusUseCase (DEC-A)', () => {
  test('PRESENCIAL: parceiro confirma um PENDENTE, gravando só se o status ainda for o lido', async () => {
    const deps = fakeUpdateDeps({ appointment: storedAppointment() });

    const result = await updateWith(deps).execute(asHotel('CONFIRMADO'));

    assert.equal(result.status, S.CONFIRMED);
    assert.deepEqual(deps.calls.updateMany.where, { id: 'appt-1', status: S.PENDING });
    assert.equal(deps.calls.updateMany.data.status, S.CONFIRMED);
  });

  test('aceita os sinônimos antigos do status', async () => {
    const deps = fakeUpdateDeps({ appointment: storedAppointment() });

    const result = await updateWith(deps).execute(asHotel('confirmed'));

    assert.equal(result.status, S.CONFIRMED);
  });

  test('PRE_PAGO não pago: parceiro não confirma nem recusa (422 PAYMENT_REQUIRED)', async () => {
    for (const status of ['CONFIRMADO', 'RECUSADO']) {
      const deps = fakeUpdateDeps({
        appointment: storedAppointment({ payment_policy: PAYMENT_POLICY.PREPAID }),
        currentProviderPolicy: PAYMENT_POLICY.PREPAID,
      });

      await assert.rejects(updateWith(deps).execute(asHotel(status)), (err) => {
        assert.equal(err.statusCode, 422);
        assert.equal(err.details.reason, 'PAYMENT_REQUIRED');
        return true;
      });
      assert.equal(deps.calls.updateMany, null);
    }
  });

  test('vale a política gravada na reserva, não a atual do parceiro', async () => {
    // Reservado como PRESENCIAL; o parceiro passou a PRE_PAGO depois.
    const presencial = fakeUpdateDeps({
      appointment: storedAppointment({ payment_policy: PAYMENT_POLICY.ON_SITE }),
      currentProviderPolicy: PAYMENT_POLICY.PREPAID,
    });
    const confirmado = await updateWith(presencial).execute(asHotel('CONFIRMADO'));
    assert.equal(confirmado.status, S.CONFIRMED);

    // Reservado como PRE_PAGO; o parceiro voltou a PRESENCIAL depois.
    const prePago = fakeUpdateDeps({
      appointment: storedAppointment({ payment_policy: PAYMENT_POLICY.PREPAID }),
      currentProviderPolicy: PAYMENT_POLICY.ON_SITE,
    });
    await rejectsWith(updateWith(prePago).execute(asHotel('CONFIRMADO')), 422);
  });

  test('PRE_PAGO pago: parceiro recusa um AGUARDANDO_CONFIRMACAO, sem estorno inventado na resposta', async () => {
    const deps = fakeUpdateDeps({
      appointment: storedAppointment({
        status: S.AWAITING_CONFIRMATION,
        payment_policy: PAYMENT_POLICY.PREPAID,
      }),
    });

    const result = await updateWith(deps).execute(asHotel('RECUSADO'));

    assert.equal(result.status, S.REJECTED);
    assert.equal('refund' in result, false);
  });

  test('ninguém leva a PENDENTE ou AGUARDANDO_CONFIRMACAO pela rota de status (422)', async () => {
    for (const status of ['AGUARDANDO_CONFIRMACAO', 'PENDENTE', 'INVENTADO']) {
      const deps = fakeUpdateDeps({
        appointment: storedAppointment({ payment_policy: PAYMENT_POLICY.PREPAID }),
      });
      await rejectsWith(updateWith(deps).execute(asHotel(status)), 422);
      assert.equal(deps.calls.updateMany, null);
    }
  });

  test('tutor cancela antes do início', async () => {
    const deps = fakeUpdateDeps({ appointment: storedAppointment({ status: S.CONFIRMED }) });

    const result = await updateWith(deps).execute(asTutor('CANCELADO'));

    assert.equal(result.status, S.CANCELLED);
  });

  test('cancelar depois do início é recusado (422)', async () => {
    const deps = fakeUpdateDeps({ appointment: storedAppointment({ status: S.CONFIRMED }) });
    const depoisDoInicio = new Date('2026-11-10T15:00:00-03:00');

    await rejectsWith(updateWith(deps, depoisDoInicio).execute(asTutor('CANCELADO')), 422);
    await rejectsWith(updateWith(deps, depoisDoInicio).execute(asHotel('CANCELADO')), 422);
  });

  test('parceiro conclui só depois do início', async () => {
    const antes = fakeUpdateDeps({ appointment: storedAppointment({ status: S.CONFIRMED }) });
    await rejectsWith(updateWith(antes).execute(asHotel('CONCLUIDO')), 422);

    const depois = fakeUpdateDeps({ appointment: storedAppointment({ status: S.CONFIRMED }) });
    const result = await updateWith(depois, new Date('2026-11-10T15:00:00-03:00')).execute(
      asHotel('CONCLUIDO')
    );
    assert.equal(result.status, S.COMPLETED);
  });

  test('não pula de PENDENTE para CONCLUIDO (422)', async () => {
    const deps = fakeUpdateDeps({ appointment: storedAppointment() });

    await rejectsWith(
      updateWith(deps, new Date('2026-11-10T15:00:00-03:00')).execute(asHotel('CONCLUIDO')),
      422
    );
  });

  test('403 para tutor tentando confirmar', async () => {
    const deps = fakeUpdateDeps({ appointment: storedAppointment() });

    await rejectsWith(updateWith(deps).execute(asTutor('CONFIRMADO')), 403);
    assert.equal(deps.calls.updateMany, null);
  });

  test('403 para terceiro e para parceiro de outro agendamento', async () => {
    const deps = fakeUpdateDeps({ appointment: storedAppointment() });

    await rejectsWith(
      updateWith(deps).execute({ appointmentId: 'appt-1', status: 'CANCELADO', userId: STRANGER_USER_ID, userRole: 5 }),
      403
    );
    await rejectsWith(
      updateWith(deps).execute({ appointmentId: 'appt-1', status: 'CONFIRMADO', userId: SITTER_USER_ID, userRole: 4 }),
      403
    );
  });

  test('404 para agendamento inexistente', async () => {
    const deps = fakeUpdateDeps({ appointment: null });

    await rejectsWith(updateWith(deps).execute(asHotel('CONFIRMADO')), 404);
  });

  test('409 quando outra requisição mudou o status entre a leitura e a gravação', async () => {
    const deps = fakeUpdateDeps({ appointment: storedAppointment(), count: 0 });

    await rejectsWith(updateWith(deps).execute(asHotel('CONFIRMADO')), 409);
  });
});
