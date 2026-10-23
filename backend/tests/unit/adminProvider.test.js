process.env.LOG_LEVEL = 'silent';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  ADMIN_PROVIDER_SELECT,
  toAdminProvider,
  toAdminProviders,
} = require('../../src/utils/adminProvider');

const providerFake = {
  id: 'prov-1',
  user_id: 'user-1',
  business_name: 'Hotel do Rex',
  document: '12345678000190',
  document_type: 'CNPJ',
  status: 'REJEITADO',
  rejection_reason: 'Documentação ilegível',
  user: { full_name: 'Rex Silva', email: 'rex@petplus.test', role_id: 3, is_active: true },
};

test('toAdminProvider mantém os dados de moderação que as rotas públicas escondem', () => {
  const admin = toAdminProvider(providerFake);

  assert.equal(admin.document, '12345678000190');
  assert.equal(admin.document_type, 'CNPJ');
  assert.equal(admin.rejection_reason, 'Documentação ilegível');
});

test('toAdminProvider achata o usuário no formato do painel de aprovações', () => {
  const admin = toAdminProvider(providerFake);

  assert.equal(admin.full_name, 'Rex Silva');
  assert.equal(admin.email, 'rex@petplus.test');
  assert.equal(admin.role_id, 3);
  assert.equal(admin.user, undefined);
});

test('toAdminProvider trata is_active nulo como conta ativa e false como desativada', () => {
  const semValor = toAdminProvider({ ...providerFake, user: { ...providerFake.user, is_active: null } });
  const desativada = toAdminProvider({ ...providerFake, user: { ...providerFake.user, is_active: false } });

  assert.equal(semValor.is_active, true);
  assert.equal(desativada.is_active, false);
});

test('toAdminProvider aceita null e toAdminProviders converte a lista inteira', () => {
  assert.equal(toAdminProvider(null), null);

  const lista = toAdminProviders([providerFake, { ...providerFake, id: 'prov-2' }]);
  assert.equal(lista.length, 2);
  assert.ok(lista.every((p) => p.document === '12345678000190'));
});

test('select administrativo nunca pede password_hash nem dados além do necessário', () => {
  assert.equal(ADMIN_PROVIDER_SELECT.user.select.password_hash, undefined);
  assert.equal(ADMIN_PROVIDER_SELECT.user.select.phone, undefined);
  assert.equal(ADMIN_PROVIDER_SELECT.document, true);
  assert.equal(ADMIN_PROVIDER_SELECT.rejection_reason, true);
});
