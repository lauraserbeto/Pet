process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const prisma = require("../../src/config/database");
const app = require("../../src/app");
const {
  CreatePaymentPreferenceUseCase,
} = require("../../src/useCases/payments/CreatePaymentPreferenceUseCase");
const {
  ProcessPaymentWebhookUseCase,
} = require("../../src/useCases/payments/ProcessPaymentWebhookUseCase");
const {
  getDbIntegrationSkipReason,
  prepareTestDatabase,
  resetTestDatabase,
  disconnectTestDatabase,
} = require("../helpers/dbIntegration");
const {
  seedRoles,
  createAuthenticatedTutor,
  createAddress,
  createStoreWithProduct,
} = require("../helpers/testSeed");
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
  if (prepared) await disconnectTestDatabase();
});
const auth = (user) =>
  `Bearer ${jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET)}`;
const stock = async (id) =>
  (await prisma.product.findUnique({ where: { id } })).stock_quantity;
const state = (id) => prisma.order.findUnique({ where: { id } });
const finalize = (ctx) =>
  request(app)
    .post("/api/v1/orders")
    .set("Authorization", ctx.authorization)
    .send({ address_id: ctx.address.id });
const cancel = (ctx, status = "CANCELADO") =>
  request(app)
    .patch(`/api/v1/orders/${ctx.order.id}/status`)
    .set("Authorization", auth(ctx.storeUser))
    .send({ status });
const pay = (ctx) =>
  request(app)
    .post(`/api/v1/orders/${ctx.order.id}/pay`)
    .set("Authorization", ctx.authorization);
async function draft({ quantity = 2, inventory = 10, store } = {}) {
  const tutor = await createAuthenticatedTutor();
  const address = await createAddress(tutor.tutor.id);
  const shop =
    store ||
    (await createStoreWithProduct({
      price: "10.10",
      stock_quantity: inventory,
    }));
  const add = await request(app)
    .post("/api/v1/cart/items")
    .set("Authorization", tutor.authorization)
    .send({ product_id: shop.product.id, quantity });
  assert.equal(add.status, 201, JSON.stringify(add.body));
  return { ...shop, ...tutor, address, itemId: add.body.items[0].id };
}
async function ordered(options) {
  const ctx = await draft(options);
  const result = await finalize(ctx);
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return { ...ctx, order: result.body.order };
}
function gateway() {
  return {
    config: {
      enabled: true,
      testUserId: "999",
      frontendUrl: "https://petplus.test",
      backendUrl: "https://api.petplus.test",
    },
    assertEnabled() {},
    assertTestAccount: async () => {},
    verifySignature() {},
    createPreference: async () => ({
      id: "qa-preference",
      init_point:
        "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=qa",
    }),
  };
}
async function prepareGateway(ctx, service = gateway()) {
  await new CreatePaymentPreferenceUseCase({ gateway: service }).execute({
    userId: ctx.tutor.id,
    userRole: 5,
    orderId: ctx.order.id,
  });
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { order_id: ctx.order.id },
  });
  service.getPayment = async () => ({
    id: 987654,
    collector_id: 999,
    live_mode: false,
    external_reference: ctx.order.id,
    transaction_amount: ctx.order.total_price,
    currency_id: "BRL",
    status: "approved",
    date_last_updated: new Date().toISOString(),
    metadata: { payment_attempt_id: attempt.id },
  });
  return {
    service,
    attempt,
    notify: () =>
      new ProcessPaymentWebhookUseCase({ gateway: service }).execute({
        signature: "qa",
        requestId: "qa",
        query: { "data.id": "987654", type: "payment" },
        body: {},
      }),
  };
}
async function waitForStockWriter() {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const rows =
      await prisma.$queryRaw`SELECT pid FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid() AND wait_event_type = 'Lock' AND query LIKE '%UPDATE%products%'`;
    if (rows.length) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw Error("A compra não atingiu a barreira de estoque dentro do prazo.");
}

