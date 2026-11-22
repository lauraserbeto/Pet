process.env.LOG_LEVEL = 'silent';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const prisma = require('../../src/config/database');
const app = require('../../src/app');
const { getDbIntegrationSkipReason, prepareTestDatabase, resetTestDatabase, disconnectTestDatabase } = require('../helpers/dbIntegration');
const { seedRoles, createAuthenticatedTutor, createStoreWithProduct } = require('../helpers/testSeed');
const skip = getDbIntegrationSkipReason();
before(async () => { if (!skip) { await prepareTestDatabase(); await resetTestDatabase(); await seedRoles(); } });
after(async () => { if (!skip) await disconnectTestDatabase(); });
test('E-19: paginação completa, empate estável, busca global e indicadores isolados da página/loja', { skip }, async () => {
  const { tutor } = await createAuthenticatedTutor();
  const { tutor: needle } = await createAuthenticatedTutor({ full_name: 'Cliente Localizavel QA' });
  const store = await createStoreWithProduct(), other = await createStoreWithProduct();
  const date = new Date(Date.now() - 1000);
  for (let i = 0; i < 25; i++) await prisma.order.create({ data: {
    provider_id: store.provider.id, customer_id: tutor.id, total_price: '10.10',
    status: i < 20 ? 'PAGO' : 'AGUARDANDO_PAGAMENTO', created_at: date,
  } });
  const found = await prisma.order.create({ data: { provider_id: store.provider.id,
    customer_id: needle.id, total_price: '900', status: 'CANCELADO', created_at: new Date(date.getTime() - 1000) } });
  await prisma.order.create({ data: { provider_id: other.provider.id, customer_id: needle.id, total_price: '800', status: 'PAGO' } });
  const get = (path, user) => request(app).get(path).set('Authorization', 'Bearer ' + jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET));
  const one = await get('/api/v1/providers/orders?view=page&page=1', store.storeUser);
  const two = await get('/api/v1/providers/orders?view=page&page=2', store.storeUser);
  assert.equal(one.status, 200); assert.equal(two.status, 200);
  assert.equal(one.body.orders.length, 20); assert.equal(two.body.orders.length, 6);
  assert.equal(one.body.total, 26); assert.equal(one.body.totalPages, 2);
  assert.equal(one.body.summary.totalOrders, 26); assert.equal(one.body.summary.pendingOrders, 25);
  assert.equal(one.body.summary.monthlyRevenue, 202);
  assert.deepEqual(one.body.summary.totalOrders, two.body.summary.totalOrders);
  const all = [...one.body.orders, ...two.body.orders].map(o => o.id);
  assert.equal(new Set(all).size, 26);
  const again = await get('/api/v1/providers/orders?view=page', store.storeUser);
  assert.deepEqual(one.body.orders.map(o => o.id), again.body.orders.map(o => o.id));
  for (const q of ['Localizavel', found.id.slice(0, 8)]) {
    const result = await get('/api/v1/providers/orders?view=page&q=' + q, store.storeUser);
    assert.equal(result.body.total, 1); assert.equal(result.body.orders[0].id, found.id);
    assert.equal(result.body.summary.totalOrders, 26);
  }
  const literal = await get('/api/v1/providers/orders?view=page&q=%25', store.storeUser);
  assert.equal(literal.body.total, 0);
  const mine = await get('/api/v1/orders?view=page&page=2', tutor);
  assert.equal(mine.body.total, 25); assert.equal(mine.body.orders.length, 5);
  const legacy = await get('/api/v1/orders', tutor);
  assert(Array.isArray(legacy.body)); assert.equal(legacy.headers['x-total-count'], '25');
  for (const query of ['page=0', 'page=10000000000', 'limit=101', 'q=' + 'a'.repeat(101)])
    assert.equal((await get('/api/v1/providers/orders?' + query, store.storeUser)).status, 422);
  assert.equal((await request(app).get('/api/v1/orders?view=page')).status, 401);
  const beyond = await get('/api/v1/providers/orders?view=page&page=3', store.storeUser);
  assert.equal(beyond.body.total, 26); assert.deepEqual(beyond.body.orders, []);
  const { tutor: emptyUser } = await createAuthenticatedTutor();
  const empty = await get('/api/v1/orders?view=page', emptyUser);
  assert.equal(empty.body.total, 0); assert.equal(empty.body.totalPages, 0); assert.deepEqual(empty.body.orders, []);
});
