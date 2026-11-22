process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const db = require("../../src/config/database");
const {
  getDbIntegrationSkipReason,
  prepareTestDatabase,
  resetTestDatabase,
  disconnectTestDatabase,
} = require("../helpers/dbIntegration");
const {
  seedRoles,
  createAuthenticatedTutor,
  createApprovedPartner,
  createService,
  createPet,
} = require("../helpers/testSeed");
const pay = require("../../src/useCases/appointments/PayAppointmentUseCase");
const update = require("../../src/useCases/appointments/UpdateAppointmentStatusUseCase");
const skip = getDbIntegrationSkipReason();
let prepared = false;
before(async () => {
  if (!skip) {
    await prepareTestDatabase();
    prepared = true;
  }
});
beforeEach(async () => {
  if (!skip) {
    await resetTestDatabase();
    await seedRoles();
  }
});
after(async () => {
  if (prepared) {
    await resetTestDatabase();
    await disconnectTestDatabase();
  }
});

async function reservation() {
  const { tutor } = await createAuthenticatedTutor();
  const { provider, partnerUser } = await createApprovedPartner({
    payment_policy: "PRE_PAGO",
  });
  const service = await createService(provider.id);
  const pet = await createPet(tutor.id);
  const appointment = await db.appointment.create({
    data: {
      provider_id: provider.id,
      service_id: service.id,
      pet_id: pet.id,
      payment_policy: "PRE_PAGO",
      total_price: "100.00",
      start_time: new Date(Date.now() + 86400000),
      end_time: new Date(Date.now() + 172800000),
    },
  });
  return {
    appointmentId: appointment.id,
    userId: tutor.id,
    userRole: 5,
    partnerUser,
  };
}

test(
  "PAG-2 Postgres: pagamentos e cancelamentos concorrentes têm efeito único",
  { skip },
  async () => {
    const args = await reservation();
    await Promise.all([
      pay.execute(args),
      pay.execute(args),
      pay.execute(args),
    ]);
    assert.equal(await db.appointmentPayment.count(), 1);
    await Promise.all([
      update.execute({ ...args, status: "CANCELADO" }),
      update.execute({ ...args, status: "CANCELADO" }),
    ]);
    const stored = await db.appointment.findUnique({
      where: { id: args.appointmentId },
      include: { payment: true },
    });
    assert.equal(stored.status, "CANCELADO");
    assert.equal(stored.payment.status, "REFUNDED");
    assert.ok(stored.payment.refunded_at);
  },
);
test(
  "PAG-2 Postgres: pagamento contra cancelamento não retém cobrança",
  { skip },
  async () => {
    const args = await reservation();
    await Promise.allSettled([
      pay.execute(args),
      update.execute({ ...args, status: "CANCELADO" }),
    ]);
    const stored = await db.appointment.findUnique({
      where: { id: args.appointmentId },
      include: { payment: true },
    });
    assert.equal(stored.status, "CANCELADO");
    assert.ok(!stored.payment || stored.payment.status === "REFUNDED");
  },
);
test(
  "PAG-2 Postgres: falha no estorno reverte a troca de status",
  { skip },
  async () => {
    const args = await reservation();
    await pay.execute(args);
    // Constraint temporária apenas no banco isolado, removida mesmo quando o teste falha.
    await db.$executeRawUnsafe(
      "ALTER TABLE appointment_payments ADD CONSTRAINT qa_no_refund CHECK (status <> 'REFUNDED')",
    );
    try {
      await assert.rejects(
        update.execute({
          ...args,
          status: "RECUSADO",
          userId: args.partnerUser.id,
          userRole: 3,
        }),
      );
      assert.equal(
        (await db.appointment.findUnique({ where: { id: args.appointmentId } }))
          .status,
        "AGUARDANDO_CONFIRMACAO",
      );
      assert.equal(
        (
          await db.appointmentPayment.findUnique({
            where: { appointment_id: args.appointmentId },
          })
        ).status,
        "APPROVED",
      );
    } finally {
      await db.$executeRawUnsafe(
        "ALTER TABLE appointment_payments DROP CONSTRAINT qa_no_refund",
      );
    }
  },
);
