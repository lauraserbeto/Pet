process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  PayAppointmentUseCase,
} = require("../../src/useCases/appointments/PayAppointmentUseCase");
const {
  UpdateAppointmentStatusUseCase,
} = require("../../src/useCases/appointments/UpdateAppointmentStatusUseCase");

function fixture(overrides = {}, fail = "") {
  let state = {
    id: "a",
    provider_id: "p",
    pet: { tutor_id: "t" },
    status: "PENDENTE",
    payment_policy: "PRE_PAGO",
    total_price: "120.00",
    start_time: new Date("2030-01-02"),
    ...overrides,
  };
  let creates = 0,
    refunds = 0;
  let queue = Promise.resolve();
  const db = {
    $queryRaw: async () => [],
    provider: { findUnique: async () => ({ id: "p" }) },
    appointment: {
      update: async ({ data }) => {
        if (fail === "status") throw Error("status failure");
        Object.assign(state, data);
      },
      updateMany: async ({ data }) => {
        Object.assign(state, data);
        return { count: 1 };
      },
    },
    appointmentPayment: {
      create: async ({ data }) => {
        creates++;
        state.payment = { id: "pay", ...data };
      },
      updateMany: async ({ data }) => {
        if (fail === "refund") throw Error("refund failure");
        refunds++;
        Object.assign(state.payment, data);
        return { count: 1 };
      },
    },
    $transaction: (fn) => {
      const run = queue.then(async () => {
        const snapshot = structuredClone(state);
        try {
          return await fn(db);
        } catch (error) {
          state = snapshot;
          throw error;
        }
      });
      queue = run.catch(() => {});
      return run;
    },
  };
  const repository = { findById: async () => structuredClone(state) };
  const now = () => new Date("2030-01-01");
  const pay = new PayAppointmentUseCase({ db, appointments: repository, now });
  const update = new UpdateAppointmentStatusUseCase({ db, repository, now });
  return {
    pay,
    update,
    state: () => state,
    counters: () => ({ creates, refunds }),
  };
}
const payment = { appointmentId: "a", userId: "t", userRole: 5 };
const cancel = { ...payment, status: "CANCELADO" };
const reject = {
  appointmentId: "a",
  userId: "partner",
  userRole: 3,
  status: "RECUSADO",
};

test("PAG-2: paga uma vez e congela o valor; repetição não duplica", async () => {
  const f = fixture();
  const responses = await Promise.all([
    f.pay.execute(payment),
    f.pay.execute(payment),
  ]);
  assert.equal(f.counters().creates, 1);
  for (const result of responses) {
    assert.equal(result.status, "AGUARDANDO_CONFIRMACAO");
    assert.equal(result.payment.amount, 120);
    assert.equal(result.payment.simulated, true);
  }
});
test("PAG-2: propriedade, perfil, presencial, horário e cancelado são protegidos", async () => {
  for (const [overrides, args] of [
    [{}, { ...payment, userId: "other" }],
    [{}, { ...payment, userRole: 3 }],
    [{ payment_policy: "PRESENCIAL" }, payment],
    [{ start_time: new Date("2029-01-01") }, payment],
    [{ status: "CANCELADO" }, payment],
  ]) {
    const f = fixture(overrides);
    await assert.rejects(f.pay.execute(args));
    assert.equal(f.counters().creates, 0);
  }
});
test("PAG-2: recusa e cancelamento estornam uma vez; confirmação não estorna", async () => {
  for (const action of [cancel, reject]) {
    const f = fixture();
    await f.pay.execute(payment);
    await f.update.execute(action);
    const result = await f.update.execute(action);
    assert.equal(result.payment.status, "REFUNDED");
    assert.equal(f.counters().refunds, 1);
    await assert.rejects(f.pay.execute(payment));
  }
  const f = fixture();
  await f.pay.execute(payment);
  assert.equal(
    (await f.update.execute({ ...reject, status: "CONFIRMADO" })).payment
      .status,
    "APPROVED",
  );
  assert.equal(f.counters().refunds, 0);
});
test("PAG-2: falhas de status/estorno revertem a transação", async () => {
  const payFailure = fixture({}, "status");
  await assert.rejects(payFailure.pay.execute(payment));
  assert.equal(payFailure.state().payment, undefined);
  assert.equal(payFailure.state().status, "PENDENTE");
  const refundFailure = fixture({}, "refund");
  await refundFailure.pay.execute(payment);
  await assert.rejects(refundFailure.update.execute(cancel));
  assert.equal(refundFailure.state().status, "AGUARDANDO_CONFIRMACAO");
  assert.equal(refundFailure.state().payment.status, "APPROVED");
});
test("PAG-2: pagamento concorrente com cancelamento termina sem cobrança retida", async () => {
  for (const first of ["pay", "cancel"]) {
    const f = fixture();
    await Promise.allSettled(
      first === "pay"
        ? [f.pay.execute(payment), f.update.execute(cancel)]
        : [f.update.execute(cancel), f.pay.execute(payment)],
    );
    assert.equal(f.state().status, "CANCELADO");
    assert.ok(!f.state().payment || f.state().payment.status === "REFUNDED");
  }
});
test("PAG-2: presencial cancela sem pagamento e pré-pago legado não inventa aprovação", async () => {
  const f = fixture({ payment_policy: "PRESENCIAL" });
  assert.equal((await f.update.execute(cancel)).payment, null);
  assert.equal(f.counters().refunds, 0);
  await assert.rejects(
    fixture({ status: "AGUARDANDO_CONFIRMACAO" }).update.execute({
      ...reject,
      status: "CONFIRMADO",
    }),
  );
});
