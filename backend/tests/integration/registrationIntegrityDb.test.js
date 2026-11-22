process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const prisma = require("../../src/config/database");
const app = require("../../src/app");
const Register = require("../../src/useCases/auth/RegisterUseCase");
const policy = require("../../src/constants/legalPolicy");
const { EMAIL_TRIM_CHARS } = require("../../src/security/emailIdentity");
const { normalizeDocument } = require("../../src/security/documentIdentity");
const {
  auditRegistrationIdentities,
} = require("../../scripts/audit-registration-identities");
const {
  getDbIntegrationSkipReason,
  prepareTestDatabase,
  resetTestDatabase,
  disconnectTestDatabase,
} = require("../helpers/dbIntegration");
const { seedRoles, createApprovedPartner } = require("../helpers/testSeed");
const skip = getDbIntegrationSkipReason();
let prepared = false;
before(async () => {
  if (!skip) {
    await prepareTestDatabase();
    prepared = true;
  }
});
beforeEach(async () => {
  if (!skip) {
    await resetTestDatabase();
    await seedRoles();
  }
});
after(async () => {
  if (prepared) await disconnectTestDatabase();
});
const base = {
  full_name: "Pessoa QA",
  email: "novo@petplus.test",
  password: "Senha123",
  role_id: 5,
  terms_accepted: true,
  terms_version: policy.version,
};
const partner = {
  ...base,
  role_id: 4,
  business_name: "Parceiro QA",
  document: "529.982.247-25",
  document_type: "CPF",
};

