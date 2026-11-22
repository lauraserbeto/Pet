process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { toPublicProvider } = require("../../src/utils/publicProvider");
const {
  __test__: { beforeSend, scrub },
} = require("../../src/config/sentry");
const secret = "SENTINEL_PRIVATE_qa";
test("SEC-2: lista pública de campos protege colunas futuras e relações aninhadas", () => {
  const raw = {
    id: "p",
    business_name: "Sitter QA",
    city: "Anápolis",
    state: "GO",
    phone: secret,
    address_line: secret,
    zip_code: secret,
    document: secret,
    future_private_column: secret,
    user_id: secret,
    user: {
      full_name: "Nome público",
      role_id: 4,
      avatar_url: "https://example.test/image.png",
      password_hash: secret,
      email: secret,
      phone: secret,
      terms_version: secret,
    },
    services: [{ id: "s", name: "Cuidado", price: 100, private_field: secret }],
    products: [{ id: "i", name: "Produto", price: 10, private_field: secret }],
    _count: { products: 1, private_field: secret },
  };
  const clean = toPublicProvider(raw);
  assert(!JSON.stringify(clean).includes(secret));
  assert.equal(clean.city, "Anápolis");
  assert.equal(clean.services[0].name, "Cuidado");
  assert.equal(raw.document, secret);
  for (const role_id of [2, 3])
    assert.equal(
      toPublicProvider({ ...raw, user: { ...raw.user, role_id } }).phone,
      secret,
    );
});
test("SEC-2: Sentry descarta corpo, URL, mensagens brutas e variáveis locais de exceção", () => {
  const event = beforeSend({
    request: {
      url: "/x?token=" + secret,
      data: { anything: secret },
      headers: { a: secret },
    },
    user: { email: secret },
    extra: { anything: secret },
    breadcrumbs: [{ message: secret }],
    message: secret,
    exception: {
      values: [
        {
          type: "Error",
          value: secret,
          stacktrace: {
            frames: [
              {
                filename: "service.js",
                lineno: 42,
                vars: { anything: secret },
              },
            ],
          },
        },
      ],
    },
  });
  assert(!JSON.stringify(event).includes(secret));
  assert.equal(event.exception.values[0].stacktrace.frames[0].lineno, 42);
  let nested = { password: secret };
  for (let i = 0; i < 10; i++) nested = { next: nested };
  assert(!JSON.stringify(scrub(nested)).includes(secret));
});
test("SEC-2: logger serializa metadados do erro sem mensagem/stack que contenham credenciais", () => {
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      `const logger=require('./src/config/logger');const error=Object.assign(new Error('${secret}'),{code:'P2002'});logger.error({err:error},'Falha controlada de QA');`,
    ],
    {
      cwd: require("node:path").resolve(__dirname, "../.."),
      env: { ...process.env, LOG_LEVEL: "info", SENTRY_DSN: "" },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert(!result.stdout.includes(secret));
  assert(result.stdout.includes("P2002"));
});
