process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL = 'https://petplus.test';
process.env.MERCADO_PAGO_ENABLED = 'true';
process.env.MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-test-only';
process.env.MERCADO_PAGO_TEST_USER_ID = '999';
process.env.MERCADO_PAGO_WEBHOOK_SECRET = 'test-secret';
process.env.BACKEND_PUBLIC_URL = 'https://api.petplus.test';

const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signTestToken } = require('../helpers/authState');
const prisma = require('../../src/config/database');
const gateway = require('../../src/services/MercadoPagoService');
const app = require('../../src/app');
const { paymentFixture } = require('../helpers/paymentFixture');
let fixture;
const originalMethods = [];
beforeEach(() => {
  fixture = paymentFixture();
  for (const model of ['order', 'paymentAttempt']) {
    for (const [name, implementation] of Object.entries(fixture.database[model])) {
      const original = prisma[model][name];
      prisma[model][name] = implementation;
      originalMethods.push({ model, name, original });
    }
  }
  for (const name of ['assertTestAccount', 'createPreference', 'getPayment']) mock.method(gateway, name, fixture.gateway[name]);
});
afterEach(() => {
  for (const { model, name, original } of originalMethods.splice(0)) prisma[model][name] = original;
  mock.restoreAll();
});
function token(role = 5, userId = fixture.userId) {
  return signTestToken({ id: userId, role_id: role });
}

test('configuração expõe somente modo, sem credenciais', async () => {
  const response = await request(app).get('/api/v1/orders/payment-config').set('Authorization', `Bearer ${token()}`);
  assert.deepEqual(response.body, { provider: 'MERCADO_PAGO', sandbox: true });
});
test('criar preferência exige autenticação e UUID válido', async () => {
  assert.equal((await request(app).post(`/api/v1/orders/${fixture.orderId}/payment-preference`)).status, 401);
  assert.equal((await request(app).post('/api/v1/orders/invalid/payment-preference').set('Authorization', `Bearer ${token()}`)).status, 422);
});
test('preferência retorna link hospedado para pedido próprio', async () => {
  const response = await request(app).post(`/api/v1/orders/${fixture.orderId}/payment-preference`).set('Authorization', `Bearer ${token()}`);
  assert.equal(response.status, 201);
  assert.equal(response.body.preferenceId, 'preference-123');
});
test('preferência oculta pedido de outro tutor', async () => {
  const response = await request(app).post(`/api/v1/orders/${fixture.orderId}/payment-preference`).set('Authorization', `Bearer ${token(5, 'other')}`);
  assert.equal(response.status, 404);
});
test('status permite retomar somente pedidos do tutor', async () => {
  const own = await request(app).get(`/api/v1/orders/${fixture.orderId}/payment-status`).set('Authorization', `Bearer ${token()}`);
  assert.equal(own.status, 200);
  assert.equal(own.body.order.total_price, 90);
  assert.equal((await request(app).get(`/api/v1/orders/${fixture.orderId}/payment-status`).set('Authorization', `Bearer ${token(5, 'other')}`)).status, 404);
});
test('Mercado Pago habilitado bloqueia confirmação simulada', async () => {
  const response = await request(app).post(`/api/v1/orders/${fixture.orderId}/pay`).set('Authorization', `Bearer ${token()}`);
  assert.equal(response.status, 409);
});
test('webhook público rejeita notificação sem assinatura, sem precisar de JWT', async () => {
  const response = await request(app).post('/api/v1/orders/webhook?data.id=123456&type=payment').send({ data: { id: '123456' } });
  assert.equal(response.status, 401);
});
test('erros do SDK são sanitizados para o cliente', async () => {
  mock.method(gateway, 'createPreference', async () => { throw new Error('Authorization: Bearer private-token'); });
  const response = await request(app).post(`/api/v1/orders/${fixture.orderId}/payment-preference`).set('Authorization', `Bearer ${token()}`);
  assert.equal(response.status, 502);
  assert.equal(JSON.stringify(response.body).includes('private-token'), false);
});
