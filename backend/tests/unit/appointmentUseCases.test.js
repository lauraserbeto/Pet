process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../../src/config/database');
const appointmentRepo = require('../../src/repositories/AppointmentRepository');
const createAppointmentUseCase = require('../../src/useCases/appointments/CreateAppointmentUseCase');
const listAppointmentsUseCase = require('../../src/useCases/appointments/ListAppointmentsUseCase');
const updateAppointmentStatusUseCase = require('../../src/useCases/appointments/UpdateAppointmentStatusUseCase');

const { APPOINTMENT_STATUS } = require('../../src/constants/appointmentStatus');
const { PAYMENT_POLICY } = require('../../src/constants/paymentPolicy');
const AppError = require('../../src/utils/AppError');

const TUTOR_A_ID = '00000000-0000-4000-a000-000000000001';
const TUTOR_B_ID = '00000000-0000-4000-a000-000000000002';
const HOTEL_USER_ID = '00000000-0000-4000-a000-000000000003';
const SITTER_USER_ID = '00000000-0000-4000-a000-000000000004';
const STRANGER_USER_ID = '00000000-0000-4000-a000-000000000099';

// ============================================================
// CreateAppointmentUseCase
// ============================================================

describe('CreateAppointmentUseCase (Lógica Real)', () => {
  test('cria agendamento para hotel PRESENCIAL: calcula diárias reais e define status CONFIRMADO', async (t) => {
    const origServiceFind = prisma.service.findUnique;
    const origPetFind = prisma.pet.findUnique;
    const origApptCreate = prisma.appointment.create;

    t.after(() => {
      prisma.service.findUnique = origServiceFind;
      prisma.pet.findUnique = origPetFind;
      prisma.appointment.create = origApptCreate;
    });

    prisma.service.findUnique = async () => ({
      id: 'srv-hotel-1',
      is_active: true,
      provider: {
        id: 'prov-hotel-1',
        payment_policy: PAYMENT_POLICY.ON_SITE,
        daily_rate: 100,
        hourly_rate: null,
        user: { role_id: 3 },
      },
    });

    prisma.pet.findUnique = async () => ({
      id: 'pet-1',
      tutor_id: TUTOR_A_ID,
    });

    let createdPayload = null;
    prisma.appointment.create = async ({ data }) => {
      createdPayload = data;
      return {
        id: 'appt-1',
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      };
    };

    const result = await createAppointmentUseCase.execute({
      userId: TUTOR_A_ID,
      userRole: 5,
      service_id: 'srv-hotel-1',
      pet_id: 'pet-1',
      start_time: '2026-11-10T14:00:00Z',
      end_time: '2026-11-12T10:00:00Z', // 2 diárias
    });

    assert.equal(createdPayload.status, APPOINTMENT_STATUS.CONFIRMED);
    assert.equal(createdPayload.total_price, 200);
    assert.equal(result.total_price, 200);
    assert.equal(result.status, APPOINTMENT_STATUS.CONFIRMED);
  });

  test('cria agendamento para sitter PRE_PAGO: calcula horas reais e define status AGUARDANDO_CONFIRMACAO', async (t) => {
    const origServiceFind = prisma.service.findUnique;
    const origPetFind = prisma.pet.findUnique;
    const origApptCreate = prisma.appointment.create;

    t.after(() => {
      prisma.service.findUnique = origServiceFind;
      prisma.pet.findUnique = origPetFind;
      prisma.appointment.create = origApptCreate;
    });

    prisma.service.findUnique = async () => ({
      id: 'srv-sitter-1',
      is_active: true,
      provider: {
        id: 'prov-sitter-1',
        payment_policy: PAYMENT_POLICY.PREPAID,
        daily_rate: null,
        hourly_rate: 50,
        user: { role_id: 4 },
      },
    });

    prisma.pet.findUnique = async () => ({
      id: 'pet-1',
      tutor_id: TUTOR_A_ID,
    });

    let createdPayload = null;
    prisma.appointment.create = async ({ data }) => {
      createdPayload = data;
      return {
        id: 'appt-2',
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      };
    };

    const result = await createAppointmentUseCase.execute({
      userId: TUTOR_A_ID,
      userRole: 5,
      service_id: 'srv-sitter-1',
      pet_id: 'pet-1',
      start_time: '2026-11-10T14:00:00Z',
      end_time: '2026-11-10T16:00:00Z', // 2 horas
    });

    assert.equal(createdPayload.status, APPOINTMENT_STATUS.AWAITING_CONFIRMATION);
    assert.equal(createdPayload.total_price, 100);
    assert.equal(result.total_price, 100);
    assert.equal(result.status, APPOINTMENT_STATUS.AWAITING_CONFIRMATION);
  });

  test('rejeita com 403 se o pet pertencer a outro tutor', async (t) => {
    const origServiceFind = prisma.service.findUnique;
    const origPetFind = prisma.pet.findUnique;

    t.after(() => {
      prisma.service.findUnique = origServiceFind;
      prisma.pet.findUnique = origPetFind;
    });

    prisma.service.findUnique = async () => ({
      id: 'srv-1',
      is_active: true,
      provider: { id: 'prov-1', user: { role_id: 3 } },
    });

    prisma.pet.findUnique = async () => ({
      id: 'pet-1',
      tutor_id: TUTOR_B_ID,
    });

    await assert.rejects(
      () =>
        createAppointmentUseCase.execute({
          userId: TUTOR_A_ID,
          userRole: 5,
          service_id: 'srv-1',
          pet_id: 'pet-1',
          start_time: '2026-11-10T10:00:00Z',
          end_time: '2026-11-11T10:00:00Z',
        }),
      (err) => err instanceof AppError && err.statusCode === 403
    );
  });

  test('rejeita com 400 se o serviço estiver desativado', async (t) => {
    const origServiceFind = prisma.service.findUnique;
    t.after(() => {
      prisma.service.findUnique = origServiceFind;
    });

    prisma.service.findUnique = async () => ({
      id: 'srv-inativo',
      is_active: false,
      provider: { id: 'prov-1' },
    });

    await assert.rejects(
      () =>
        createAppointmentUseCase.execute({
          userId: TUTOR_A_ID,
          userRole: 5,
          service_id: 'srv-inativo',
          pet_id: 'pet-1',
          start_time: '2026-11-10T10:00:00Z',
          end_time: '2026-11-11T10:00:00Z',
        }),
      (err) => err instanceof AppError && err.statusCode === 400
    );
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

describe('UpdateAppointmentStatusUseCase (Máquina de Estados e Estornos)', () => {
  test('parceiro confirma agendamento AGUARDANDO_CONFIRMACAO', async (t) => {
    const origFindById = appointmentRepo.findById;
    const origProviderFind = prisma.provider.findUnique;
    const origUpdate = prisma.appointment.update;

    t.after(() => {
      appointmentRepo.findById = origFindById;
      prisma.provider.findUnique = origProviderFind;
      prisma.appointment.update = origUpdate;
    });

    appointmentRepo.findById = async () => ({
      id: 'appt-conf',
      provider_id: 'prov-1',
      status: APPOINTMENT_STATUS.AWAITING_CONFIRMATION,
      total_price: 200,
      pet: { tutor_id: TUTOR_A_ID },
    });

    prisma.provider.findUnique = async ({ where }) => {
      if (where.user_id) return { id: 'prov-1', user_id: HOTEL_USER_ID };
      if (where.id) return { id: 'prov-1', payment_policy: PAYMENT_POLICY.PREPAID };
      return null;
    };

    let updatedData = null;
    prisma.appointment.update = async ({ data }) => {
      updatedData = data;
      return {
        id: 'appt-conf',
        provider_id: 'prov-1',
        status: data.status,
        total_price: 200,
        created_at: new Date(),
        updated_at: new Date(),
      };
    };

    const res = await updateAppointmentStatusUseCase.execute({
      appointmentId: 'appt-conf',
      status: APPOINTMENT_STATUS.CONFIRMED,
      userId: HOTEL_USER_ID,
      userRole: 3,
    });

    assert.equal(updatedData.status, APPOINTMENT_STATUS.CONFIRMED);
    assert.equal(res.status, APPOINTMENT_STATUS.CONFIRMED);
  });

  test('recusa de parceiro PRE_PAGO gera estorno simulado', async (t) => {
    const origFindById = appointmentRepo.findById;
    const origProviderFind = prisma.provider.findUnique;
    const origUpdate = prisma.appointment.update;

    t.after(() => {
      appointmentRepo.findById = origFindById;
      prisma.provider.findUnique = origProviderFind;
      prisma.appointment.update = origUpdate;
    });

    appointmentRepo.findById = async () => ({
      id: 'appt-ref-pre',
      provider_id: 'prov-1',
      status: APPOINTMENT_STATUS.AWAITING_CONFIRMATION,
      total_price: 350,
      pet: { tutor_id: TUTOR_A_ID },
    });

    prisma.provider.findUnique = async ({ where }) => {
      if (where.user_id) return { id: 'prov-1', user_id: HOTEL_USER_ID };
      if (where.id) return { id: 'prov-1', payment_policy: PAYMENT_POLICY.PREPAID };
      return null;
    };

    prisma.appointment.update = async ({ data }) => ({
      id: 'appt-ref-pre',
      provider_id: 'prov-1',
      status: data.status,
      total_price: 350,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const res = await updateAppointmentStatusUseCase.execute({
      appointmentId: 'appt-ref-pre',
      status: APPOINTMENT_STATUS.REJECTED,
      userId: HOTEL_USER_ID,
      userRole: 3,
    });

    assert.equal(res.status, APPOINTMENT_STATUS.REJECTED);
    assert.deepEqual(res.refund, {
      status: 'ESTORNADO',
      simulated: true,
      amount: 350,
    });
  });

  test('cancelamento pelo tutor de parceiro PRE_PAGO gera estorno simulado', async (t) => {
    const origFindById = appointmentRepo.findById;
    const origProviderFind = prisma.provider.findUnique;
    const origUpdate = prisma.appointment.update;

    t.after(() => {
      appointmentRepo.findById = origFindById;
      prisma.provider.findUnique = origProviderFind;
      prisma.appointment.update = origUpdate;
    });

    appointmentRepo.findById = async () => ({
      id: 'appt-canc-pre',
      provider_id: 'prov-1',
      status: APPOINTMENT_STATUS.CONFIRMED,
      total_price: 180,
      pet: { tutor_id: TUTOR_A_ID },
    });

    prisma.provider.findUnique = async ({ where }) => {
      if (where.id) return { id: 'prov-1', payment_policy: PAYMENT_POLICY.PREPAID };
      return null;
    };

    prisma.appointment.update = async ({ data }) => ({
      id: 'appt-canc-pre',
      provider_id: 'prov-1',
      status: data.status,
      total_price: 180,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const res = await updateAppointmentStatusUseCase.execute({
      appointmentId: 'appt-canc-pre',
      status: APPOINTMENT_STATUS.CANCELLED,
      userId: TUTOR_A_ID,
      userRole: 5,
    });

    assert.equal(res.status, APPOINTMENT_STATUS.CANCELLED);
    assert.deepEqual(res.refund, {
      status: 'ESTORNADO',
      simulated: true,
      amount: 180,
    });
  });

  test('cancelamento de parceiro PRESENCIAL NÃO gera estorno', async (t) => {
    const origFindById = appointmentRepo.findById;
    const origProviderFind = prisma.provider.findUnique;
    const origUpdate = prisma.appointment.update;

    t.after(() => {
      appointmentRepo.findById = origFindById;
      prisma.provider.findUnique = origProviderFind;
      prisma.appointment.update = origUpdate;
    });

    appointmentRepo.findById = async () => ({
      id: 'appt-canc-pres',
      provider_id: 'prov-1',
      status: APPOINTMENT_STATUS.CONFIRMED,
      total_price: 150,
      pet: { tutor_id: TUTOR_A_ID },
    });

    prisma.provider.findUnique = async ({ where }) => {
      if (where.id) return { id: 'prov-1', payment_policy: PAYMENT_POLICY.ON_SITE };
      return null;
    };

    prisma.appointment.update = async ({ data }) => ({
      id: 'appt-canc-pres',
      provider_id: 'prov-1',
      status: data.status,
      total_price: 150,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const res = await updateAppointmentStatusUseCase.execute({
      appointmentId: 'appt-canc-pres',
      status: APPOINTMENT_STATUS.CANCELLED,
      userId: TUTOR_A_ID,
      userRole: 5,
    });

    assert.equal(res.status, APPOINTMENT_STATUS.CANCELLED);
    assert.equal(res.refund, undefined);
  });

  test('rejeita com 422 transição proibida pela máquina de estados (salto para CONCLUIDO)', async (t) => {
    const origFindById = appointmentRepo.findById;
    const origProviderFind = prisma.provider.findUnique;

    t.after(() => {
      appointmentRepo.findById = origFindById;
      prisma.provider.findUnique = origProviderFind;
    });

    appointmentRepo.findById = async () => ({
      id: 'appt-salto',
      provider_id: 'prov-1',
      status: APPOINTMENT_STATUS.PENDING,
      pet: { tutor_id: TUTOR_A_ID },
    });

    prisma.provider.findUnique = async ({ where }) => {
      if (where.user_id) return { id: 'prov-1', user_id: HOTEL_USER_ID };
      if (where.id) return { id: 'prov-1', payment_policy: PAYMENT_POLICY.ON_SITE };
      return null;
    };

    await assert.rejects(
      () =>
        updateAppointmentStatusUseCase.execute({
          appointmentId: 'appt-salto',
          status: APPOINTMENT_STATUS.COMPLETED,
          userId: HOTEL_USER_ID,
          userRole: 3,
        }),
      (err) => err instanceof AppError && err.statusCode === 422
    );
  });

  test('rejeita com 403 tutor tentando confirmar agendamento', async (t) => {
    const origFindById = appointmentRepo.findById;
    t.after(() => {
      appointmentRepo.findById = origFindById;
    });

    appointmentRepo.findById = async () => ({
      id: 'appt-tutor-bloq',
      provider_id: 'prov-1',
      status: APPOINTMENT_STATUS.AWAITING_CONFIRMATION,
      pet: { tutor_id: TUTOR_A_ID },
    });

    await assert.rejects(
      () =>
        updateAppointmentStatusUseCase.execute({
          appointmentId: 'appt-tutor-bloq',
          status: APPOINTMENT_STATUS.CONFIRMED,
          userId: TUTOR_A_ID,
          userRole: 5,
        }),
      (err) => err instanceof AppError && err.statusCode === 403
    );
  });
});
