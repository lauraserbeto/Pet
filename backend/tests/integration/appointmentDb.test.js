process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

// Agendamento no Postgres real (E-04): política congelada na reserva, conflito
// de horário, reservas simultâneas e troca de status concorrente.

const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../../src/config/database');
const appointmentRepository = require('../../src/repositories/AppointmentRepository');
const { CreateAppointmentUseCase } = require('../../src/useCases/appointments/CreateAppointmentUseCase');
const { UpdateAppointmentStatusUseCase } = require('../../src/useCases/appointments/UpdateAppointmentStatusUseCase');
const { APPOINTMENT_STATUS: S } = require('../../src/constants/appointmentStatus');
const {
  getDbIntegrationSkipReason,
  prepareTestDatabase,
  resetTestDatabase,
  disconnectTestDatabase,
} = require('../helpers/dbIntegration');
const {
  seedRoles,
  createAuthenticatedTutor,
  createApprovedPartner,
  createService,
  createPet,
} = require('../helpers/testSeed');

const skipDbIntegration = getDbIntegrationSkipReason();
let databasePrepared = false;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const iso = (days, hours = 0) => new Date(Date.now() + days * DAY + hours * HOUR).toISOString();

/** Libera todos os participantes juntos quando o último chega. */
function barrier(size) {
  let arrived = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  return async () => {
    arrived += 1;
    if (arrived === size) release();
    await gate;
  };
}

const createAppointment = new CreateAppointmentUseCase();
const updateStatus = new UpdateAppointmentStatusUseCase();

async function book({ tutor, pet, service, start = iso(10), end = iso(12), useCase = createAppointment }) {
  return useCase.execute({
    userId: tutor.id,
    userRole: 5,
    service_id: service.id,
    pet_id: pet.id,
    start_time: start,
    end_time: end,
  });
}

test(
  'E-04: nasce PENDENTE com a política do parceiro; trocar a política depois não altera a reserva',
  { skip: skipDbIntegration },
  async () => {
    const { tutor } = await createAuthenticatedTutor();
    const pet = await createPet(tutor.id);
    const { partnerUser, provider } = await createApprovedPartner({ role_id: 3, payment_policy: 'PRESENCIAL' });
    const service = await createService(provider.id, { price: '80.00' });

    const created = await book({ tutor, pet, service });

    assert.equal(created.status, S.PENDING);
    assert.equal(created.payment_policy, 'PRESENCIAL');
    assert.equal(created.total_price, 160); // 80 × 2 diárias (não a diária 999 do perfil)

    await prisma.provider.update({ where: { id: provider.id }, data: { payment_policy: 'PRE_PAGO' } });

    const stored = await prisma.appointment.findUnique({ where: { id: created.id } });
    assert.equal(stored.payment_policy, 'PRESENCIAL');

    // A transição segue a política gravada: o parceiro confirma direto.
    const confirmed = await updateStatus.execute({
      appointmentId: created.id,
      status: 'CONFIRMADO',
      userId: partnerUser.id,
      userRole: 3,
    });
    assert.equal(confirmed.status, S.CONFIRMED);
  }
);

test(
  'E-04: PRE_PAGO não pago fica PENDENTE e o parceiro não confirma',
  { skip: skipDbIntegration },
  async () => {
    const { tutor } = await createAuthenticatedTutor();
    const pet = await createPet(tutor.id);
    const { partnerUser, provider } = await createApprovedPartner({ role_id: 3, payment_policy: 'PRE_PAGO' });
    const service = await createService(provider.id);

    const created = await book({ tutor, pet, service });
    assert.equal(created.status, S.PENDING);
    assert.equal(created.payment_policy, 'PRE_PAGO');

    await assert.rejects(
      updateStatus.execute({ appointmentId: created.id, status: 'CONFIRMADO', userId: partnerUser.id, userRole: 3 }),
      (err) => err.statusCode === 422
    );
    assert.equal((await prisma.appointment.findUnique({ where: { id: created.id } })).status, S.PENDING);
  }
);

