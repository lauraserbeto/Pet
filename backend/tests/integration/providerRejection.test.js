process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
process.env.RESEND_API_KEY ||= "test-resend-api-key";
process.env.EMAIL_FROM ||= "no-reply@petplus.test";

// ─────────────────────────────────────────────────────────────────────────────
// Estes testes exercitam a cadeia do Express sem banco real:
//  - caminhos de validação (sem DB) → determinísticos
//  - caminhos de sucesso → prisma stubado manualmente (padrão do projeto)
// ─────────────────────────────────────────────────────────────────────────────

const { test, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const prisma = require("../../src/config/database");
const app = require("../../src/app");
const { PROVIDER_STATUS } = require("../../src/constants/providerStatus");

// ── helpers ──────────────────────────────────────────────────────────────────

function generateToken({ userId = "user-partner-1", roleId = 2 } = {}) {
  return jwt.sign(
    { id: userId, role_id: roleId },
    process.env.JWT_SECRET,
  );
}

function generateAdminToken(userId = "user-admin-1") {
  return jwt.sign(
    { id: userId, role_id: 1 },
    process.env.JWT_SECRET,
  );
}

// Stub genérico de método Prisma com restauração automática via afterEach
const prismaRestores = [];
function stubPrismaMethod(delegate, methodName, impl) {
  const original = delegate[methodName];
  delegate[methodName] = impl;
  prismaRestores.push(() => {
    delegate[methodName] = original;
  });
}

afterEach(() => {
  while (prismaRestores.length > 0) {
    prismaRestores.pop()();
  }
  mock.restoreAll();
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /:id/status — Rejeitar parceiro
// ─────────────────────────────────────────────────────────────────────────────

test("PATCH /:id/status — recusar sem rejection_reason → 422 VALIDATION_ERROR, sem e-mail", async () => {
  const adminToken = generateAdminToken();
  const providerId = "11111111-1111-4111-8111-111111111111";

  const res = await request(app)
    .patch(`/api/v1/providers/${providerId}/status`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: PROVIDER_STATUS.REJECTED }); // sem rejection_reason

  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
  assert.ok(
    JSON.stringify(res.body).includes("rejection_reason"),
    "Resposta deve mencionar o campo rejection_reason",
  );
});

test("PATCH /:id/status — recusar com rejection_reason → 200, e-mail enviado (mock)", async () => {
  const adminToken = generateAdminToken();
  const providerId = "11111111-1111-4111-8111-111111111111";
  const rejectionReason = "Documentação incompleta.";

  const mockProvider = {
    id: providerId,
    status: PROVIDER_STATUS.PENDING,
    rejection_reason: null,
    user: { email: "parceiro@petplus.test" },
  };
  const mockUpdated = {
    ...mockProvider,
    status: PROVIDER_STATUS.REJECTED,
    rejection_reason: rejectionReason,
  };
  delete mockUpdated.user;

  // stub do findUnique (busca provider + email)
  stubPrismaMethod(prisma.provider, "findUnique", async ({ where }) => {
    if (where.id === providerId) return mockProvider;
    return null;
  });

  // stub do update
  stubPrismaMethod(prisma.provider, "update", async ({ where, data }) => {
    assert.equal(where.id, providerId);
    assert.equal(data.status, PROVIDER_STATUS.REJECTED);
    assert.equal(data.rejection_reason, rejectionReason);
    return { ...mockUpdated };
  });

  // Rastreia chamadas ao EmailService
  const emailCalls = [];
  // mock.method funciona somente em instâncias — importamos o singleton
  const EmailService = require("../../src/services/EmailService");
  mock.method(EmailService, "sendRejection", async (to, opts) => {
    emailCalls.push({ to, ...opts });
    return { id: "email-mock-1" };
  });

  const res = await request(app)
    .patch(`/api/v1/providers/${providerId}/status`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: PROVIDER_STATUS.REJECTED, rejection_reason: rejectionReason });

  assert.equal(res.status, 200);
  assert.equal(res.body.status, PROVIDER_STATUS.REJECTED);
  assert.equal(res.body.rejection_reason, rejectionReason);

  assert.equal(emailCalls.length, 1, "sendRejection deve ser chamado uma vez");
  assert.equal(emailCalls[0].to, "parceiro@petplus.test");
  assert.equal(emailCalls[0].reason, rejectionReason);
  assert.ok(
    emailCalls[0].correctionUrl.includes("/parceiro/corrigir-cadastro"),
    "Link de correção deve apontar para a rota definida na REC-2",
  );
});

test("PATCH /:id/status — recusar com rejection_reason vazio → 422", async () => {
  const adminToken = generateAdminToken();
  const providerId = "11111111-1111-4111-8111-111111111111";

  const res = await request(app)
    .patch(`/api/v1/providers/${providerId}/status`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: PROVIDER_STATUS.REJECTED, rejection_reason: "   " });

  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

test("PATCH /:id/status — falha no e-mail NÃO reverte a persistência", async () => {
  const adminToken = generateAdminToken();
  const providerId = "22222222-2222-4222-8222-222222222222";
  const rejectionReason = "Motivo legítimo.";

  const mockProvider = {
    id: providerId,
    status: PROVIDER_STATUS.PENDING,
    rejection_reason: null,
    user: { email: "parceiro2@petplus.test" },
  };
  const mockUpdated = { ...mockProvider, status: PROVIDER_STATUS.REJECTED, rejection_reason: rejectionReason };
  delete mockUpdated.user;

  stubPrismaMethod(prisma.provider, "findUnique", async ({ where }) => {
    if (where.id === providerId) return mockProvider;
    return null;
  });
  stubPrismaMethod(prisma.provider, "update", async () => ({ ...mockUpdated }));

  const EmailService = require("../../src/services/EmailService");
  mock.method(EmailService, "sendRejection", async () => {
    throw new Error("Resend indisponível");
  });

  const res = await request(app)
    .patch(`/api/v1/providers/${providerId}/status`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: PROVIDER_STATUS.REJECTED, rejection_reason: rejectionReason });

  // A resposta deve ser 200 mesmo com falha no e-mail
  assert.equal(res.status, 200);
  assert.equal(res.body.status, PROVIDER_STATUS.REJECTED);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /me/resubmit — Reenvio de cadastro
// ─────────────────────────────────────────────────────────────────────────────

test("POST /me/resubmit — sem token → 401", async () => {
  const res = await request(app).post("/api/v1/providers/me/resubmit");
  assert.equal(res.status, 401);
});

test("POST /me/resubmit — parceiro REJEITADO → 200, status EM_REVISAO", async () => {
  const userId = "user-partner-rej-1";
  const token = generateToken({ userId, roleId: 2 });

  const mockProvider = {
    id: "provider-rej-uuid-1",
    user_id: userId,
    status: PROVIDER_STATUS.REJECTED,
    rejection_reason: "Documentação incompleta.",
  };
  const mockUpdated = { ...mockProvider, status: PROVIDER_STATUS.IN_REVIEW };

  stubPrismaMethod(prisma.provider, "findUnique", async ({ where }) => {
    if (where.user_id === userId) return mockProvider;
    return null;
  });
  stubPrismaMethod(prisma.provider, "update", async ({ where, data }) => {
    assert.equal(where.id, mockProvider.id);
    assert.equal(data.status, PROVIDER_STATUS.IN_REVIEW);
    return { ...mockUpdated };
  });

  const res = await request(app)
    .post("/api/v1/providers/me/resubmit")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.status, PROVIDER_STATUS.IN_REVIEW);
});

test("POST /me/resubmit — parceiro PENDENTE → 400, reenvio bloqueado", async () => {
  const userId = "user-partner-pend-1";
  const token = generateToken({ userId, roleId: 2 });

  const mockProvider = {
    id: "provider-pend-uuid-1",
    user_id: userId,
    status: PROVIDER_STATUS.PENDING,
  };

  stubPrismaMethod(prisma.provider, "findUnique", async ({ where }) => {
    if (where.user_id === userId) return mockProvider;
    return null;
  });

  const res = await request(app)
    .post("/api/v1/providers/me/resubmit")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "BAD_REQUEST");
  assert.ok(
    res.body.error.message.includes("REJEITADO"),
    "Mensagem deve indicar que reenvio só é permitido a partir de REJEITADO",
  );
});

test("POST /me/resubmit — parceiro APROVADO → 400", async () => {
  const userId = "user-partner-apv-1";
  const token = generateToken({ userId, roleId: 3 });

  stubPrismaMethod(prisma.provider, "findUnique", async ({ where }) => {
    if (where.user_id === userId) {
      return { id: "provider-apv-1", user_id: userId, status: PROVIDER_STATUS.APPROVED };
    }
    return null;
  });

  const res = await request(app)
    .post("/api/v1/providers/me/resubmit")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "BAD_REQUEST");
});

