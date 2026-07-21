const { test } = require('node:test');
const assert = require('node:assert/strict');
const DocumentVerificationService = require('../../src/services/DocumentVerificationService');

test('isValidCPF aceita CPF válido (com e sem máscara)', () => {
  assert.equal(DocumentVerificationService.isValidCPF('529.982.247-25'), true);
  assert.equal(DocumentVerificationService.isValidCPF('52998224725'), true);
});

test('isValidCPF rejeita dígitos repetidos (ex.: 111.111.111-11)', () => {
  assert.equal(DocumentVerificationService.isValidCPF('111.111.111-11'), false);
  assert.equal(DocumentVerificationService.isValidCPF('00000000000'), false);
});

test('isValidCPF rejeita dígito verificador incorreto', () => {
  assert.equal(DocumentVerificationService.isValidCPF('529.982.247-26'), false);
});

test('isValidCPF rejeita comprimento inválido', () => {
  assert.equal(DocumentVerificationService.isValidCPF('123'), false);
  assert.equal(DocumentVerificationService.isValidCPF('5299822472599'), false);
});

test('verifyCNPJ rejeita comprimento diferente de 14 dígitos', async () => {
  await assert.rejects(() => DocumentVerificationService.verifyCNPJ('123'), /14 dígitos/);
});

test('verifyCNPJ aceita 14 dígitos', async () => {
  const r = await DocumentVerificationService.verifyCNPJ('12.345.678/0001-99');
  assert.ok(r);
});
