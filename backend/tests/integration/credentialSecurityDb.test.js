process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const {
  test,
  before,
  beforeEach,
  afterEach,
  after,
  mock,
} = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const request = require("supertest");
const prisma = require("../../src/config/database");
const app = require("../../src/app");
const Register = require("../../src/useCases/auth/RegisterUseCase");
const Login = require("../../src/useCases/auth/LoginUseCase");
const Change = require("../../src/useCases/users/ChangePasswordUseCase");
const {
  ForgotPasswordUseCase: Forgot,
  ResetPasswordUseCase: Reset,
} = require("../../src/useCases/auth/PasswordResetUseCase");
const EmailService = require("../../src/services/EmailService");
const {
  auditEmailIdentities,
} = require("../../scripts/audit-email-identities");
const {
  EMAIL_TRIM_CHARS,
  normalizeEmail,
} = require("../../src/security/emailIdentity");
const {
  getDbIntegrationSkipReason,
  prepareTestDatabase,
  resetTestDatabase,
  disconnectTestDatabase,
} = require("../helpers/dbIntegration");
const { seedRoles, createAuthenticatedTutor } = require("../helpers/testSeed");
const skip = getDbIntegrationSkipReason();
let prepared = false,
  sent = [];
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
  sent = [];
  mock.method(EmailService, "sendPasswordReset", async (to, url) => {
    sent.push({ to, url });
    return { id: "qa-message" };
  });
});
afterEach(() => mock.restoreAll());
after(async () => {
  if (prepared) await disconnectTestDatabase();
});
async function account({ email, password = "AntigaSenha1", cost = 4 } = {}) {
  const ctx = await createAuthenticatedTutor();
  const hash = await bcrypt.hash(password, cost);
  const user = await prisma.user.update({
    where: { id: ctx.tutor.id },
    data: { password_hash: hash, ...(email ? { email } : {}) },
  });
  return { ...ctx, user, password, hash };
}
async function link(userId, expires_at = new Date(Date.now() + 60000)) {
  const raw = crypto.randomBytes(32).toString("hex");
  const record = await prisma.passwordResetToken.create({
    data: {
      user_id: userId,
      token_hash: crypto.createHash("sha256").update(raw).digest("hex"),
      expires_at,
    },
  });
  return { raw, record };
}
const current = (id) => prisma.user.findUnique({ where: { id } });
test(
  "E-09 DB: cadastro grava e-mail canônico/hash 12; login antigo custo 10 e senha fora da política continuam válidos",
  { skip },
  async () => {
    const reply = await request(app)
      .post("/api/v1/auth/register")
      .send({
        full_name: "Maria QA",
        email: "\t Maria@PETPLUS.TEST \u00A0",
        password: "NovaSenha1",
        role_id: 5,
        terms_accepted: true,
        terms_version: require("../../src/constants/legalPolicy").version,
      });
    assert.equal(reply.status, 201, JSON.stringify(reply.body));
    assert.equal(reply.body.user.email, "maria@petplus.test");
    assert.equal(reply.body.user.password_hash, undefined);
    assert.equal(
      bcrypt.getRounds((await current(reply.body.user.id)).password_hash),
      12,
    );
    assert.ok(
      (await Login.execute(" MARIA@PETPLUS.TEST ", "NovaSenha1")).token,
    );
    const legacy = await account({ password: "curta1", cost: 10 });
    assert.ok((await Login.execute(legacy.user.email, "curta1")).token);
    assert.equal((await current(legacy.user.id)).password_hash, legacy.hash);
  },
);
test(
  "E-09 DB: legado com bordas/maiúsculas recupera acesso sem reescrita de e-mail; índice acompanha trim do cliente",
  { skip },
  async () => {
    const email = "\t Legacy+Pet@PETPLUS.TEST\u00A0";
    const ctx = await account({ email });
    assert.equal(
      (await Login.execute("legacy+pet@petplus.test", ctx.password)).user.id,
      ctx.user.id,
    );
    await Forgot.execute(" LEGACY+PET@PETPLUS.TEST ");
    assert.equal(sent[0].to, "legacy+pet@petplus.test");
    assert.equal((await current(ctx.user.id)).email, email);
    const canonical =
      await prisma.$queryRaw`SELECT petplus_normalize_email(${EMAIL_TRIM_CHARS + "Nome@EXAMPLE.COM" + EMAIL_TRIM_CHARS}) AS email`;
    assert.equal(
      canonical[0].email,
      normalizeEmail(EMAIL_TRIM_CHARS + "Nome@EXAMPLE.COM" + EMAIL_TRIM_CHARS),
    );
    const other = await createAuthenticatedTutor();
    await assert.rejects(
      prisma.user.update({
        where: { id: other.tutor.id },
        data: { email: " LEGACY+pet@petplus.test " },
      }),
      { code: "P2002" },
    );
    const report = await auditEmailIdentities();
    assert.equal(report.noncanonical, 1);
    assert.deepEqual(report.collision_groups, []);
    assert.equal(JSON.stringify(report).includes("Legacy+Pet"), false);
  },
);
test(
  "E-09 DB: cadastros concorrentes com variantes do mesmo e-mail criam uma única conta",
  { skip },
  async () => {
    const base = {
      full_name: "Cadastro QA",
      password: "NovaSenha1",
      role_id: 5,
      terms_accepted: true,
      terms_version: require("../../src/constants/legalPolicy").version,
    };
    const result = await Promise.allSettled([
      Register.execute({ ...base, email: " Dupla@PETPLUS.TEST " }),
      Register.execute({ ...base, email: "dupla@petplus.test" }),
    ]);
    assert.equal(result.filter((row) => row.status === "fulfilled").length, 1);
    assert.equal(await prisma.user.count(), 1);
  },
);
test(
  "E-09 DB: consumo concorrente do mesmo token aceita uma senha e invalida os demais links",
  { skip },
  async () => {
    const ctx = await account();
    const token = await link(ctx.user.id);
    await link(ctx.user.id);
    const candidates = ["PrimeiraNova1", "SegundaNova2"];
    const result = await Promise.allSettled(
      candidates.map((password) => Reset.execute(token.raw, password)),
    );
    assert.equal(result.filter((row) => row.status === "fulfilled").length, 1);
    const winner = result.findIndex((row) => row.status === "fulfilled");
    const user = await current(ctx.user.id);
    assert.equal(
      await bcrypt.compare(candidates[winner], user.password_hash),
      true,
    );
    assert.equal(
      await bcrypt.compare(candidates[1 - winner], user.password_hash),
      false,
    );
    assert.equal(bcrypt.getRounds(user.password_hash), 12);
    assert.equal(
      await prisma.passwordResetToken.count({
        where: { user_id: user.id, used: false },
      }),
      0,
    );
  },
);
test(
  "E-09 DB: tokens diferentes concorrentes do mesmo usuário não sobrescrevem duas senhas",
  { skip },
  async () => {
    const ctx = await account();
    const first = await link(ctx.user.id),
      second = await link(ctx.user.id);
    const result = await Promise.allSettled([
      Reset.execute(first.raw, "PrimeiraNova1"),
      Reset.execute(second.raw, "SegundaNova2"),
    ]);
    assert.equal(result.filter((row) => row.status === "fulfilled").length, 1);
    assert.equal(
      await prisma.passwordResetToken.count({ where: { used: false } }),
      0,
    );
  },
);
test(
  "E-09 DB: senha repetida/fraca, token expirado ou usado não mudam credenciais",
  { skip },
  async () => {
    const ctx = await account();
    const valid = await link(ctx.user.id),
      expired = await link(ctx.user.id, new Date(Date.now() - 1000));
    await assert.rejects(Reset.execute(valid.raw, ctx.password), {
      statusCode: 422,
    });
    await assert.rejects(Reset.execute(valid.raw, "senhafraca"), {
      name: "ZodError",
    });
    await assert.rejects(Reset.execute(expired.raw, "NovaSenha1"), {
      statusCode: 400,
    });
    assert.equal((await current(ctx.user.id)).password_hash, ctx.hash);
    assert.equal(
      (
        await prisma.passwordResetToken.findUnique({
          where: { id: valid.record.id },
        })
      ).used,
      false,
    );
  },
);
test(
  "E-09 DB: troca autenticada usa custo 12, valida senha atual e invalida links anteriores",
  { skip },
  async () => {
    const ctx = await account();
    const token = await link(ctx.user.id);
    const wrong = await request(app)
      .patch("/api/v1/users/me/password")
      .set("Authorization", ctx.authorization)
      .send({ currentPassword: "Errada123", newPassword: "NovaSenha1" });
    assert.equal(wrong.status, 401);
    const success = await request(app)
      .patch("/api/v1/users/me/password")
      .set("Authorization", ctx.authorization)
      .send({ currentPassword: ctx.password, newPassword: "NovaSenha1" });
    assert.equal(success.status, 204, JSON.stringify(success.body));
    const user = await current(ctx.user.id);
    assert.equal(bcrypt.getRounds(user.password_hash), 12);
    assert.equal(await bcrypt.compare("NovaSenha1", user.password_hash), true);
    assert.equal(
      (
        await prisma.passwordResetToken.findUnique({
          where: { id: token.record.id },
        })
      ).used,
      true,
    );
  },
);
test(
  "E-09 DB: reset contra troca autenticada não permite sobrescrever usando credenciais antigas",
  { skip },
  async () => {
    const ctx = await account();
    const token = await link(ctx.user.id);
    const result = await Promise.allSettled([
      Reset.execute(token.raw, "NovaPeloLink1"),
      Change.execute({
        userId: ctx.user.id,
        currentPassword: ctx.password,
        newPassword: "NovaPeloPerfil2",
      }),
    ]);
    assert.equal(result.filter((row) => row.status === "fulfilled").length, 1);
    const user = await current(ctx.user.id);
    assert.equal(
      await bcrypt.compare(
        result[0].status === "fulfilled" ? "NovaPeloLink1" : "NovaPeloPerfil2",
        user.password_hash,
      ),
      true,
    );
  },
);
test(
  "E-09 DB: emissão concorrente de recuperação deixa somente um token válido e armazena apenas o hash",
  { skip },
  async () => {
    const ctx = await account();
    await Promise.all([
      Forgot.execute(ctx.user.email),
      Forgot.execute(ctx.user.email),
    ]);
    const records = await prisma.passwordResetToken.findMany();
    assert.equal(records.length, 2);
    assert.equal(records.filter((row) => !row.used).length, 1);
    const raws = sent.map((row) => new URL(row.url).searchParams.get("token"));
    assert.ok(records.every((row) => !raws.includes(row.token_hash)));
    assert.equal(sent.length, 2);
  },
);
test(
  "E-09 DB: falha ao gravar a senha reverte o consumo do token e permite nova tentativa",
  { skip },
  async () => {
    const ctx = await account();
    const token = await link(ctx.user.id);
    await prisma.$executeRawUnsafe(
      "CREATE FUNCTION qa_e09_user_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'qa_e09_forced_failure'; END $$",
    );
    await prisma.$executeRawUnsafe(
      "CREATE TRIGGER qa_e09_user_failure BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION qa_e09_user_failure()",
    );
    try {
      await assert.rejects(Reset.execute(token.raw, "NovaSenha1"));
    } finally {
      await prisma.$executeRawUnsafe(
        "DROP TRIGGER qa_e09_user_failure ON users",
      );
      await prisma.$executeRawUnsafe("DROP FUNCTION qa_e09_user_failure()");
    }
    assert.equal((await current(ctx.user.id)).password_hash, ctx.hash);
    assert.equal(
      (
        await prisma.passwordResetToken.findUnique({
          where: { id: token.record.id },
        })
      ).used,
      false,
    );
    await Reset.execute(token.raw, "NovaSenha1");
  },
);
test(
  "E-09 DB: recuperação desconhecida/desativada tem resposta genérica e falha de entrega invalida só o próprio link",
  { skip },
  async () => {
    const ctx = await account();
    const absent = await Forgot.execute("ausente@petplus.test");
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { is_active: false },
    });
    const disabled = await Forgot.execute(ctx.user.email);
    assert.deepEqual(disabled, absent);
    assert.equal(sent.length, 0);
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { is_active: true },
    });
    mock.method(EmailService, "sendPasswordReset", async () => {
      throw Error("qa_provider_failure");
    });
    assert.deepEqual(await Forgot.execute(ctx.user.email), absent);
    assert.equal(
      await prisma.passwordResetToken.count({ where: { used: false } }),
      0,
    );
  },
);
