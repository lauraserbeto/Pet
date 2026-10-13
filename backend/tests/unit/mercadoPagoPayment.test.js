process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { MercadoPagoService } = require('../../src/services/MercadoPagoService');
const { CreatePaymentPreferenceUseCase } = require('../../src/useCases/payments/CreatePaymentPreferenceUseCase');
const { ProcessPaymentWebhookUseCase } = require('../../src/useCases/payments/ProcessPaymentWebhookUseCase');
const { paymentFixture } = require('../helpers/paymentFixture');

function create(fixture) {
  return new CreatePaymentPreferenceUseCase(fixture).execute({ userId: fixture.userId, userRole: 5, orderId: fixture.orderId });
}
function notify(fixture) {
  return new ProcessPaymentWebhookUseCase(fixture).execute({
    signature: 'signed', requestId: 'request', query: { 'data.id': '123456', type: 'payment' },
    body: { data: { id: '123456' }, type: 'payment', status: 'approved' },
  });
}

test('preferência usa preços congelados do banco, referência do pedido e URLs HTTPS', async () => {
  const fixture = paymentFixture();
  let payload;
  mock.method(fixture.gateway, 'createPreference', async (body) => {
    payload = body;
    return { id: 'pref', init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref' };
  });
  const result = await create(fixture);
  assert.equal(payload.items[0].unit_price, 45);
  assert.equal(payload.external_reference, fixture.orderId);
  assert.equal(payload.metadata.payment_attempt_id, fixture.attemptId);
  assert.equal(payload.notification_url, 'https://api.petplus.test/api/v1/orders/webhook');
  assert.equal(new URL(payload.back_urls.success).pathname, '/checkout/payment');
  assert.equal(result.preferenceId, 'pref');
});

test('preferência é reutilizada, sem criar nova cobrança a cada tentativa', async () => {
  const fixture = paymentFixture();
  assert.deepEqual(await create(fixture), await create(fixture));
  assert.equal(fixture.state.preferenceCalls, 1);
});

test('preferência bloqueia pedido de outro tutor e conta sem role de tutor', async () => {
  const fixture = paymentFixture();
  const useCase = new CreatePaymentPreferenceUseCase(fixture);
  await assert.rejects(useCase.execute({ userId: 'other', userRole: 5, orderId: fixture.orderId }), { statusCode: 404 });
  await assert.rejects(useCase.execute({ userId: fixture.userId, userRole: 3, orderId: fixture.orderId }), { statusCode: 403 });
});

test('preferência rejeita pedido já pago e total divergente dos itens', async () => {
  const fixture = paymentFixture();
  fixture.state.order.status = 'PAGO';
  await assert.rejects(create(fixture), { statusCode: 409 });
  fixture.state.order.status = 'AGUARDANDO_PAGAMENTO';
  fixture.state.order.total_price = 80;
  await assert.rejects(create(fixture), { statusCode: 409 });
});

test('SDK valida HMAC real e rejeita assinatura adulterada e cabeçalhos ausentes', () => {
  const service = new MercadoPagoService({ enabled: true, webhookSecret: 'secret-test' });
  const ts = String(Math.floor(Date.now() / 1000));
  const hash = crypto.createHmac('sha256', 'secret-test').update(`id:123456;request-id:request;ts:${ts};`).digest('hex');
  service.verifySignature({ signature: `ts=${ts},v1=${hash}`, requestId: 'request', paymentId: '123456' });
  assert.throws(() => service.verifySignature({ signature: `ts=${ts},v1=${hash}`, requestId: 'other', paymentId: '123456' }), { statusCode: 401 });
  assert.throws(() => service.verifySignature({}), { statusCode: 401 });
});

test('gateway desativado não permite iniciar cobrança', () => {
  assert.throws(() => new MercadoPagoService({ enabled: false }).assertEnabled(), { statusCode: 503 });
});

test('gateway exige vendedor de teste mesmo se token começa por APP_USR', async () => {
  const service = new MercadoPagoService({ enabled: true, testUserId: '999' });
  mock.method(service, 'getAccount', async () => ({ id: 999, tags: ['normal'] }));
  await assert.rejects(service.assertTestAccount(), { code: 'TEST_ACCOUNT_REQUIRED' });
  mock.method(service, 'getAccount', async () => ({ id: 999, tags: ['test_user'] }));
  await service.assertTestAccount();
});

test('webhook consulta pagamento e marca pedido PAGO atomicamente; duplicação não reaplica', async () => {
  const fixture = paymentFixture();
  await create(fixture);
  await notify(fixture);
  assert.equal(fixture.state.order.status, 'PAGO');
  assert.equal(fixture.state.attempt.external_id, '123456');
  assert.equal(fixture.state.attempt.status, 'APPROVED');
  assert.equal((await notify(fixture)).duplicate, true);
  assert.equal(fixture.state.orderUpdates, 1);
});

for (const status of ['pending', 'in_process', 'rejected', 'cancelled']) {
  test(`pagamento ${status} não confirma pedido mesmo com body forjado aprovado`, async () => {
    const fixture = paymentFixture();
    await create(fixture);
    fixture.state.payment.status = status;
    await notify(fixture);
    assert.equal(fixture.state.order.status, 'AGUARDANDO_PAGAMENTO');
    assert.equal(fixture.state.attempt.status, status.toUpperCase());
  });
}

test('pagamento recusado pode ser aprovado em nova tentativa', async () => {
  const fixture = paymentFixture();
  await create(fixture);
  fixture.state.payment.status = 'rejected';
  await notify(fixture);
  fixture.state.payment.status = 'approved';
  fixture.state.payment.date_last_updated = '2026-10-12T13:00:00Z';
  await notify(fixture);
  assert.equal(fixture.state.order.status, 'PAGO');
});

for (const change of [
  { transaction_amount: 1 }, { currency_id: 'USD' }, { collector_id: 123 },
  { live_mode: true }, { metadata: { payment_attempt_id: 'unrelated' } },
]) {
  test(`webhook bloqueia divergência ${Object.keys(change)[0]}`, async () => {
    const fixture = paymentFixture();
    await create(fixture);
    Object.assign(fixture.state.payment, change);
    await assert.rejects(notify(fixture));
    assert.equal(fixture.state.orderUpdates, 0);
  });
}

test('pedido cancelado recebe conciliação pendente, sem voltar para PAGO', async () => {
  const fixture = paymentFixture();
  await create(fixture);
  fixture.state.order.status = 'CANCELADO';
  await notify(fixture);
  assert.equal(fixture.state.order.status, 'CANCELADO');
  assert.equal(fixture.state.attempt.status, 'REVIEW_REQUIRED');
});

test('falha ao gravar pagamento reverte a confirmação do pedido', async () => {
  const fixture = paymentFixture();
  await create(fixture);
  fixture.database.paymentAttempt.update = async () => { throw new Error('falha de gravação'); };
  await assert.rejects(notify(fixture), /falha de gravação/);
  assert.equal(fixture.state.order.status, 'AGUARDANDO_PAGAMENTO');
});

test('webhook sem assinatura válida não consulta API nem altera pedido', async () => {
  const fixture = paymentFixture();
  fixture.gateway.verifySignature = () => { throw new Error('assinatura inválida'); };
  const call = mock.method(fixture.gateway, 'getPayment');
  await assert.rejects(notify(fixture));
  assert.equal(call.mock.calls.length, 0);
});
