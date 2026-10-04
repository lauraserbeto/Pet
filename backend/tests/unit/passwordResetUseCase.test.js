process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET ||= "test-secret-com-mais-de-32-caracteres-0000";
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/petplus_test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
process.env.RESEND_API_KEY ||= "test-resend-api-key";
process.env.EMAIL_FROM ||= "no-reply@petplus.test";

const { test, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../../src/config/database");
const bcrypt = require("bcryptjs");
const UserRepository = require("../../src/repositories/UserRepository");
const EmailService = require("../../src/services/EmailService");
const {
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
} = require("../../src/useCases/auth/PasswordResetUseCase");

const prismaRestores = [];

afterEach(() => {
  while (prismaRestores.length > 0) {
    prismaRestores.pop()();
  }
  mock.restoreAll();
});

function stubPasswordResetTokenMethod(methodName, implementation) {
  const delegate = prisma.passwordResetToken;
  const original = delegate[methodName];
  delegate[methodName] = implementation;
  prismaRestores.push(() => {
    delegate[methodName] = original;
  });
}

function stubPrismaMethod(target, methodName, implementation) {
  const original = target[methodName];
  target[methodName] = implementation;
  prismaRestores.push(() => {
    target[methodName] = original;
  });
}

function mockTokenPersistence({ onCreate } = {}) {
  let updateManyCalled = false;
  let invalidatedTokenId = null;

  stubPasswordResetTokenMethod("updateMany", async () => {
    updateManyCalled = true;
    return { count: 1 };
  });
  stubPasswordResetTokenMethod("create", async ({ data }) => {
    onCreate?.(data);
    return {
      id: "reset-token-1",
      ...data,
    };
  });
  stubPasswordResetTokenMethod("update", async ({ where, data }) => {
    if (data.used === true) {
      invalidatedTokenId = where.id;
    }
    return { id: where.id, ...data };
  });

  return {
    wasUpdateManyCalled: () => updateManyCalled,
    invalidatedTokenId: () => invalidatedTokenId,
  };
}

test("forgot password gera token e envia e-mail de recuperação para usuário existente", async () => {
  const user = {
    id: "user-1",
    email: "tutor@petplus.test",
  };
  let createData;
  const persistence = mockTokenPersistence({
    onCreate: (data) => {
      createData = data;
    },
  });
  const sent = [];

  mock.method(UserRepository, "findByEmail", async () => user);
  mock.method(EmailService, "sendPasswordReset", async (to, resetUrl) => {
    sent.push({ to, resetUrl });
    return { id: "email-1" };
  });

  const result = await ForgotPasswordUseCase.execute(user.email);

  assert.match(result.message, /Se esse e-mail estiver cadastrado/i);
  assert.equal(persistence.wasUpdateManyCalled(), true);
  assert.equal(createData.user_id, user.id);
  assert.equal(typeof createData.token_hash, "string");
  assert.equal(createData.token_hash.length, 64);
  assert.ok(createData.expires_at > new Date());
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, user.email);
  assert.match(
    sent[0].resetUrl,
    /^http:\/\/localhost:5173\/redefinir-senha\?token=/,
  );
});

test("forgot password para e-mail inexistente mantém resposta genérica e não envia e-mail", async () => {
  let sendCalled = false;
  let createCalled = false;

  mock.method(UserRepository, "findByEmail", async () => null);
  mock.method(EmailService, "sendPasswordReset", async () => {
    sendCalled = true;
  });
  stubPasswordResetTokenMethod("create", async () => {
    createCalled = true;
  });

  const result = await ForgotPasswordUseCase.execute("ausente@petplus.test");

  assert.match(result.message, /Se esse e-mail estiver cadastrado/i);
  assert.equal(sendCalled, false);
  assert.equal(createCalled, false);
});

test("falha no provider de e-mail mantém resposta genérica e invalida token criado", async () => {
  const user = {
    id: "user-1",
    email: "tutor@petplus.test",
  };
  const persistence = mockTokenPersistence();

  mock.method(UserRepository, "findByEmail", async () => user);
  mock.method(EmailService, "sendPasswordReset", async () => {
    throw new Error("provider indisponível");
  });

  const result = await ForgotPasswordUseCase.execute(user.email);

  assert.match(result.message, /Se esse e-mail estiver cadastrado/i);
  assert.equal(persistence.invalidatedTokenId(), "reset-token-1");
});

test("reset de senha rejeita reutilizar a senha atual sem consumir o token", async () => {
  const currentPassword = "SenhaAtual1";
  const currentHash = await bcrypt.hash(currentPassword, 4);
  let transactionCalled = false;

  stubPasswordResetTokenMethod("findUnique", async () => ({
    id: "reset-token-1",
    user_id: "user-1",
    expires_at: new Date(Date.now() + 60_000),
    used: false,
    user: { password_hash: currentHash },
  }));
  stubPrismaMethod(prisma, "$transaction", async () => {
    transactionCalled = true;
  });

  await assert.rejects(
    ResetPasswordUseCase.execute("token-valido", currentPassword),
    /diferente da senha atual/i,
  );
  assert.equal(transactionCalled, false);
});

test("reset de senha atualiza o hash e invalida todos os tokens pendentes", async () => {
  const currentHash = await bcrypt.hash("SenhaAtual1", 4);
  let updatedPasswordHash;
  let invalidationWhere;

  stubPasswordResetTokenMethod("findUnique", async () => ({
    id: "reset-token-1",
    user_id: "user-1",
    expires_at: new Date(Date.now() + 60_000),
    used: false,
    user: { password_hash: currentHash },
  }));
  stubPrismaMethod(prisma, "$transaction", async (operation) =>
    operation({
      user: {
        update: async ({ data }) => {
          updatedPasswordHash = data.password_hash;
          return { id: "user-1" };
        },
      },
      passwordResetToken: {
        updateMany: async ({ where }) => {
          invalidationWhere = where;
          return { count: 2 };
        },
      },
    }),
  );

  const result = await ResetPasswordUseCase.execute(
    "token-valido",
    "SenhaNova2",
  );

  assert.match(result.message, /sucesso/i);
  assert.equal(await bcrypt.compare("SenhaNova2", updatedPasswordHash), true);
  assert.deepEqual(invalidationWhere, { user_id: "user-1", used: false });
});
