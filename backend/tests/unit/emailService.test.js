process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
process.env.RESEND_API_KEY ||= "test-resend-api-key";
process.env.EMAIL_FROM ||= "no-reply@petplus.test";
process.env.EMAIL_REPLY_TO = "contato@petplus.test";

const { test, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const {
  EmailService,
  PASSWORD_RESET_TEMPLATE_ID,
} = require("../../src/services/EmailService");

afterEach(() => mock.restoreAll());

test("sendPasswordReset envia o template publicado com RESET_URL", async () => {
  const service = new EmailService();
  const sentPayloads = [];

  mock.method(service, "getClient", () => ({
    emails: {
      send: async (payload) => {
        sentPayloads.push(payload);
        return { data: { id: "email-1" } };
      },
    },
  }));

  const resetUrl = "http://localhost:5173/redefinir-senha?token=abc123";
  const result = await service.sendPasswordReset(
    "tutor@petplus.test",
    resetUrl,
  );

  assert.deepEqual(result, { id: "email-1" });
  assert.deepEqual(sentPayloads, [
    {
      from: "no-reply@petplus.test",
      to: "tutor@petplus.test",
      replyTo: "contato@petplus.test",
      template: {
        id: PASSWORD_RESET_TEMPLATE_ID,
        variables: {
          RESET_URL: resetUrl,
        },
      },
    },
  ]);
});

test("sendTemplate propaga erro retornado pelo Resend com contexto do provider", async () => {
  const service = new EmailService();

  mock.method(service, "getClient", () => ({
    emails: {
      send: async () => ({
        error: {
          message: "Template não publicado",
          name: "validation_error",
        },
      }),
    },
  }));

  await assert.rejects(
    () =>
      service.sendTemplate({
        to: "tutor@petplus.test",
        templateId: "password-reset",
      }),
    (error) => {
      assert.equal(error.message, "Template não publicado");
      assert.equal(error.provider, "resend");
      assert.equal(error.details.name, "validation_error");
      return true;
    },
  );
});
