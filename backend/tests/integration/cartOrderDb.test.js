process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../../src/app');
const prisma = require('../../src/config/database');
const {
  getDbIntegrationSkipReason,
  prepareTestDatabase,
  resetTestDatabase,
  disconnectTestDatabase,
} = require('../helpers/dbIntegration');
const {
  seedRoles,
  createAuthenticatedTutor,
  createAddress,
  createStoreWithProduct,
} = require('../helpers/testSeed');

const skipDbIntegration = getDbIntegrationSkipReason();
let databasePrepared = false;

test('PGT-1: webhooks concorrentes confirmam pagamento uma única vez no Postgres', { skip: skipDbIntegration }, async () => {
  const { CreatePaymentPreferenceUseCase } = require('../../src/useCases/payments/CreatePaymentPreferenceUseCase');
  const { ProcessPaymentWebhookUseCase } = require('../../src/useCases/payments/ProcessPaymentWebhookUseCase');
  const { tutor } = await createAuthenticatedTutor();
  const { provider, product } = await createStoreWithProduct({ price: '45.00' });
  const order = await prisma.order.create({
    data: {
      customer_id: tutor.id, provider_id: provider.id, total_price: '90.00',
      items: { create: { product_id: product.id, quantity: 2, unit_price: '45.00' } },
    },
  });
  const gateway = {
    config: { enabled: true, testUserId: '999', frontendUrl: 'https://petplus.test', backendUrl: 'https://api.petplus.test' },
    assertEnabled() {}, verifySignature() {}, assertTestAccount: async () => {},
    createPreference: async () => ({ id: 'pref-db', init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-db' }),
  };
  await new CreatePaymentPreferenceUseCase({ gateway }).execute({ userId: tutor.id, userRole: 5, orderId: order.id });
  const attempt = await prisma.paymentAttempt.findUnique({ where: { order_id: order.id } });
  gateway.getPayment = async () => ({
    id: 123456, collector_id: 999, live_mode: false, external_reference: order.id,
    transaction_amount: 90, currency_id: 'BRL', status: 'approved', date_last_updated: new Date().toISOString(),
    metadata: { payment_attempt_id: attempt.id },
  });
  const webhook = new ProcessPaymentWebhookUseCase({ gateway });
  const results = await Promise.all(Array.from({ length: 3 }, () => webhook.execute({
    signature: 'signed', requestId: 'request', query: { 'data.id': '123456', type: 'payment' }, body: {},
  })));
  assert.equal(results.filter((result) => result.duplicate).length, 2);
  assert.equal((await prisma.order.findUnique({ where: { id: order.id } })).status, 'PAGO');
  assert.equal((await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } })).status, 'APPROVED');
});

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

  await dropForcedOrderItemFailure();
  await resetTestDatabase();
  await disconnectTestDatabase();
});

async function dropForcedOrderItemFailure() {
  await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS qa_fail_order_item_insert ON "order_items"');
  await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS qa_fail_order_item_insert()');
}

