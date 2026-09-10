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
  createStoreWithProduct,
} = require('../helpers/testSeed');

const skipDbIntegration = getDbIntegrationSkipReason();
let databasePrepared = false;

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
      .set('Authorization', authorization);

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
  }
);

test(
  'POST /api/v1/orders preserva pedido inexistente, estoque e carrinho quando a transacao falha',
  { skip: skipDbIntegration },
  async () => {
    const { authorization, tutor } = await createAuthenticatedTutor();
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
        .set('Authorization', authorization);

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
