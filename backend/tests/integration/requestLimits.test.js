process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const express = require("express");
const {
  createRequestLimits,
  LIMIT_POLICY,
} = require("../../src/middlewares/requestLimits");
function limited(trust = 1) {
  const app = express();
  app.set("trust proxy", trust);
  const limits = createRequestLimits({
    api: { limit: 2 },
    webhook: { limit: 2 },
    health: { limit: 2 },
    metrics: { limit: 2 },
  });
  app.use("/api", limits.api);
  app.get("/api/health", limits.health, (_req, res) => res.sendStatus(200));
  app.post("/api/v1/orders/webhook", limits.webhook, (_req, res) =>
    res.sendStatus(200),
  );
  app.get("/api/metrics", limits.metrics, (_req, res) => res.sendStatus(200));
  app.get("/api/example", (req, res) => res.json({ ip: req.ip }));
  return app;
}
test("SEC-2: limites independentes preservam webhook, health e métricas depois de saturar a API", async () => {
  const app = limited();
  for (let i = 0; i < 2; i++)
    assert.equal((await request(app).get("/api/example")).status, 200);
  const denied = await request(app).get("/api/example");
  assert.equal(denied.status, 429);
  assert.equal(denied.body.error.code, "RATE_LIMITED");
  assert(denied.headers["retry-after"]);
  for (const [method, path] of [
    ["get", "/api/health"],
    ["get", "/api/metrics"],
    ["post", "/api/v1/orders/webhook"],
  ]) {
    assert.equal((await request(app)[method](path)).status, 200);
    assert.equal((await request(app)[method](path)).status, 200);
    assert.equal((await request(app)[method](path)).status, 429);
  }
  assert.equal(LIMIT_POLICY.auth.limit, 20);
  assert.equal(LIMIT_POLICY.auth.windowMs, 900000);
});
test("SEC-2: proxy usa o cliente mais próximo e não confia no IP extra à esquerda", async () => {
  const app = limited();
  for (const prefix of ["198.51.100.1", "198.51.100.2"])
    assert.equal(
      (
        await request(app)
          .get("/api/example")
          .set("X-Forwarded-For", prefix + ", 203.0.113.5")
      ).status,
      200,
    );
  assert.equal(
    (
      await request(app)
        .get("/api/example")
        .set("X-Forwarded-For", "198.51.100.3, 203.0.113.5")
    ).status,
    429,
  );
  assert.equal(
    (
      await request(app)
        .get("/api/example")
        .set("X-Forwarded-For", "203.0.113.6")
    ).status,
    200,
  );
});
test("SEC-2: IPv6 no mesmo /56 compartilha limite, outra rede recebe contador independente", async () => {
  const app = limited();
  for (const ip of ["2001:db8:0:1::1", "2001:db8:0:2::2"])
    assert.equal(
      (await request(app).get("/api/example").set("X-Forwarded-For", ip))
        .status,
      200,
    );
  assert.equal(
    (
      await request(app)
        .get("/api/example")
        .set("X-Forwarded-For", "2001:db8:0:3::3")
    ).status,
    429,
  );
  assert.equal(
    (
      await request(app)
        .get("/api/example")
        .set("X-Forwarded-For", "2001:db8:100::1")
    ).status,
    200,
  );
});
test("SEC-2: wiring real tem limite global, auth restrito e exceções com proteção própria", async (t) => {
  const app = require("../../src/app"),
    prisma = require("../../src/config/database");
  const { signTestToken } = require("../helpers/authState");
  for (let i = 0; i < 300; i++)
    assert.equal(
      (await request(app).get("/api/v1/products/options")).status,
      200,
    );
  assert.equal(
    (await request(app).get("/api/v1/products/options")).status,
    429,
  );
  t.mock.method(prisma, "$queryRaw", async () => [{ ok: 1 }]);
  assert.equal((await request(app).get("/api/health")).status, 200);
  assert.equal(
    (
      await request(app)
        .post("/api/v1/orders/webhook?data.id=123&type=payment")
        .send({})
    ).status,
    503,
  );
  assert.equal(
    (
      await request(app)
        .get("/api/metrics")
        .set(
          "Authorization",
          "Bearer " + signTestToken({ id: "admin-limit-qa", role_id: 1 }),
        )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(app)
        .options("/api/v1/products/options")
        .set("Origin", "http://localhost:5173")
        .set("Access-Control-Request-Method", "GET")
    ).status,
    204,
  );
  // A leitura pública recusada também consome o limite próprio, antes do JWT.
  for (let i = 0; i < 59; i++)
    assert.equal((await request(app).get("/api/metrics")).status, 401);
  const metricsDenied = await request(app).get("/api/metrics");
  assert.equal(metricsDenied.status, 429);
  assert.equal(metricsDenied.body.error.code, "RATE_LIMITED");
});
