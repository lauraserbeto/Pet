process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const UserRepository = require('../../src/repositories/UserRepository');
const authMiddleware = require('../../src/middlewares/authMiddleware');

const originalFindAuthState = UserRepository.findAuthState;
afterEach(() => {
  UserRepository.findAuthState = originalFindAuthState;
});

const USER_ID = '11111111-1111-4111-8111-111111111111';
const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET);

const NOT_CALLED = Symbol('next não chamado');

/** Executa o middleware com um estado de conta simulado e captura o resultado. */
async function run({ token, method = 'GET', url = '/api/v1/products', account }) {
  UserRepository.findAuthState = async () => account;

  const req = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    method,
    originalUrl: url,
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextArg = NOT_CALLED;
  await authMiddleware(req, res, (err) => {
    nextArg = err;
  });
  return { req, res, nextArg };
}

const activeStore = { id: USER_ID, role_id: 2, is_active: true, provider: { status: 'APROVADO' } };

test('sem token → 401 sem consultar a conta', async () => {
  let consulted = false;
  UserRepository.findAuthState = async () => {
    consulted = true;
  };
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };
  await authMiddleware({ headers: {}, method: 'GET', originalUrl: '/x' }, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(consulted, false);
});

test('token inválido → 401', async () => {
  const { res, nextArg } = await run({ token: 'nao-e-um-jwt', account: activeStore });

  assert.equal(res.statusCode, 401);
  assert.equal(nextArg, NOT_CALLED);
});

test('conta inexistente → 401 ACCOUNT_DISABLED', async () => {
  const { nextArg } = await run({ token: sign({ id: USER_ID, role_id: 2 }), account: null });

  assert.equal(nextArg.statusCode, 401);
  assert.equal(nextArg.code, 'ACCOUNT_DISABLED');
});

test('conta desativada → 401 ACCOUNT_DISABLED mesmo com token ainda válido', async () => {
  const { nextArg } = await run({
    token: sign({ id: USER_ID, role_id: 2 }),
    account: { ...activeStore, is_active: false },
  });

  assert.equal(nextArg.statusCode, 401);
  assert.equal(nextArg.code, 'ACCOUNT_DISABLED');
});

test('is_active nulo vale como conta ativa', async () => {
  const { nextArg } = await run({
    token: sign({ id: USER_ID, role_id: 2 }),
    account: { ...activeStore, is_active: null },
  });

  assert.equal(nextArg, undefined);
});

test('papel e status do parceiro vêm do banco, não do token', async () => {
  const { req, nextArg } = await run({
    token: sign({ id: USER_ID, role_id: 5 }),
    account: activeStore,
  });

  assert.equal(nextArg, undefined);
  assert.equal(req.userId, USER_ID);
  assert.equal(req.userRole, 2);
  assert.equal(req.providerStatus, 'APROVADO');
});

test('parceiro REJEITADO acessa as rotas de correção e de conta própria', async () => {
  const rejected = { ...activeStore, provider: { status: 'REJEITADO' } };
  const allowed = [
    ['GET', '/api/v1/providers/me'],
    ['PUT', '/api/v1/providers/me'],
    ['POST', '/api/v1/providers/me/resubmit'],
    ['GET', '/api/v1/users/me?fields=all'],
    ['PATCH', '/api/v1/users/me/password'],
    ['GET', '/api/v1/cart/'],
    ['GET', '/api/v1/favorites/ids'],
  ];

  for (const [method, url] of allowed) {
    const { nextArg } = await run({ token: sign({ id: USER_ID }), method, url, account: rejected });
    assert.equal(nextArg, undefined, `${method} ${url} deveria ser liberada`);
  }
});

test('parceiro REJEITADO recebe 403 PROVIDER_REJECTED fora das rotas liberadas', async () => {
  const rejected = { ...activeStore, provider: { status: 'REJEITADO' } };
  const blocked = [
    ['POST', '/api/v1/products'],
    ['GET', '/api/v1/orders/received'],
    ['GET', '/api/v1/providers/completeness'],
    ['DELETE', '/api/v1/cart'],
  ];

  for (const [method, url] of blocked) {
    const { nextArg } = await run({ token: sign({ id: USER_ID }), method, url, account: rejected });
    assert.equal(nextArg?.statusCode, 403, `${method} ${url} deveria ser bloqueada`);
    assert.equal(nextArg.code, 'PROVIDER_REJECTED');
  }
});