test(
  'E-04: conflito bloqueia o mesmo pet e o mesmo sitter; hotel recebe outros pets no período',
  { skip: skipDbIntegration },
  async () => {
    const { tutor } = await createAuthenticatedTutor();
    const rex = await createPet(tutor.id, { name: 'Rex' });
    const mia = await createPet(tutor.id, { name: 'Mia', species: 'CAT' });
    const { provider: hotel } = await createApprovedPartner({ role_id: 3 });
    const { provider: outroHotel } = await createApprovedPartner({ role_id: 3 });
    const hospedagem = await createService(hotel.id);
    const outraHospedagem = await createService(outroHotel.id);

    await book({ tutor, pet: rex, service: hospedagem, start: iso(10), end: iso(12) });

    // Mesmo pet, outro hotel, período sobreposto → 409.
    await assert.rejects(
      book({ tutor, pet: rex, service: outraHospedagem, start: iso(11), end: iso(13) }),
      (err) => err.statusCode === 409 && err.code === 'SCHEDULE_CONFLICT'
    );

    // Outro pet no mesmo hotel e período → permitido.
    const miaNoHotel = await book({ tutor, pet: mia, service: hospedagem, start: iso(10), end: iso(12) });
    assert.equal(miaNoHotel.status, S.PENDING);

    // Rex volta a poder reservar quando o anterior termina (sem sobreposição).
    await book({ tutor, pet: rex, service: outraHospedagem, start: iso(12), end: iso(14) });

    // Sitter: dois pets diferentes no mesmo horário → o segundo é bloqueado.
    const { tutor: outroTutor } = await createAuthenticatedTutor();
    const thor = await createPet(outroTutor.id, { name: 'Thor' });
    const { provider: sitter } = await createApprovedPartner({ role_id: 4 });
    const visita = await createService(sitter.id, { category: 'SITTING', price: '40.00' });

    await book({ tutor, pet: mia, service: visita, start: iso(20), end: iso(20, 2) });
    await assert.rejects(
      book({ tutor: outroTutor, pet: thor, service: visita, start: iso(20, 1), end: iso(20, 3) }),
      (err) => err.statusCode === 409 && /pet sitter/.test(err.message)
    );

    // Cancelado não ocupa a agenda.
    const [cancelavel] = await prisma.appointment.findMany({ where: { provider_id: sitter.id } });
    await prisma.appointment.update({ where: { id: cancelavel.id }, data: { status: S.CANCELLED } });
    const thorComSitter = await book({ tutor: outroTutor, pet: thor, service: visita, start: iso(20, 1), end: iso(20, 3) });
    assert.equal(thorComSitter.status, S.PENDING);
  }
);

test(
  'E-04: duas reservas simultâneas do mesmo pet — só uma é gravada',
  { skip: skipDbIntegration },
  async () => {
    const { tutor } = await createAuthenticatedTutor();
    const pet = await createPet(tutor.id);
    const { provider: hotelA } = await createApprovedPartner({ role_id: 3 });
    const { provider: hotelB } = await createApprovedPartner({ role_id: 3 });
    const servicoA = await createService(hotelA.id);
    const servicoB = await createService(hotelB.id);

    // As duas requisições passam pelas validações e entram na transação juntas.
    const bothValidated = barrier(2);
    const racingDb = {
      service: prisma.service,
      pet: prisma.pet,
      $transaction: async (fn) => {
        await bothValidated();
        return prisma.$transaction(fn);
      },
    };
    const racing = new CreateAppointmentUseCase({ db: racingDb });

    const results = await Promise.allSettled([
      book({ tutor, pet, service: servicoA, useCase: racing }),
      book({ tutor, pet, service: servicoB, useCase: racing }),
    ]);

    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    const [rejected] = results.filter((r) => r.status === 'rejected');
    assert.equal(rejected.reason.statusCode, 409);
    assert.equal(await prisma.appointment.count({ where: { pet_id: pet.id } }), 1);
  }
);

test(
  'E-04: confirmar e recusar ao mesmo tempo — vale a primeira gravação, a outra recebe 409',
  { skip: skipDbIntegration },
  async () => {
    const { tutor } = await createAuthenticatedTutor();
    const pet = await createPet(tutor.id);
    const { partnerUser, provider } = await createApprovedPartner({ role_id: 3 });
    const service = await createService(provider.id);
    const created = await book({ tutor, pet, service });

    // As duas requisições leem o agendamento PENDENTE antes de qualquer gravação.
    const bothRead = barrier(2);
    let firstReads = 0;
    const racingRepository = {
      findById: async (id) => {
        const appointment = await appointmentRepository.findById(id);
        firstReads += 1;
        if (firstReads <= 2) await bothRead();
        return appointment;
      },
    };
    const racing = new UpdateAppointmentStatusUseCase({ repository: racingRepository });
    const asPartner = (status) =>
      racing.execute({ appointmentId: created.id, status, userId: partnerUser.id, userRole: 3 });

    const results = await Promise.allSettled([asPartner('CONFIRMADO'), asPartner('RECUSADO')]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].reason.statusCode, 409);

    const stored = await prisma.appointment.findUnique({ where: { id: created.id } });
    assert.equal(stored.status, fulfilled[0].value.status);
  }
);

before(async () => {
  if (skipDbIntegration) return;

  await prepareTestDatabase();
  databasePrepared = true;
});

beforeEach(async () => {
  if (skipDbIntegration) return;

  await resetTestDatabase();
  await seedRoles();
});

after(async () => {
  if (skipDbIntegration || !databasePrepared) return;

  await resetTestDatabase();
  await disconnectTestDatabase();
});