async function createForcedOrderItemFailure() {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION qa_fail_order_item_insert()
    RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'qa forced rollback';
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER qa_fail_order_item_insert
    BEFORE INSERT ON "order_items"
    FOR EACH ROW
    EXECUTE FUNCTION qa_fail_order_item_insert();
  `);
}

test(
  'POST /api/v1/cart/items persiste item com snapshot de preco no banco',
  { skip: skipDbIntegration },
  async () => {
    const { authorization, tutor } = await createAuthenticatedTutor();
    const { product } = await createStoreWithProduct({
      price: '49.90',
      stock_quantity: 7,
    });

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authorization)
      .send({ product_id: product.id, quantity: 2 });

    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.items.length, 1);
    assert.equal(res.body.items[0].product_id, product.id);
    assert.equal(res.body.items[0].quantity, 2);
    assert.equal(res.body.items[0].unit_price, 49.9);

    const cart = await prisma.cart.findUnique({
      where: { user_id: tutor.id },
      include: { items: true },
    });

    assert.ok(cart);
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0].product_id, product.id);
    assert.equal(cart.items[0].quantity, 2);
    assert.equal(Number(cart.items[0].unit_price_snapshot), 49.9);
  }
);

test(
  'POST /api/v1/orders cria pedido, baixa estoque e limpa carrinho',
  { skip: skipDbIntegration },
  async () => {
    const { authorization, tutor } = await createAuthenticatedTutor();
    const address = await createAddress(tutor.id);
    const { provider, product } = await createStoreWithProduct({
      price: '80.00',
      stock_quantity: 8,
    });

    const addItemRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authorization)
      .send({ product_id: product.id, quantity: 2 });

    assert.equal(addItemRes.status, 201, JSON.stringify(addItemRes.body));

    await prisma.product.update({
      where: { id: product.id },
      data: { price: '99.00' },
    });

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', authorization)
      .send({ address_id: address.id });

    assert.equal(orderRes.status, 201, JSON.stringify(orderRes.body));
    assert.equal(orderRes.body.orders.length, 1);
    assert.equal(orderRes.body.order.status, 'AGUARDANDO_PAGAMENTO');
    assert.equal(orderRes.body.order.provider_id, provider.id);
    assert.equal(orderRes.body.order.customer_id, tutor.id);
    assert.equal(orderRes.body.order.total_price, 160);
    assert.equal(orderRes.body.order.items.length, 1);
    assert.equal(orderRes.body.order.items[0].unit_price, 80);
    assert.equal(orderRes.body.order.items[0].line_total, 160);

    const order = await prisma.order.findFirst({
      where: { customer_id: tutor.id },
      include: { items: true },
    });

    assert.ok(order);
    assert.equal(order.provider_id, provider.id);
    assert.equal(Number(order.total_price), 160);
    assert.equal(order.status, 'AGUARDANDO_PAGAMENTO');
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].product_id, product.id);
    assert.equal(order.items[0].quantity, 2);
    assert.equal(Number(order.items[0].unit_price), 80);

    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    assert.equal(updatedProduct.stock_quantity, 6);

    const cart = await prisma.cart.findUnique({
      where: { user_id: tutor.id },
      include: { items: true },
    });
    assert.ok(cart);
    assert.equal(cart.items.length, 0);

    // E-05: o pedido guarda uma cópia do endereço; apagá-lo depois não altera o pedido.
    const expectedAddress = {
      cep: address.cep,
      rua: address.rua,
      numero: address.numero,
      complemento: address.complemento,
      bairro: address.bairro,
      cidade: address.cidade,
      estado: address.estado,
    };
    assert.deepEqual(orderRes.body.order.shipping_address, expectedAddress);
    assert.deepEqual(order.shipping_address, expectedAddress);

    await prisma.address.delete({ where: { id: address.id } });
    const afterDelete = await prisma.order.findUnique({ where: { id: order.id } });
    assert.deepEqual(afterDelete.shipping_address, expectedAddress);
  }
);

test(
  'E-05: endereço de outro tutor responde 404 e não cria pedido',
  { skip: skipDbIntegration },
  async () => {
    const { authorization, tutor } = await createAuthenticatedTutor();
    const { tutor: otherTutor } = await createAuthenticatedTutor();
    const otherAddress = await createAddress(otherTutor.id);
    const { product } = await createStoreWithProduct({ price: '10.00', stock_quantity: 3 });

    const addItemRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authorization)
      .send({ product_id: product.id, quantity: 1 });
    assert.equal(addItemRes.status, 201, JSON.stringify(addItemRes.body));

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', authorization)
      .send({ address_id: otherAddress.id });

    assert.equal(orderRes.status, 404, JSON.stringify(orderRes.body));
    assert.equal(await prisma.order.count({ where: { customer_id: tutor.id } }), 0);
    const unchanged = await prisma.product.findUnique({ where: { id: product.id } });
    assert.equal(unchanged.stock_quantity, 3);
  }
);

test(
  'POST /api/v1/orders preserva pedido inexistente, estoque e carrinho quando a transacao falha',
  { skip: skipDbIntegration },
  async () => {
    const { authorization, tutor } = await createAuthenticatedTutor();
    const address = await createAddress(tutor.id);
    const { product } = await createStoreWithProduct({
      price: '30.00',
      stock_quantity: 4,
    });

    const addItemRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authorization)
      .send({ product_id: product.id, quantity: 2 });

    assert.equal(addItemRes.status, 201, JSON.stringify(addItemRes.body));

    await createForcedOrderItemFailure();

    try {
      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', authorization)
        .send({ address_id: address.id });

      assert.equal(orderRes.status, 500, JSON.stringify(orderRes.body));
    } finally {
      await dropForcedOrderItemFailure();
    }

    const ordersCount = await prisma.order.count({
      where: { customer_id: tutor.id },
    });
    assert.equal(ordersCount, 0);

    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    assert.equal(updatedProduct.stock_quantity, 4);

    const cart = await prisma.cart.findUnique({
      where: { user_id: tutor.id },
      include: { items: true },
    });
    assert.ok(cart);
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0].product_id, product.id);
    assert.equal(cart.items[0].quantity, 2);
    assert.equal(Number(cart.items[0].unit_price_snapshot), 30);
  }
);

test(
  'E-01: loja desativada entre o carrinho e a finalização não recebe pedido nem baixa estoque',
  { skip: skipDbIntegration },
  async () => {
    const { authorization, tutor } = await createAuthenticatedTutor();
    const address = await createAddress(tutor.id);
    const { storeUser, product } = await createStoreWithProduct({
      price: '25.00',
      stock_quantity: 5,
    });

    const addItemRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authorization)
      .send({ product_id: product.id, quantity: 2 });
    assert.equal(addItemRes.status, 201, JSON.stringify(addItemRes.body));

    // Admin desativa a conta do lojista depois que o tutor montou o carrinho.
    await prisma.user.update({ where: { id: storeUser.id }, data: { is_active: false } });

    const catalogRes = await request(app).get('/api/v1/products');
    assert.equal(catalogRes.status, 200);
    assert.equal(catalogRes.body.some((p) => p.id === product.id), false);

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', authorization)
      .send({ address_id: address.id });
    assert.equal(orderRes.status, 409, JSON.stringify(orderRes.body));
    assert.equal(orderRes.body.error.code, 'PROVIDER_UNAVAILABLE');

    assert.equal(await prisma.order.count({ where: { customer_id: tutor.id } }), 0);
    const unchanged = await prisma.product.findUnique({ where: { id: product.id } });
    assert.equal(unchanged.stock_quantity, 5);
  }
);