test("POST /me/resubmit — sem perfil cadastrado → 404", async () => {
  const userId = "user-no-provider";
  const token = generateToken({ userId, roleId: 2 });

  stubPrismaMethod(prisma.provider, "findUnique", async () => null);

  const res = await request(app)
    .post("/api/v1/providers/me/resubmit")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, "NOT_FOUND");
});

// ─────────────────────────────────────────────────────────────────────────────
// GET / — listPartners expõe status EM_REVISAO distinto de PENDENTE
// ─────────────────────────────────────────────────────────────────────────────

test("GET /providers — listPartners inclui EM_REVISAO e PENDENTE como valores distintos", async () => {
  const mockProviders = [
    {
      id: "p-pend-1",
      status: PROVIDER_STATUS.PENDING,
      rejection_reason: null,
      user: { full_name: "Parceiro Pendente", email: "p@test.com", role_id: 2 },
    },
    {
      id: "p-rev-1",
      status: PROVIDER_STATUS.IN_REVIEW,
      rejection_reason: "Motivo anterior.",
      user: { full_name: "Parceiro Revisão", email: "r@test.com", role_id: 2 },
    },
  ];

  stubPrismaMethod(prisma.provider, "findMany", async () => mockProviders);

  const res = await request(app).get("/api/v1/providers");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));

  const statuses = res.body.map((p) => p.status);
  assert.ok(statuses.includes(PROVIDER_STATUS.PENDING), "PENDENTE deve estar presente");
  assert.ok(statuses.includes(PROVIDER_STATUS.IN_REVIEW), "EM_REVISAO deve estar presente");

  // rejection_reason nunca deve vazar na listagem (publicProvider.js)
  for (const p of res.body) {
    assert.equal(
      p.rejection_reason,
      undefined,
      "rejection_reason é campo privado e não deve aparecer na listagem",
    );
  }
});
