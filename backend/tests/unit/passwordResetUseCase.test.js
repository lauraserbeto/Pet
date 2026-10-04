process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';
process.env.RESEND_API_KEY ||= 'test-resend-api-key';
process.env.EMAIL_FROM ||= 'no-reply@petplus.test';

const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../../src/config/database');
const UserRepository = require('../../src/repositories/UserRepository');
const EmailService = require('../../src/services/EmailService');
const { ForgotPasswordUseCase } = require('../../src/useCases/auth/PasswordResetUseCase');

afterEach(() => mock.restoreAll());

function mockTokenPersistence({ onCreate } = {}) {
  let updateManyCalled = false;
  let invalidatedTokenId = null;

  mock.property(prisma, 'passwordResetToken', {
    updateMany: async () => {
      updateManyCalled = true;
      return { count: 1 };
    },
    create: async ({ data }) => {
      onCreate?.(data);
      return {
        id: 'reset-token-1',
        ...data,
      };
    },
    update: async ({ where, data }) => {
      if (data.used === true) {
        invalidatedTokenId = where.id;
      }
      return { id: where.id, ...data };
    },
  });

  return {
    wasUpdateManyCalled: () => updateManyCalled,
    invalidatedTokenId: () => invalidatedTokenId,
  };
}

test('forgot password gera token e envia e-mail de recuperação para usuário existente', async () => {
  const user = {
    id: 'user-1',
    email: 'tutor@petplus.test',
  };
  let createData;
  const persistence = mockTokenPersistence({
    onCreate: (data) => {
      createData = data;
    },
  });
  const sent = [];

  mock.method(UserRepository, 'findByEmail', async () => user);
  mock.method(EmailService, 'sendPasswordReset', async (to, resetUrl) => {
    sent.push({ to, resetUrl });
    return { id: 'email-1' };
  });

  const result = await ForgotPasswordUseCase.execute(user.email);

  assert.match(result.message, /Se esse e-mail estiver cadastrado/i);
  assert.equal(persistence.wasUpdateManyCalled(), true);
  assert.equal(createData.user_id, user.id);
  assert.equal(typeof createData.token_hash, 'string');
  assert.equal(createData.token_hash.length, 64);
  assert.ok(createData.expires_at > new Date());
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, user.email);
  assert.match(sent[0].resetUrl, /^http:\/\/localhost:5173\/redefinir-senha\?token=/);
});

test('forgot password para e-mail inexistente mantém resposta genérica e não envia e-mail', async () => {
  let sendCalled = false;
  let createCalled = false;

  mock.method(UserRepository, 'findByEmail', async () => null);
  mock.method(EmailService, 'sendPasswordReset', async () => {
    sendCalled = true;
  });
  mock.property(prisma, 'passwordResetToken', {
    create: async () => {
      createCalled = true;
    },
  });

  const result = await ForgotPasswordUseCase.execute('ausente@petplus.test');

  assert.match(result.message, /Se esse e-mail estiver cadastrado/i);
  assert.equal(sendCalled, false);
  assert.equal(createCalled, false);
});

test('falha no provider de e-mail mantém resposta genérica e invalida token criado', async () => {
  const user = {
    id: 'user-1',
    email: 'tutor@petplus.test',
  };
  const persistence = mockTokenPersistence();

  mock.method(UserRepository, 'findByEmail', async () => user);
  mock.method(EmailService, 'sendPasswordReset', async () => {
    throw new Error('provider indisponível');
  });

  const result = await ForgotPasswordUseCase.execute(user.email);

  assert.match(result.message, /Se esse e-mail estiver cadastrado/i);
  assert.equal(persistence.invalidatedTokenId(), 'reset-token-1');
});
