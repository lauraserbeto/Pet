const { test } = require("node:test");
const assert = require("node:assert/strict");
const { registerSchema } = require("../../src/schemas/authSchemas");
const {
  normalizeDocument,
  isValidCPF,
  isValidCNPJ,
} = require("../../src/security/documentIdentity");
const DocumentService = require("../../src/services/DocumentVerificationService");
const policy = require("../../src/constants/legalPolicy");
const base = {
  full_name: "Pessoa QA",
  email: "qa@petplus.test",
  password: "Senha123",
  role_id: 5,
  terms_accepted: true,
  terms_version: policy.version,
};
test("E-10: CPF e CNPJ numérico/alfanumérico verificam DV, formato e normalização", () => {
  assert(isValidCPF("529.982.247-25"));
  assert(isValidCNPJ("11.222.333/0001-81"));
  assert(isValidCNPJ("12.abc.345/01de-35"));
  assert.equal(normalizeDocument("\t12.abc.345/01de-35 "), "12ABC34501DE35");
  for (const invalid of [
    "11111111111",
    "52998224724",
    "5299822472A",
    "52998224725!",
  ])
    assert(!isValidCPF(invalid));
  for (const invalid of [
    "00000000000000",
    "11111111111111",
    "11222333000180",
    "12ABC34501DE34",
    "12ABC34501DE3A",
    "12ABC34501DE35!",
  ])
    assert(!isValidCNPJ(invalid));
});
test("E-10: serviço de CNPJ deixou de aceitar somente pelo tamanho", async () => {
  await assert.rejects(
    DocumentService.verifyCNPJ("12345678000199"),
    (e) => e.statusCode === 422,
  );
  assert.deepEqual(await DocumentService.verifyCNPJ("12ABC34501DE35"), {
    mathematically_valid: true,
  });
});
test("E-10: aceite exige booleano true e versão vigente, não presença ou coerção", () => {
  assert(registerSchema.safeParse(base).success);
  for (const terms_accepted of [false, undefined, null, "true", 1])
    assert(!registerSchema.safeParse({ ...base, terms_accepted }).success);
  for (const terms_version of [undefined, "2020-01-01", ""])
    assert(!registerSchema.safeParse({ ...base, terms_version }).success);
  const parsed = registerSchema.parse({
    ...base,
    terms_accepted_at: "2000-01-01",
  });
  assert.equal(parsed.terms_accepted_at, undefined);
});
test("E-10: CNPJ obrigatório para loja/hotel; sitter aceita CPF ou CNPJ", () => {
  for (const role_id of [2, 3, 4]) {
    const data = {
      ...base,
      role_id,
      business_name: "Parceiro QA",
      document_type: "CNPJ",
      document: "12ABC34501DE35",
    };
    assert(registerSchema.safeParse(data).success);
    assert(
      !registerSchema.safeParse({ ...data, document: "12345678000199" })
        .success,
    );
    assert(!registerSchema.safeParse({ ...data, business_name: "" }).success);
    assert.equal(
      registerSchema.safeParse({
        ...data,
        document_type: "CPF",
        document: "52998224725",
      }).success,
      role_id === 4,
    );
  }
  assert(!registerSchema.safeParse({ ...base, role_id: "2" }).success);
});

test("E-10: versão dos textos do frontend acompanha a política publicada pela API", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const source = fs.readFileSync(
    path.resolve(__dirname, "../../../frontend/src/content/legal/version.ts"),
    "utf8",
  );
  assert.equal(
    source.match(/LEGAL_TEXT_VERSION\s*=\s*"([^"]+)"/)[1],
    policy.version,
  );
  for (const filename of ["terms.ts", "privacy.ts"]) {
    const text = fs.readFileSync(
      path.resolve(__dirname, "../../../frontend/src/content/legal", filename),
      "utf8",
    );
    assert.match(text, /lastUpdated: "20 de fevereiro de 2026"/);
  }
});
