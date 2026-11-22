process.env.LOG_LEVEL = 'silent';
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const prisma = require('../../src/config/database');
const app = require('../../src/app');
const { getDbIntegrationSkipReason, prepareTestDatabase, resetTestDatabase, disconnectTestDatabase } = require('../helpers/dbIntegration');
const { seedRoles, createAuthenticatedTutor, createStoreWithProduct } = require('../helpers/testSeed');
const skip = getDbIntegrationSkipReason();
before(async () => { if (!skip) await prepareTestDatabase(); });
beforeEach(async () => { if (!skip) { await resetTestDatabase(); await seedRoles(); } });
after(async () => { if (!skip) await disconnectTestDatabase(); });
const auth = user => 'Bearer ' + jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET);
const merge = (user, body) => request(app).post('/api/v1/cart/merge').set('Authorization', auth(user)).send(body);
async function setup() {
  const { tutor } = await createAuthenticatedTutor();
  const { product, provider, storeUser } = await createStoreWithProduct({ stock_quantity: 20 });
  const cart = await prisma.cart.create({ data: { user_id: tutor.id } });
  await prisma.cartItem.create({ data: { cart_id: cart.id, product_id: product.id, quantity: 3, unit_price_snapshot: product.price } });
  return { tutor, product, provider, storeUser, cart,
    body: { items: [{ product_id: product.id, quantity: 2 }], baseline: [{ product_id: product.id, quantity: 3 }] } };
}
test('E-18: repetir merge após resposta perdida mantém soma original, sem duplicar', { skip }, async () => {
  const { tutor, body, cart } = await setup();
  for (let i = 0; i < 3; i++) {
    const response = await merge(tutor, body);
    assert.equal(response.status, 200); assert.equal(response.body.items[0].quantity, 5);
  }
  assert.equal((await prisma.cartItem.findFirst({ where: { cart_id: cart.id } })).quantity, 5);
});
test('E-18: merges concorrentes do mesmo alvo não somam duas vezes', { skip }, async () => {
  const { tutor, body, cart } = await setup();
  const responses = await Promise.all([merge(tutor, body), merge(tutor, body)]);
  assert(responses.some(res => res.status === 200));
  assert(responses.every(res => [200, 409].includes(res.status)));
  assert.equal((await merge(tutor, body)).status, 200);
  assert.equal((await prisma.cartItem.findFirst({ where: { cart_id: cart.id } })).quantity, 5);
});
test('E-18: alteração concorrente conflitante não é sobrescrita nem deixa merge parcial', { skip }, async () => {
  const { tutor, cart, product } = await setup();
  const { product: second } = await createStoreWithProduct({ stock_quantity: 20 });
  const [first, conflicting] = [product, second].sort((a, b) => a.id.localeCompare(b.id));
  await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });
  await prisma.cartItem.create({ data: { cart_id: cart.id, product_id: conflicting.id, quantity: 7, unit_price_snapshot: conflicting.price } });
  const response = await merge(tutor, { items: [{ product_id: first.id, quantity: 1 }, { product_id: conflicting.id, quantity: 2 }], baseline: [{ product_id: conflicting.id, quantity: 3 }] });
  assert.equal(response.status, 409);
  const rows = await prisma.cartItem.findMany({ where: { cart_id: cart.id } });
  assert.equal(rows.length, 1); assert.equal(rows[0].quantity, 7);
});
test('E-18: estoque/limite e conta proprietária continuam respeitados', { skip }, async () => {
  const { tutor, body, product, cart } = await setup();
  body.items[0].quantity = 99;
  assert.equal((await merge(tutor, body)).body.items[0].quantity, 20);
  assert.equal((await merge(tutor, body)).body.items[0].quantity, 20);
  const { tutor: other } = await createAuthenticatedTutor();
  assert.equal((await merge(other, body)).status, 409);
  assert.equal((await prisma.cartItem.findFirst({ where: { cart_id: cart.id, product_id: product.id } })).quantity, 20);
  assert.equal((await request(app).post('/api/v1/cart/merge').send(body)).status, 401);
  assert.equal((await merge(tutor, { ...body, items: [body.items[0], body.items[0]] })).status, 422);
});
test('E-18: consulta usada na confirmação aceita só pedido do tutor autenticado', { skip }, async () => {
  const { tutor, provider, storeUser } = await setup();
  const { tutor: other } = await createAuthenticatedTutor();
  const order = await prisma.order.create({ data: { customer_id: tutor.id, provider_id: provider.id, status: 'PREPARANDO', total_price: '42.50' } });
  const path = `/api/v1/orders/${order.id}/payment-status`;
  const own = await request(app).get(path).set('Authorization', auth(tutor));
  assert.equal(own.status, 200); assert.equal(own.body.order.status, 'PREPARANDO'); assert.equal(Number(own.body.order.total_price), 42.5);
  assert.equal((await request(app).get(path).set('Authorization', auth(other))).status, 404);
  assert.equal((await request(app).get(path).set('Authorization', auth(storeUser))).status, 403);
  assert.equal((await request(app).get(path)).status, 401);
});
