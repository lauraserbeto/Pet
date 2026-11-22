const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  registerSchema,
  resetPasswordSchema,
} = require("../../src/schemas/authSchemas");
const { changePasswordSchema } = require("../../src/schemas/userSchemas");
const {
  newPasswordSchema,
  PASSWORD_HASH_COST,
} = require("../../src/security/passwordPolicy");
const {
  normalizeEmail,
  EMAIL_TRIM_CHARS,
} = require("../../src/security/emailIdentity");
test("E-09: mesma política em cadastro, troca e reset, sem remover espaços da senha", () => {
  for (const password of [
    "Senha123",
    " ComEspaco1 ",
    "A1" + "a".repeat(70),
    "A1" + "á".repeat(35),
  ]) {
    assert.equal(
      registerSchema.safeParse({
        full_name: "Laura QA",
        email: "laura@petplus.test",
        password,
        role_id: 5,
        terms_accepted: true,
        terms_version: require("../../src/constants/legalPolicy").version,
      }).success,
      true,
    );
    assert.equal(
      changePasswordSchema.safeParse({
        currentPassword: "AntigaSenha1",
        newPassword: password,
      }).success,
      true,
    );
    assert.equal(
      resetPasswordSchema.safeParse({ token: "test-token", password }).success,
      true,
    );
    assert.equal(newPasswordSchema.parse(password), password);
  }
  for (const password of [
    "curta1",
    "novasenha1",
    "NOVASENHA",
    "A1" + "a".repeat(71),
    "A1" + "á".repeat(36),
  ]) {
    assert.equal(
      registerSchema.safeParse({
        full_name: "Laura QA",
        email: "laura@petplus.test",
        password,
        role_id: 5,
        terms_accepted: true,
        terms_version: require("../../src/constants/legalPolicy").version,
      }).success,
      false,
    );
    assert.equal(
      changePasswordSchema.safeParse({
        currentPassword: "AntigaSenha1",
        newPassword: password,
      }).success,
      false,
    );
    assert.equal(
      resetPasswordSchema.safeParse({ token: "test-token", password }).success,
      false,
    );
  }
  assert.equal(PASSWORD_HASH_COST, 12);
});
test("E-09: e-mail normaliza caixa/bordas, preservando pontos e aliases +", () => {
  assert.equal(
    normalizeEmail("\t Maria.Silva+Pet@EXAMPLE.COM\u00A0"),
    "maria.silva+pet@example.com",
  );
  for (const char of EMAIL_TRIM_CHARS)
    assert.equal(
      normalizeEmail(char + "Nome@EXAMPLE.COM" + char),
      "nome@example.com",
    );
});
