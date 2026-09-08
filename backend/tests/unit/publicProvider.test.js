process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';
const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { toPublicProvider, toPublicProviders } = require('../../src/utils/publicProvider');
const { PROVIDER_INCLUDE } = require('../../src/useCases/products/ListActiveProductsUseCase');
const { PRODUCT_DETAILS_INCLUDE } = require('../../src/useCases/products/GetProductDetailsUseCase');

afterEach(() => mock.restoreAll());

const providerFake = {
  id: 'prov-1',
  business_name: 'Hotel do Rex',
  document: '12.345.678/0001-90',
  document_type: 'CNPJ',
  rejection_reason: 'Documentação ilegível',
  city: 'São Paulo',
  daily_rate: 120,
};

test('toPublicProvider remove CPF/CNPJ, tipo do documento e motivo de recusa', () => {
  const publico = toPublicProvider(providerFake);

  assert.equal(publico.document, undefined);
  assert.equal(publico.document_type, undefined);
  assert.equal(publico.rejection_reason, undefined);
});

test('toPublicProvider preserva os campos públicos e não muta o original', () => {
  const publico = toPublicProvider(providerFake);

  assert.equal(publico.business_name, 'Hotel do Rex');
  assert.equal(publico.city, 'São Paulo');
  assert.equal(publico.daily_rate, 120);
  // o objeto de origem segue intacto para uso interno/admin
  assert.equal(providerFake.document, '12.345.678/0001-90');
});

test('toPublicProvider aceita null sem quebrar', () => {
  assert.equal(toPublicProvider(null), null);
  assert.equal(toPublicProvider(undefined), undefined);
});

test('toPublicProviders limpa a lista inteira', () => {
  const lista = toPublicProviders([providerFake, { ...providerFake, id: 'prov-2' }]);

  assert.equal(lista.length, 2);
  assert.ok(lista.every((p) => p.document === undefined));
});

test('listagem pública de produtos não pede o document do parceiro', () => {
  assert.equal(PROVIDER_INCLUDE.provider.select.document, undefined);
  assert.equal(PROVIDER_INCLUDE.provider.select.business_name, true);
});

test('detalhe público de produto não pede o document do parceiro', () => {
  assert.equal(PRODUCT_DETAILS_INCLUDE.provider.select.document, undefined);
  assert.equal(PRODUCT_DETAILS_INCLUDE.provider.select.business_name, true);
});

test('nenhum select público de produto pede password_hash do usuário', () => {
  for (const include of [PROVIDER_INCLUDE, PRODUCT_DETAILS_INCLUDE]) {
    assert.equal(include.provider.select.user.select.password_hash, undefined);
  }
});