test(
  "E-10 DB: metadados públicos e cadastro dos quatro perfis gravam aceite atual e documento canônico",
  { skip },
  async () => {
    const info = await request(app).get("/api/v1/legal/policy");
    assert.equal(info.status, 200);
    assert.deepEqual(info.body, policy);
    assert.equal(info.headers["cache-control"], "no-store");
    const start = Date.now();
    for (const [role_id, document, document_type] of [
      [2, "12.abc.345/01de-35", "CNPJ"],
      [3, "11.222.333/0001-81", "CNPJ"],
      [4, "529.982.247-25", "CPF"],
      [5, undefined, undefined],
    ]) {
      const reply = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...base,
          role_id,
          email: `novo-${role_id}@petplus.test`,
          business_name: "Parceiro QA",
          document,
          document_type,
          terms_accepted_at: "2000-01-01",
        });
      assert.equal(reply.status, 201, JSON.stringify(reply.body));
      assert.equal(reply.body.user.password_hash, undefined);
      const saved = await prisma.user.findUnique({
        where: { id: reply.body.user.id },
        include: { provider: true },
      });
      assert.equal(saved.terms_accepted, true);
      assert.equal(saved.terms_version, policy.version);
      assert(
        saved.terms_accepted_at.getTime() >= start &&
          saved.terms_accepted_at.getTime() <= Date.now(),
      );
      if (role_id !== 5) {
        assert.equal(saved.provider.document, normalizeDocument(document));
        assert.equal(saved.provider.status, "PENDENTE");
      } else assert.equal(saved.provider, null);
    }
  },
);
test(
  "E-10 DB: sem aceite verdadeiro ou com versão ausente/antiga não cria usuário",
  { skip },
  async () => {
    for (const values of [
      { terms_accepted: false },
      { terms_accepted: undefined },
      { terms_accepted: "true" },
      { terms_version: undefined },
      { terms_version: "2000-01-01" },
    ]) {
      await assert.rejects(
        Register.execute({ ...base, ...values }),
        (e) => e.name === "ZodError",
      );
    }
    const reply = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...base, terms_accepted: false });
    assert.equal(reply.status, 422);
    assert.equal(await prisma.user.count(), 0);
  },
);
test(
  "E-10 DB: documento inválido ou CPF para loja/hotel falham antes de persistir",
  { skip },
  async () => {
    for (const input of [
      { ...partner, document: "11111111111" },
      { ...partner, document_type: "CNPJ", document: "12345678000199" },
      { ...partner, role_id: 2 },
      { ...partner, role_id: 3 },
      { ...partner, document: "52998224725!" },
    ])
      await assert.rejects(
        Register.execute(input),
        (e) => e.name === "ZodError",
      );
    assert.equal(await prisma.user.count(), 0);
    assert.equal(await prisma.provider.count(), 0);
  },
);
test(
  "E-10 DB: duplicata de documento legado formatado não cria nova conta nem reescreve o legado",
  { skip },
  async () => {
    const { provider } = await createApprovedPartner();
    const raw = "\t12.abc.345/01de-35\u00a0";
    await prisma.provider.update({
      where: { id: provider.id },
      data: { document: raw },
    });
    await assert.rejects(
      Register.execute({
        ...partner,
        document_type: "CNPJ",
        document: "12ABC34501DE35",
      }),
      (e) => e.statusCode === 409,
    );
    assert.equal(
      (await prisma.provider.findUnique({ where: { id: provider.id } }))
        .document,
      raw,
    );
    assert.equal(await prisma.user.count(), 1);
    const [sql] =
      await prisma.$queryRaw`SELECT petplus_normalize_document(${EMAIL_TRIM_CHARS + "12.abc.345/01de-35" + EMAIL_TRIM_CHARS}) AS normalized`;
    assert.equal(sql.normalized, "12ABC34501DE35");
  },
);
test(
  "E-10 DB: corrida com o mesmo documento cria um único usuário/parceiro e aceite",
  { skip },
  async () => {
    const results = await Promise.allSettled([
      Register.execute(partner),
      Register.execute({
        ...partner,
        email: "outra@petplus.test",
        document: "52998224725",
      }),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      results.find((r) => r.status === "rejected").reason.statusCode,
      409,
    );
    assert.equal(await prisma.user.count(), 1);
    assert.equal(await prisma.provider.count(), 1);
  },
);
test(
  "E-10 DB: falha na criação comercial reverte também usuário e metadados de aceite",
  { skip },
  async () => {
    await prisma.$executeRawUnsafe(
      "CREATE FUNCTION qa_e10_fail_provider() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'QA_E10_WRITE_FAILURE'; END $$",
    );
    await prisma.$executeRawUnsafe(
      "CREATE TRIGGER qa_e10_fail_provider BEFORE INSERT ON providers FOR EACH ROW EXECUTE FUNCTION qa_e10_fail_provider()",
    );
    try {
      await assert.rejects(Register.execute(partner));
      assert.equal(await prisma.user.count(), 0);
      assert.equal(await prisma.provider.count(), 0);
    } finally {
      await prisma.$executeRawUnsafe(
        "DROP TRIGGER qa_e10_fail_provider ON providers",
      );
      await prisma.$executeRawUnsafe("DROP FUNCTION qa_e10_fail_provider()");
    }
  },
);
test(
  "E-10 DB: default não presume aceite e constraint impede metadados incompletos",
  { skip },
  async () => {
    const user = await prisma.user.create({
      data: {
        full_name: "Sem declaração QA",
        email: "sem@petplus.test",
        role_id: 5,
      },
    });
    assert.equal(user.terms_accepted, false);
    assert.equal(user.terms_version, null);
    assert.equal(user.terms_accepted_at, null);
    await assert.rejects(
      prisma.user.update({
        where: { id: user.id },
        data: { terms_version: policy.version },
      }),
    );
    await assert.rejects(
      prisma.user.update({
        where: { id: user.id },
        data: { terms_version: policy.version, terms_accepted_at: new Date() },
      }),
    );
  },
);
test(
  "E-10 DB: auditoria somente leitura identifica inválidos sem imprimir documentos",
  { skip },
  async () => {
    const { provider } = await createApprovedPartner();
    const before = await prisma.provider.findUnique({
      where: { id: provider.id },
    });
    const report = await auditRegistrationIdentities();
    assert.equal(report.invalid_providers[0].id, provider.id);
    assert.equal(report.providers, 1);
    assert(!JSON.stringify(report).includes(before.document));
    assert(!JSON.stringify(report).includes("@"));
    assert.deepEqual(
      await prisma.provider.findUnique({ where: { id: provider.id } }),
      before,
    );
  },
);
