process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const { signTestToken } = require("../helpers/authState");
const list = require("../../src/useCases/products/ListActiveProductsUseCase");
test("SEC-2: erro inesperado não expõe SQL e request-id enviado como segredo é substituído", async (t) => {
  const secret = "SENTINEL_PRIVATE_qa";
  t.mock.method(list, "execute", async () => {
    throw Error("SQL password_hash=" + secret);
  });
  const res = await request(app)
    .get("/api/v1/products")
    .set("X-Request-Id", secret);
  assert.equal(res.status, 500);
  assert.equal(res.body.error.code, "INTERNAL_ERROR");
  assert(!JSON.stringify(res.body).includes(secret));
  assert.match(res.headers["x-request-id"], /^[0-9a-f-]{36}$/i);
  assert.equal(res.body.error.requestId, res.headers["x-request-id"]);
  const prisma = require("../../src/config/database");
  const AppError = require("../../src/utils/AppError");
  const findMany = prisma.provider.findMany;
  t.after(() => {
    prisma.provider.findMany = findMany;
  });
  prisma.provider.findMany = async () => {
    throw AppError.conflict("Catálogo temporariamente indisponível.");
  };
  const stores = await request(app).get("/api/v1/providers/stores");
  assert.equal(stores.status, 409);
  assert.equal(stores.body.error.code, "CONFLICT");
  assert.equal(stores.body.message, "Catálogo temporariamente indisponível.");
});
test("SEC-2: UUID e body da avaliação são recusados antes de acesso ao banco", async () => {
  const token = signTestToken({ id: "admin-contract-qa", role_id: 1 });
  for (const [id, data] of [
    ["id-invalido", { status: "APPROVED" }],
    ["11111111-1111-4111-8111-111111111111", { status: "INVENTADO" }],
  ]) {
    const res = await request(app)
      .patch("/api/v1/users/admin/evaluations/" + id)
      .set("Authorization", "Bearer " + token)
      .send(data);
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  }
});
test("SEC-2: token malformado/algoritmo não permitido usa envelope 401 padronizado", async () => {
  for (const token of [
    "invalido",
    jwt.sign({ id: "user-qa" }, process.env.JWT_SECRET, { algorithm: "HS384" }),
  ]) {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer " + token);
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, "UNAUTHORIZED");
    assert.equal(res.body.message, res.body.error.message);
  }
});
test("SEC-2: rotas desconhecidas não fazem métricas guardarem identificadores dos caminhos", async () => {
  const secret = "email-privado-qa";
  await request(app).get("/api/v1/" + secret + "?token=segredo");
  const res = await request(app)
    .get("/api/metrics")
    .set(
      "Authorization",
      "Bearer " + signTestToken({ id: "admin-contract-qa", role_id: 1 }),
    );
  assert.equal(res.status, 200);
  assert(!JSON.stringify(res.body).includes(secret));
  assert(Object.keys(res.body.routes).some((key) => key.includes("unmatched")));
});

test("SEC-2: indisponibilidade operacional preserva código público sem divulgar texto arbitrário", () => {
  const { errorHandler } = require("../../src/middlewares/errorHandler");
  const AppError = require("../../src/utils/AppError");
  let payload, status;
  const res = {
    status(value) {
      status = value;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };
  errorHandler(
    new AppError("SQL private-secret", 503, "PAYMENT_GATEWAY_DISABLED"),
    { id: "qa" },
    res,
    () => {},
  );
  assert.equal(status, 503);
  assert.equal(payload.error.code, "PAYMENT_GATEWAY_DISABLED");
  assert(!JSON.stringify(payload).includes("private-secret"));
});
