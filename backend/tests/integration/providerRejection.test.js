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
const { signTestToken } = require("../helpers/authState");

const prisma = require("../../src/config/database");
const app = require("../../src/app");
const { PROVIDER_STATUS } = require("../../src/constants/providerStatus");

// ── helpers ──────────────────────────────────────────────────────────────────

function generateToken({ userId = "user-partner-1", roleId = 2 } = {}) {
  return signTestToken({ id: userId, role_id: roleId });
}

function generateAdminToken(userId = "user-admin-1") {
  return signTestToken({ id: userId, role_id: 1 });
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
// GET / — listagem administrativa de parceiros (E-02)
// ─────────────────────────────────────────────────────────────────────────────

const mockPartners = [
  {
    id: "p-pend-1",
    user_id: "u-pend-1",
    business_name: "Loja Pendente",
    document: "12345678000190",
    document_type: "CNPJ",
    status: PROVIDER_STATUS.PENDING,
    rejection_reason: null,
    user: { full_name: "Parceiro Pendente", email: "p@test.com", role_id: 2, is_active: null },
  },
  {
    id: "p-rev-1",
    user_id: "u-rev-1",
    business_name: "Hotel em Revisão",
    document: "98765432000110",
    document_type: "CNPJ",
    status: PROVIDER_STATUS.IN_REVIEW,
    rejection_reason: "Motivo anterior.",
    user: { full_name: "Parceiro Revisão", email: "r@test.com", role_id: 3, is_active: false },
  },
];

test("GET /providers — sem token → 401 (listagem não é mais pública)", async () => {
  stubPrismaMethod(prisma.provider, "findMany", async () => {
    throw new Error("findMany não deveria ser chamado sem autenticação");
  });

  const res = await request(app).get("/api/v1/providers");
  assert.equal(res.status, 401);
});

test("GET /providers — parceiros e tutor → 403", async () => {
  stubPrismaMethod(prisma.provider, "findMany", async () => {
    throw new Error("findMany não deveria ser chamado sem papel de admin");
  });

  for (const roleId of [2, 3, 4, 5]) {
    const res = await request(app)
      .get("/api/v1/providers")
      .set("Authorization", `Bearer ${generateToken({ roleId })}`);
    assert.equal(res.status, 403, `role_id ${roleId} não pode listar parceiros`);
  }
});

test("GET /providers — admin recebe documento, motivo da recusa e EM_REVISAO distinto de PENDENTE", async () => {
  let receivedArgs;
  stubPrismaMethod(prisma.provider, "findMany", async (args) => {
    receivedArgs = args;
    return mockPartners;
  });

  const res = await request(app)
    .get("/api/v1/providers")
    .set("Authorization", `Bearer ${generateAdminToken()}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));

  const statuses = res.body.map((p) => p.status);
  assert.ok(statuses.includes(PROVIDER_STATUS.PENDING), "PENDENTE deve estar presente");
  assert.ok(statuses.includes(PROVIDER_STATUS.IN_REVIEW), "EM_REVISAO deve estar presente");

  // O painel de aprovações depende do documento e do motivo para moderar.
  const revisao = res.body.find((p) => p.id === "p-rev-1");
  assert.equal(revisao.document, "98765432000110");
  assert.equal(revisao.rejection_reason, "Motivo anterior.");
  assert.equal(revisao.full_name, "Parceiro Revisão");
  assert.equal(revisao.email, "r@test.com");
  assert.equal(revisao.role_id, 3);
  assert.equal(revisao.is_active, false);
  assert.equal(res.body.find((p) => p.id === "p-pend-1").is_active, true);

  // Nada de password_hash: nem pedido ao banco, nem devolvido.
  assert.equal(receivedArgs.select.user.select.password_hash, undefined);
  for (const p of res.body) {
    assert.equal(p.password_hash, undefined);
    assert.equal(p.user, undefined);
  }
});
