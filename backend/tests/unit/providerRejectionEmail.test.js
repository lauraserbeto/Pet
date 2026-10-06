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
  PROVIDER_REJECTION_TEMPLATE_ID,
} = require("../../src/services/EmailService");

afterEach(() => mock.restoreAll());

test("sendRejection envia o template cadastro-rejeitado com REASON e CORRECTION_URL", async () => {
  const service = new EmailService();
  const sentPayloads = [];

  mock.method(service, "getClient", () => ({
    emails: {
      send: async (payload) => {
        sentPayloads.push(payload);
        return { data: { id: "email-rejection-1" } };
      },
    },
  }));

  const correctionUrl = "http://localhost:5173/parceiro/corrigir-cadastro";
  const reason = "Documentação incompleta: faltam CNPJ e comprovante de endereço.";

  const result = await service.sendRejection("parceiro@petplus.test", {
    reason,
    correctionUrl,
  });

  assert.deepEqual(result, { id: "email-rejection-1" });
  assert.deepEqual(sentPayloads, [
    {
      from: "no-reply@petplus.test",
      to: "parceiro@petplus.test",
      replyTo: "contato@petplus.test",
      template: {
        id: PROVIDER_REJECTION_TEMPLATE_ID,
        variables: {
          REASON: reason,
          CORRECTION_URL: correctionUrl,
        },
      },
    },
  ]);
});

test("sendRejection propaga erro retornado pelo Resend", async () => {
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
      service.sendRejection("parceiro@petplus.test", {
        reason: "Motivo qualquer",
        correctionUrl: "http://localhost:5173/parceiro/corrigir-cadastro",
      }),
    (error) => {
      assert.equal(error.message, "Template não publicado");
      assert.equal(error.provider, "resend");
      return true;
    },
  );
});

test("sendRejection escapa HTML informado no motivo da recusa", async () => {
  const service = new EmailService();
  let sentPayload;

  mock.method(service, "getClient", () => ({
    emails: {
      send: async (payload) => {
        sentPayload = payload;
        return { data: { id: "email-rejection-safe" } };
      },
    },
  }));

  await service.sendRejection("parceiro@petplus.test", {
    reason: '<img src=x onerror="alert(1)"> & revisão',
    correctionUrl: "https://petplus.vercel.app/parceiro/corrigir-cadastro",
  });

  assert.equal(
    sentPayload.template.variables.REASON,
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; revisão",
  );
});
