const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  PROVIDER_STATUS,
  PROVIDER_STATUS_VALUES,
  isProviderStatus,
  isApprovedProviderStatus,
  hasApprovedSitterEvaluation,
  isOperationalSitter,
} = require('../../src/constants/providerStatus');

test('Provider.status expõe os quatro valores canônicos do enum', () => {
  assert.deepEqual(PROVIDER_STATUS_VALUES, [
    'PENDENTE',
    'APROVADO',
    'REJEITADO',
    'EM_REVISAO',
  ]);
});

test('isApprovedProviderStatus aceita somente APROVADO', () => {
  assert.equal(isApprovedProviderStatus(PROVIDER_STATUS.APPROVED), true);
  assert.equal(isApprovedProviderStatus('ATIVO'), false);
  assert.equal(isApprovedProviderStatus('ACTIVE'), false);
  assert.equal(isApprovedProviderStatus(PROVIDER_STATUS.PENDING), false);
});

test('isProviderStatus valida apenas valores do enum', () => {
  assert.equal(isProviderStatus(PROVIDER_STATUS.IN_REVIEW), true);
  assert.equal(isProviderStatus('QUALQUER_COISA'), false);
});

test('hasApprovedSitterEvaluation encontra avaliação aprovada', () => {
  assert.equal(hasApprovedSitterEvaluation([{ status: 'PENDING' }]), false);
  assert.equal(hasApprovedSitterEvaluation([{ status: 'APPROVED' }]), true);
});

test('isOperationalSitter exige provider APROVADO e avaliação APPROVED', () => {
  assert.equal(
    isOperationalSitter({
      status: PROVIDER_STATUS.APPROVED,
      user: { sitter_evaluations: [{ status: 'APPROVED' }] },
    }),
    true
  );
  assert.equal(
    isOperationalSitter({
      status: PROVIDER_STATUS.APPROVED,
      user: { sitter_evaluations: [] },
    }),
    false
  );
  assert.equal(
    isOperationalSitter({
      status: PROVIDER_STATUS.PENDING,
      user: { sitter_evaluations: [{ status: 'APPROVED' }] },
    }),
    false
  );
});
