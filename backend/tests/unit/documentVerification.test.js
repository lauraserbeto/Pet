const { test } = require("node:test");
const assert = require("node:assert/strict");
const DocumentVerificationService = require("../../src/services/DocumentVerificationService");

test("isValidCPF aceita CPF válido (com e sem máscara)", () => {
  assert.equal(DocumentVerificationService.isValidCPF("529.982.247-25"), true);
  assert.equal(DocumentVerificationService.isValidCPF("52998224725"), true);
});

test("isValidCPF rejeita dígitos repetidos (ex.: 111.111.111-11)", () => {
  assert.equal(DocumentVerificationService.isValidCPF("111.111.111-11"), false);
  assert.equal(DocumentVerificationService.isValidCPF("00000000000"), false);
});

test("isValidCPF rejeita dígito verificador incorreto", () => {
  assert.equal(DocumentVerificationService.isValidCPF("529.982.247-26"), false);
});

test("isValidCPF rejeita comprimento inválido", () => {
  assert.equal(DocumentVerificationService.isValidCPF("123"), false);
  assert.equal(DocumentVerificationService.isValidCPF("5299822472599"), false);
});

test("verifyCNPJ rejeita comprimento e dígitos verificadores inválidos com 422", async () => {
  for (const value of ["123", "12.345.678/0001-99"]) {
    await assert.rejects(
      () => DocumentVerificationService.verifyCNPJ(value),
      (error) => error.statusCode === 422,
    );
  }
});

test("verifyCNPJ aceita CNPJ numérico e alfanumérico com DV válido", async () => {
  for (const value of ["11.222.333/0001-81", "12.ABC.345/01DE-35"]) {
    assert.deepEqual(await DocumentVerificationService.verifyCNPJ(value), {
      mathematically_valid: true,
    });
  }
});
