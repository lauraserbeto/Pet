process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const prisma = require("../../src/config/database");
const app = require("../../src/app");
const PetRepository = require("../../src/repositories/PetRepository");
const {
  RemovePetUseCase,
} = require("../../src/useCases/pets/RemovePetUseCase");
const removePet = require("../../src/useCases/pets/RemovePetUseCase");
const {
  CreateAppointmentUseCase,
} = require("../../src/useCases/appointments/CreateAppointmentUseCase");
const addressMutations = require("../../src/useCases/addresses/AddressMutations");
const createOrder = require("../../src/useCases/orders/CreateOrderUseCase");
const {
  getDbIntegrationSkipReason,
  prepareTestDatabase,
  resetTestDatabase,
  disconnectTestDatabase,
} = require("../helpers/dbIntegration");
const {
  seedRoles,
  createAuthenticatedTutor,
  createPet,
  createAddress,
  createApprovedPartner,
  createService,
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
const DAY = 86400000;
async function bookingFixture() {
  const ctx = await createAuthenticatedTutor();
  const pet = await createPet(ctx.tutor.id);
  const { partnerUser, provider } = await createApprovedPartner();
  const service = await createService(provider.id);
  return { ...ctx, pet, partnerUser, provider, service };
}
async function appointment(ctx, status, start = new Date(Date.now() + DAY)) {
  return prisma.appointment.create({
    data: {
      pet_id: ctx.pet.id,
      provider_id: ctx.provider.id,
      service_id: ctx.service.id,
      start_time: start,
      end_time: new Date(start.getTime() + DAY),
      status,
      payment_policy: "PRESENCIAL",
      total_price: "100.00",
    },
  });
}
async function orderFixture(status = "PAGO") {
  const ctx = await createAuthenticatedTutor();
  const address = await createAddress(ctx.tutor.id);
  const { provider, product } = await createStoreWithProduct({
    stock_quantity: 5,
    price: "10.00",
  });
  const snapshot = {
    cep: address.cep,
    rua: address.rua,
    numero: address.numero,
    complemento: address.complemento,
    bairro: address.bairro,
    cidade: address.cidade,
    estado: address.estado,
  };
  const order = await prisma.order.create({
    data: {
      customer_id: ctx.tutor.id,
      provider_id: provider.id,
      status,
      total_price: "10.00",
      shipping_address: snapshot,
    },
  });
  return { ...ctx, address, provider, product, order, snapshot };
}
function barrier(count) {
  let release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  return async () => {
    if (--count === 0) release();
    await ready;
  };
}
const petDelete = (ctx, id = ctx.pet.id) =>
  request(app)
    .delete("/api/v1/users/me/pets/" + id)
    .set("Authorization", ctx.authorization);
const addrDelete = (ctx, id = ctx.address.id) =>
  request(app)
    .delete("/api/v1/addresses/" + id)
    .set("Authorization", ctx.authorization);

test(
  "E-12 DB: todos os estados ativos impedem exclusão do pet, mesmo com datas vencidas",
  { skip },
  async () => {
    const ctx = await bookingFixture();
    const item = await appointment(ctx, "PENDENTE");
    for (const status of [
      "PENDENTE",
      "AGUARDANDO_CONFIRMACAO",
      "CONFIRMADO",
      "PENDING",
      "DESCONHECIDO",
    ]) {
      for (const start of [
        new Date(Date.now() + DAY),
        new Date(Date.now() - 2 * DAY),
      ]) {
        await prisma.appointment.update({
          where: { id: item.id },
          data: {
            status,
            start_time: start,
            end_time: new Date(start.getTime() + DAY),
          },
        });
        const reply = await petDelete(ctx);
        assert.equal(reply.status, 409);
        assert.equal(
          (await prisma.pet.findUnique({ where: { id: ctx.pet.id } }))
            .archived_at,
          null,
        );
      }
    }
    assert.equal(await prisma.appointment.count(), 1);
  },
);
test(
  "E-12 DB: pet próprio sem histórico é apagado; outro tutor/inexistente não revela o recurso",
  { skip },
  async () => {
    const ctx = await bookingFixture(),
      stranger = await createAuthenticatedTutor();
    for (const id of [ctx.pet.id, crypto.randomUUID()])
      assert.equal(
        (
          await request(app)
            .delete("/api/v1/users/me/pets/" + id)
            .set("Authorization", stranger.authorization)
        ).status,
        404,
      );
    assert.equal(
      (await request(app).delete("/api/v1/users/me/pets/" + ctx.pet.id)).status,
      401,
    );
    assert.equal((await petDelete(ctx, "id-invalido")).status, 422);
    assert.equal((await petDelete(ctx)).status, 204);
    assert.equal(
      await prisma.pet.findUnique({ where: { id: ctx.pet.id } }),
      null,
    );
    assert.equal((await petDelete(ctx)).status, 404);
  },
);
test(
  "E-12 DB: remover pet com histórico terminal preserva atendimentos, pagamentos, avaliações e acesso dos dois lados",
  { skip },
  async () => {
    const ctx = await bookingFixture();
    const item = await appointment(
      ctx,
      "CONCLUIDO",
      new Date(Date.now() - 2 * DAY),
    );
    const payment = await prisma.appointmentPayment.create({
      data: { appointment_id: item.id, amount: "100.00", status: "APPROVED" },
    });
    const review = await prisma.review.create({
      data: {
        author_id: ctx.tutor.id,
        appointment_id: item.id,
        provider_id: ctx.provider.id,
        rating: 5,
        comment: "Atendimento QA",
      },
    });
    assert.equal((await petDelete(ctx)).status, 204);
    assert(
      (await prisma.pet.findUnique({ where: { id: ctx.pet.id } })).archived_at,
    );
    assert.deepEqual(
      await prisma.appointment.findUnique({ where: { id: item.id } }),
      item,
    );
    assert.deepEqual(
      await prisma.appointmentPayment.findUnique({ where: { id: payment.id } }),
      payment,
    );
    assert.deepEqual(
      await prisma.review.findUnique({ where: { id: review.id } }),
      review,
    );
    assert.equal(
      (
        await request(app)
          .get("/api/v1/users/me/pets")
          .set("Authorization", ctx.authorization)
      ).body.length,
      0,
    );
    assert.equal(
      (
        await request(app)
          .get("/api/v1/users/me/pets/" + ctx.pet.id)
          .set("Authorization", ctx.authorization)
      ).status,
      404,
    );
    assert.equal(
      (
        await request(app)
          .put("/api/v1/users/me/pets/" + ctx.pet.id)
          .set("Authorization", ctx.authorization)
          .send({ name: "Não alterar" })
      ).status,
      404,
    );
    const partnerToken = jwt.sign(
      { id: ctx.partnerUser.id, role_id: 3 },
      process.env.JWT_SECRET,
    );
    for (const token of [ctx.token, partnerToken]) {
      const reply = await request(app)
        .get("/api/v1/appointments")
        .set("Authorization", "Bearer " + token);
      assert.equal(reply.status, 200);
      assert.equal(reply.body[0].pet.name, ctx.pet.name);
    }
    const book = new CreateAppointmentUseCase();
    await assert.rejects(
      book.execute({
        userId: ctx.tutor.id,
        userRole: 5,
        service_id: ctx.service.id,
        pet_id: ctx.pet.id,
        start_time: new Date(Date.now() + DAY),
        end_time: new Date(Date.now() + 2 * DAY),
      }),
      (e) => e.statusCode === 404,
    );
  },
);
test(
  "E-12 DB: cancelados/recusados e aliases terminais permitem remoção, liberando o limite de pets",
  { skip },
  async () => {
    const ctx = await bookingFixture();
    for (const status of ["CANCELADO", "RECUSADO", "COMPLETED"])
      await appointment(ctx, status);
    await removePet.execute({ petId: ctx.pet.id, userId: ctx.tutor.id });
    for (let i = 0; i < 9; i++)
      await createPet(ctx.tutor.id, { name: "Pet QA " + i });
    assert.equal(await PetRepository.countByTutor(ctx.tutor.id), 9);
    const created = await request(app)
      .post("/api/v1/users/me/pets")
      .set("Authorization", ctx.authorization)
      .send({ name: "Novo pet QA", species: "DOG" });
    assert.equal(created.status, 201);
    assert.equal(await PetRepository.countByTutor(ctx.tutor.id), 10);
    assert.equal(await prisma.appointment.count(), 3);
  },
);
for (const history of [false, true])
  test(
    `E-12 DB: reserva concorrente com remoção ${history ? "preserva histórico" : "não usa pet apagado"}`,
    { skip },
    async () => {
      const ctx = await bookingFixture();
      if (history) await appointment(ctx, "CANCELADO");
      const gate = barrier(2);
      const db = {
        service: prisma.service,
        pet: prisma.pet,
        $transaction: async (fn, options) => {
          await gate();
          return prisma.$transaction(fn, options);
        },
      };
      const creator = new CreateAppointmentUseCase({ db });
      const remover = new RemovePetUseCase({ db });
      const results = await Promise.allSettled([
        remover.execute({ petId: ctx.pet.id, userId: ctx.tutor.id }),
        creator.execute({
          userId: ctx.tutor.id,
          userRole: 5,
          service_id: ctx.service.id,
          pet_id: ctx.pet.id,
          start_time: new Date(Date.now() + 3 * DAY),
          end_time: new Date(Date.now() + 4 * DAY),
        }),
      ]);
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
      assert(
        [404, 409].includes(
          results.find((r) => r.status === "rejected").reason.statusCode,
        ),
      );
      const pet = await prisma.pet.findUnique({ where: { id: ctx.pet.id } });
      const active = await prisma.appointment.count({
        where: { pet_id: ctx.pet.id, status: "PENDENTE" },
      });
      if (results[0].status === "fulfilled") {
        assert.equal(active, 0);
        assert(history ? pet.archived_at : pet === null);
      } else {
        assert.equal(active, 1);
        assert.equal(pet.archived_at, null);
      }
      assert.equal(
        await prisma.appointment.count({ where: { pet_id: ctx.pet.id } }),
        (history ? 1 : 0) + active,
      );
    },
  );
test(
  "E-12 DB: duas remoções do mesmo pet não apagam ou duplicam histórico",
  { skip },
  async () => {
    const ctx = await bookingFixture();
    await appointment(ctx, "CANCELADO");
    const results = await Promise.allSettled([
      removePet.execute({ petId: ctx.pet.id, userId: ctx.tutor.id }),
      removePet.execute({ petId: ctx.pet.id, userId: ctx.tutor.id }),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      results.find((r) => r.status === "rejected").reason.statusCode,
      404,
    );
    assert.equal(await prisma.appointment.count(), 1);
  },
);
test(
  "E-12 DB: último endereço bloqueia estados oficiais, aliases e desconhecidos, mesmo com snapshot do pedido",
  { skip },
  async () => {
    const ctx = await orderFixture();
    for (const status of [
      "AGUARDANDO_PAGAMENTO",
      "PAGO",
      "PREPARANDO",
      "ENVIADO",
      "PAID",
      "DESCONHECIDO",
    ]) {
      await prisma.order.update({
        where: { id: ctx.order.id },
        data: { status },
      });
      assert.equal((await addrDelete(ctx)).status, 409);
      assert.equal(await prisma.address.count(), 1);
    }
    assert.deepEqual(
      (await prisma.order.findUnique({ where: { id: ctx.order.id } }))
        .shipping_address,
      ctx.snapshot,
    );
  },
);
test(
  "E-12 DB: endereço alheio/inexistente retorna 404; só dono remove e pedidos de outra conta não bloqueiam",
  { skip },
  async () => {
    const ctx = await orderFixture(),
      other = await createAuthenticatedTutor();
    const address = await createAddress(other.tutor.id);
    for (const id of [ctx.address.id, crypto.randomUUID()])
      assert.equal(
        (
          await request(app)
            .delete("/api/v1/addresses/" + id)
            .set("Authorization", other.authorization)
        ).status,
        404,
      );
    assert.equal(
      (await request(app).delete("/api/v1/addresses/" + address.id)).status,
      401,
    );
    assert.equal(
      (
        await request(app)
          .delete("/api/v1/addresses/id-invalido")
          .set("Authorization", other.authorization)
      ).status,
      422,
    );
    assert.equal(
      (
        await request(app)
          .delete("/api/v1/addresses/" + address.id)
          .set("Authorization", other.authorization)
      ).status,
      204,
    );
    assert.equal((await addrDelete(ctx)).status, 409);
  },
);
test(
  "E-12 DB: estados terminais permitem remover último endereço sem alterar o snapshot",
  { skip },
  async () => {
    for (const status of ["CONCLUIDO", "CANCELADO", "DELIVERED"]) {
      const ctx = await orderFixture(status);
      assert.equal((await addrDelete(ctx)).status, 204);
      assert.deepEqual(
        (await prisma.order.findUnique({ where: { id: ctx.order.id } }))
          .shipping_address,
        ctx.snapshot,
      );
    }
  },
);
test(
  "E-12 DB: excluir principal com outro endereço promove o mais recente e preserva entrega do pedido",
  { skip },
  async () => {
    const ctx = await orderFixture();
    const older = await createAddress(ctx.tutor.id, {
      is_default: false,
      rua: "Rua Alternativa",
    });
    const newest = await createAddress(ctx.tutor.id, {
      is_default: false,
      rua: "Rua Recente",
    });
    await prisma.address.update({
      where: { id: older.id },
      data: { created_at: new Date(Date.now() - DAY) },
    });
    await addressMutations.update(ctx.tutor.id, ctx.address.id, {
      rua: "Rua Editada",
    });
    assert.equal((await addrDelete(ctx)).status, 204);
    const remaining = await prisma.address.findMany({
      where: { user_id: ctx.tutor.id },
    });
    assert.equal(remaining.filter((a) => a.is_default).length, 1);
    assert(remaining.find((a) => a.id === newest.id).is_default);
    assert.deepEqual(
      (await prisma.order.findUnique({ where: { id: ctx.order.id } }))
        .shipping_address,
      ctx.snapshot,
    );
  },
);
test(
  "E-12 DB: duas exclusões concorrentes não removem todos os endereços de cliente com pedido ativo",
  { skip },
  async () => {
    const ctx = await orderFixture();
    const other = await createAddress(ctx.tutor.id, { is_default: false });
    const results = await Promise.allSettled([
      addressMutations.remove(ctx.tutor.id, ctx.address.id),
      addressMutations.remove(ctx.tutor.id, other.id),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      results.find((r) => r.status === "rejected").reason.statusCode,
      409,
    );
    const remaining = await prisma.address.findMany({
      where: { user_id: ctx.tutor.id },
    });
    assert.equal(remaining.length, 1);
    assert(remaining[0].is_default);
  },
);
test(
  "E-12 DB: definir principal e excluir o alvo concorrentemente mantém no máximo um principal",
  { skip },
  async () => {
    const ctx = await createAuthenticatedTutor();
    await createAddress(ctx.tutor.id);
    const target = await createAddress(ctx.tutor.id, { is_default: false });
    const results = await Promise.allSettled([
      addressMutations.setDefault(ctx.tutor.id, target.id),
      addressMutations.remove(ctx.tutor.id, target.id),
    ]);
    for (const row of results)
      if (row.status === "rejected")
        assert([404, 409].includes(row.reason.statusCode));
    const rows = await prisma.address.findMany({
      where: { user_id: ctx.tutor.id },
    });
    assert.equal(rows.filter((r) => r.is_default).length, 1);
  },
);
test(
  "E-12 DB: cadastros simultâneos mantêm principal único e respeitam limite de cinco",
  { skip },
  async () => {
    const ctx = await createAuthenticatedTutor();
    const payload = {
      cep: "01001000",
      rua: "Rua QA",
      numero: "1",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
    };
    const first = await Promise.allSettled([
      addressMutations.create(ctx.tutor.id, payload),
      addressMutations.create(ctx.tutor.id, payload),
    ]);
    for (const row of first)
      if (row.status === "rejected") assert.equal(row.reason.statusCode, 409);
    assert.equal(
      await prisma.address.count({
        where: { user_id: ctx.tutor.id, is_default: true },
      }),
      1,
    );
    while ((await prisma.address.count()) < 4)
      await addressMutations.create(ctx.tutor.id, payload);
    const last = await Promise.allSettled([
      addressMutations.create(ctx.tutor.id, payload),
      addressMutations.create(ctx.tutor.id, payload),
    ]);
    assert.equal(last.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(await prisma.address.count(), 5);
    assert.equal(
      await prisma.address.count({ where: { is_default: true } }),
      1,
    );
  },
);
test(
  "E-12 DB: erro ao promover próximo endereço reverte a exclusão",
  { skip },
  async () => {
    const ctx = await orderFixture();
    await createAddress(ctx.tutor.id, { is_default: false });
    await prisma.$executeRawUnsafe(
      "CREATE FUNCTION qa_e12_fail_default() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.is_default THEN RAISE EXCEPTION 'QA_E12_FAILURE'; END IF; RETURN NEW; END $$",
    );
    await prisma.$executeRawUnsafe(
      "CREATE TRIGGER qa_e12_fail_default BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION qa_e12_fail_default()",
    );
    try {
      await assert.rejects(
        addressMutations.remove(ctx.tutor.id, ctx.address.id),
      );
      assert.equal(await prisma.address.count(), 2);
      assert(
        (await prisma.address.findUnique({ where: { id: ctx.address.id } }))
          .is_default,
      );
    } finally {
      await prisma.$executeRawUnsafe(
        "DROP TRIGGER qa_e12_fail_default ON addresses",
      );
      await prisma.$executeRawUnsafe("DROP FUNCTION qa_e12_fail_default()");
    }
  },
);
test(
  "E-12 DB: checkout concorrente com exclusão do último endereço não usa endereço removido nem perde o carrinho",
  { skip },
  async (t) => {
    const ctx = await createAuthenticatedTutor(),
      address = await createAddress(ctx.tutor.id);
    const { product } = await createStoreWithProduct({
      stock_quantity: 5,
      price: "10.00",
    });
    const cart = await prisma.cart.create({ data: { user_id: ctx.tutor.id } });
    await prisma.cartItem.create({
      data: {
        cart_id: cart.id,
        product_id: product.id,
        quantity: 2,
        unit_price_snapshot: "10.00",
      },
    });
    const original = prisma.$transaction.bind(prisma),
      gate = barrier(2);
    t.mock.method(prisma, "$transaction", async (fn, options) => {
      await gate();
      return original(fn, options);
    });
    let results;
    try {
      results = await Promise.allSettled([
        addressMutations.remove(ctx.tutor.id, address.id),
        createOrder.execute({
          userId: ctx.tutor.id,
          userRole: 5,
          addressId: address.id,
        }),
      ]);
    } finally {
      t.mock.restoreAll();
    }
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert(
      [404, 409].includes(
        results.find((r) => r.status === "rejected").reason.statusCode,
      ),
    );
    if (results[1].status === "fulfilled") {
      assert.equal(await prisma.address.count(), 1);
      assert.equal(await prisma.order.count(), 1);
      assert.equal(
        (await prisma.product.findUnique({ where: { id: product.id } }))
          .stock_quantity,
        3,
      );
      assert.equal(await prisma.cartItem.count(), 0);
    } else {
      assert.equal(await prisma.address.count(), 0);
      assert.equal(await prisma.order.count(), 0);
      assert.equal(
        (await prisma.product.findUnique({ where: { id: product.id } }))
          .stock_quantity,
        5,
      );
      assert.equal(await prisma.cartItem.count(), 1);
    }
  },
);