test(
  "E-08 DB: dois tutores disputam a última unidade; só um pedido e nenhum estoque negativo",
  { skip },
  async () => {
    const a = await draft({ quantity: 1, inventory: 1 });
    const b = await draft({ quantity: 1, store: a });
    const replies = await Promise.all([finalize(a), finalize(b)]);
    assert.equal(
      replies.filter((row) => row.status === 201).length,
      1,
      JSON.stringify(replies.map((row) => row.body)),
    );
    assert.equal(replies.filter((row) => row.status === 409).length, 1);
    assert.equal(await stock(a.product.id), 0);
    assert.equal(await prisma.order.count(), 1);
    const remaining = await prisma.cartItem.findMany();
    assert.equal(remaining.length, 1);
  },
);
test(
  "E-08 DB: finalizações simultâneas do mesmo carrinho não criam pedidos duplicados",
  { skip },
  async () => {
    const ctx = await draft();
    const replies = await Promise.all([
      finalize(ctx),
      finalize(ctx),
      finalize(ctx),
    ]);
    assert.equal(replies.filter((row) => row.status === 201).length, 1);
    assert.ok(replies.every((row) => [201, 400, 409].includes(row.status)));
    assert.equal(await prisma.order.count(), 1);
    assert.equal(await stock(ctx.product.id), 8);
    assert.equal(await prisma.cartItem.count(), 0);
  },
);
test(
  "E-08 DB: edição de quantidade concorrente é preservada quando checkout perde a versão",
  { skip },
  async () => {
    const ctx = await draft();
    let buying;
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM products WHERE id = ${ctx.product.id}::uuid FOR UPDATE`;
        buying = finalize(ctx).then((result) => result);
        await waitForStockWriter();
        const edit = await request(app)
          .patch(`/api/v1/cart/items/${ctx.itemId}`)
          .set("Authorization", ctx.authorization)
          .send({ quantity: 3 });
        assert.equal(edit.status, 200, JSON.stringify(edit.body));
      },
      { timeout: 12000 },
    );
    assert.equal((await buying).status, 409);
    assert.equal(await prisma.order.count(), 0);
    assert.equal(await stock(ctx.product.id), 10);
    assert.equal(
      (await prisma.cartItem.findUnique({ where: { id: ctx.itemId } }))
        .quantity,
      3,
    );
  },
);
test(
  "E-08 DB: cancelamento repetido/concorrente devolve estoque uma vez e não reativa produto",
  { skip },
  async () => {
    const ctx = await ordered();
    await prisma.product.update({
      where: { id: ctx.product.id },
      data: { status: "INACTIVE" },
    });
    const replies = await Promise.all(
      Array.from({ length: 5 }, () => cancel(ctx)),
    );
    assert.ok(
      replies.every((row) => row.status === 200),
      JSON.stringify(replies.map((row) => row.body)),
    );
    assert.equal(await stock(ctx.product.id), 10);
    assert.equal((await state(ctx.order.id)).status, "CANCELADO");
    assert.equal(
      (await prisma.product.findUnique({ where: { id: ctx.product.id } }))
        .status,
      "INACTIVE",
    );
  },
);
for (const status of ["PAGO", "PREPARANDO"])
  test(
    `E-08 DB: cancelamento simulado em ${status} restitui a reserva`,
    { skip },
    async () => {
      const ctx = await ordered();
      assert.equal((await pay(ctx)).status, 200);
      if (status === "PREPARANDO")
        assert.equal((await cancel(ctx, status)).status, 200);
      assert.equal((await cancel(ctx)).status, 200);
      assert.equal(await stock(ctx.product.id), 10);
      assert.equal((await pay(ctx)).status, 409);
      assert.equal((await state(ctx.order.id)).status, "CANCELADO");
    },
  );
test(
  "E-08 DB: pagar e cancelar simultaneamente nunca ressuscita pedido nem duplica estoque",
  { skip },
  async () => {
    const ctx = await ordered();
    const [payment, cancellation] = await Promise.all([pay(ctx), cancel(ctx)]);
    assert.ok([200, 409].includes(payment.status));
    assert.equal(cancellation.status, 200);
    assert.equal((await state(ctx.order.id)).status, "CANCELADO");
    assert.equal(await stock(ctx.product.id), 10);
  },
);
test(
  "E-08 DB: envio contra cancelamento preserva apenas uma transição e seu efeito de estoque",
  { skip },
  async () => {
    const ctx = await ordered();
    await pay(ctx);
    const replies = await Promise.all([cancel(ctx, "ENVIADO"), cancel(ctx)]);
    assert.equal(replies.filter((row) => row.status === 200).length, 1);
    assert.equal(replies.filter((row) => row.status === 422).length, 1);
    const final = await state(ctx.order.id);
    assert.ok(["ENVIADO", "CANCELADO"].includes(final.status));
    assert.equal(
      await stock(ctx.product.id),
      final.status === "CANCELADO" ? 10 : 8,
    );
  },
);
test(
  "E-08 DB: falha na reposição reverte cancelamento; nova tentativa restitui exatamente uma vez",
  { skip },
  async () => {
    const ctx = await ordered();
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION qa_e08_restock_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.stock_quantity > OLD.stock_quantity THEN RAISE EXCEPTION 'qa_e08_forced_restock_failure'; END IF; RETURN NEW; END $$`,
    );
    await prisma.$executeRawUnsafe(
      "CREATE TRIGGER qa_e08_restock_failure BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION qa_e08_restock_failure()",
    );
    try {
      assert.equal((await cancel(ctx)).status, 500);
    } finally {
      await prisma.$executeRawUnsafe(
        "DROP TRIGGER qa_e08_restock_failure ON products",
      );
      await prisma.$executeRawUnsafe("DROP FUNCTION qa_e08_restock_failure()");
    }
    assert.equal((await state(ctx.order.id)).status, "AGUARDANDO_PAGAMENTO");
    assert.equal(await stock(ctx.product.id), 8);
    assert.equal((await cancel(ctx)).status, 200);
    assert.equal(await stock(ctx.product.id), 10);
  },
);
test(
  "E-08 DB: falha no segundo lojista reverte todos os pedidos/estoques e preserva carrinho",
  { skip },
  async () => {
    const ctx = await draft();
    const other = await createStoreWithProduct({ stock_quantity: 10 });
    await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", ctx.authorization)
      .send({ product_id: other.product.id, quantity: 2 });
    // O processamento ordena UUIDs; o último item falha após a primeira loja.
    const last = [ctx.product.id, other.product.id].sort().at(-1);
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION qa_e08_order_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.product_id::text = '${last}' THEN RAISE EXCEPTION 'qa_e08_forced_order_failure'; END IF; RETURN NEW; END $$`,
    );
    await prisma.$executeRawUnsafe(
      "CREATE TRIGGER qa_e08_order_failure BEFORE INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION qa_e08_order_failure()",
    );
    try {
      assert.equal((await finalize(ctx)).status, 500);
    } finally {
      await prisma.$executeRawUnsafe(
        "DROP TRIGGER qa_e08_order_failure ON order_items",
      );
      await prisma.$executeRawUnsafe("DROP FUNCTION qa_e08_order_failure()");
    }
    assert.equal(await prisma.order.count(), 0);
    assert.equal(await stock(ctx.product.id), 10);
    assert.equal(await stock(other.product.id), 10);
    assert.equal(await prisma.cartItem.count(), 2);
  },
);
test(
  "E-08 DB: CHECK rejeita estoque negativo inclusive fora da API",
  { skip },
  async () => {
    const { product } = await createStoreWithProduct({ stock_quantity: 0 });
    await assert.rejects(
      prisma.product.update({
        where: { id: product.id },
        data: { stock_quantity: -1 },
      }),
    );
    assert.equal(await stock(product.id), 0);
    const rows =
      await prisma.$queryRaw`SELECT convalidated FROM pg_constraint WHERE conname = 'products_stock_nonnegative'`;
    assert.deepEqual(rows, [{ convalidated: true }]);
  },
);
test(
  "E-08 HTTP: parceiro alheio, tutor e PAGO manual não alteram estoque; UUID/body inválidos dão 422",
  { skip },
  async () => {
    const ctx = await ordered();
    const other = await createStoreWithProduct();
    assert.equal((await cancel(ctx, "PAGO")).status, 403);
    assert.equal(
      (await cancel({ ...ctx, storeUser: other.storeUser })).status,
      403,
    );
    assert.equal(
      (
        await request(app)
          .patch(`/api/v1/orders/${ctx.order.id}/status`)
          .set("Authorization", ctx.authorization)
          .send({ status: "CANCELADO" })
      ).status,
      403,
    );
    assert.equal(
      (
        await request(app)
          .patch("/api/v1/orders/invalid/status")
          .set("Authorization", auth(ctx.storeUser))
          .send({ status: "CANCELADO" })
      ).status,
      422,
    );
    assert.equal(
      (
        await request(app)
          .patch(`/api/v1/orders/${ctx.order.id}/status`)
          .set("Authorization", auth(ctx.storeUser))
          .send({})
      ).status,
      422,
    );
    assert.equal(await stock(ctx.product.id), 8);
    assert.equal((await state(ctx.order.id)).status, "AGUARDANDO_PAGAMENTO");
  },
);
test(
  "E-08 DB: tentativa reservada no gateway bloqueia cancelamento e atalho simulado enquanto gera link",
  { skip },
  async () => {
    const ctx = await ordered();
    const service = gateway();
    let release, entered;
    const ready = new Promise((resolve) => {
      entered = resolve;
    });
    const finish = new Promise((resolve) => {
      release = resolve;
    });
    service.createPreference = async () => {
      entered();
      await finish;
      return {
        id: "qa-pref",
        init_point:
          "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=qa",
      };
    };
    const creating = new CreatePaymentPreferenceUseCase({
      gateway: service,
    }).execute({ userId: ctx.tutor.id, userRole: 5, orderId: ctx.order.id });
    try {
      await ready;
      const cancellation = await cancel(ctx);
      assert.equal(cancellation.status, 409);
      assert.equal(
        cancellation.body.error.code,
        "PAYMENT_RECONCILIATION_REQUIRED",
      );
      const simulated = await pay(ctx);
      assert.equal(simulated.status, 409);
      assert.equal(simulated.body.error.code, "GATEWAY_PAYMENT_REQUIRED");
    } finally {
      release();
      await creating;
    }
    assert.equal(await stock(ctx.product.id), 8);
  },
);
test(
  "E-08 DB: cancelamento vencedor impede iniciar preferência e não chama gateway externo",
  { skip },
  async () => {
    const ctx = await ordered();
    await cancel(ctx);
    const service = gateway();
    let calls = 0;
    service.createPreference = async () => {
      calls++;
      throw Error("não deveria chamar");
    };
    await assert.rejects(
      new CreatePaymentPreferenceUseCase({ gateway: service }).execute({
        userId: ctx.tutor.id,
        userRole: 5,
        orderId: ctx.order.id,
      }),
      { statusCode: 409 },
    );
    assert.equal(calls, 0);
    assert.equal(await prisma.paymentAttempt.count(), 0);
    assert.equal(await stock(ctx.product.id), 10);
  },
);
test(
  "E-08 DB: webhook e cancelamento respeitam mesma reserva sem reposição ou pagamento duplicados",
  { skip },
  async () => {
    const ctx = await ordered();
    const remote = await prepareGateway(ctx);
    const [notification, cancellation] = await Promise.all([
      remote.notify(),
      cancel(ctx),
    ]);
    assert.equal(notification.received, true);
    assert.equal(cancellation.status, 409);
    assert.equal((await state(ctx.order.id)).status, "PAGO");
    assert.equal(await stock(ctx.product.id), 8);
    assert.equal((await remote.notify()).duplicate, true);
    assert.equal(
      (
        await prisma.paymentAttempt.findUnique({
          where: { id: remote.attempt.id },
        })
      ).status,
      "APPROVED",
    );
  },
);
test(
  "E-08 DB: aprovação tardia de cancelado legado exige conciliação e não volta a reservar estoque",
  { skip },
  async () => {
    const ctx = await ordered();
    const remote = await prepareGateway(ctx);
    await prisma.order.update({
      where: { id: ctx.order.id },
      data: { status: "CANCELADO" },
    });
    await prisma.product.update({
      where: { id: ctx.product.id },
      data: { stock_quantity: 10 },
    });
    await remote.notify();
    assert.equal((await state(ctx.order.id)).status, "CANCELADO");
    assert.equal(await stock(ctx.product.id), 10);
    assert.equal(
      (
        await prisma.paymentAttempt.findUnique({
          where: { id: remote.attempt.id },
        })
      ).status,
      "REVIEW_REQUIRED",
    );
  },
);
