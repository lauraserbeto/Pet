process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  PAYMENT_POLICY,
  DEFAULT_PAYMENT_POLICY,
  normalizePaymentPolicy,
  isPrepaid,
  isValidPaymentPolicy,
} = require('../../src/constants/paymentPolicy');

test('o padrão é cobrança presencial', () => {
  assert.equal(DEFAULT_PAYMENT_POLICY, PAYMENT_POLICY.ON_SITE);
  assert.equal(PAYMENT_POLICY.ON_SITE, 'PRESENCIAL');
  assert.equal(PAYMENT_POLICY.PREPAID, 'PRE_PAGO');
});

test('valor ausente ou desconhecido cai no padrão — nunca em pré-pago', () => {
  for (const entrada of [null, undefined, '', 'QUALQUER_COISA', 42]) {
    assert.equal(normalizePaymentPolicy(entrada), PAYMENT_POLICY.ON_SITE);
    assert.ok(!isPrepaid(entrada));
  }
});

test('normaliza caixa e espaços', () => {
  assert.equal(normalizePaymentPolicy(' pre_pago '), PAYMENT_POLICY.PREPAID);
  assert.ok(isPrepaid('pre_pago'));
});

test('isValidPaymentPolicy aceita só os canônicos', () => {
  assert.ok(isValidPaymentPolicy('PRESENCIAL'));
  assert.ok(!isValidPaymentPolicy('pre_pago'));
});
