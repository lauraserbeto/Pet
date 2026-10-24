process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// Acesso de parceiros pelo backend (E-01): sessão restrita do parceiro recusado,
// desativação de conta (DEC-G) e detalhe público só de parceiro operacional.
// ─────────────────────────────────────────────────────────────────────────────

const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signTestToken, setAccountState } = require('../helpers/authState');

const prisma = require('../../src/config/database');
const app = require('../../src/app');

const ADMIN_ID = '00000000-0000-4000-8000-0000000000a1';
const OTHER_ADMIN_ID = '00000000-0000-4000-8000-0000000000a2';
const STORE_USER_ID = '00000000-0000-4000-8000-0000000000b1';
const PROVIDER_ID = '00000000-0000-4000-8000-0000000000c1';

const restores = [];
function stub(target, method, impl) {
  const original = target[method];
  target[method] = impl;
  restores.push(() => {
    target[method] = original;
  });
}

afterEach(() => {
  while (restores.length > 0) restores.pop()();
});

const adminToken = () => signTestToken({ id: ADMIN_ID, role_id: 1 });

// ── Sessão restrita do parceiro recusado ──────────────────────────────────────

test('parceiro REJEITADO consulta o próprio cadastro para corrigi-lo', async () => {
  stub(prisma.provider, 'findUnique', async () => ({ id: PROVIDER_ID, status: 'REJEITADO' }));
  const token = signTestToken({ id: STORE_USER_ID, role_id: 2, provider_status: 'REJEITADO' });

  const res = await request(app).get('/api/v1/providers/me').set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
});

test('parceiro REJEITADO não acessa pedidos recebidos → 403 PROVIDER_REJECTED', async () => {
  const token = signTestToken({ id: STORE_USER_ID, role_id: 2, provider_status: 'REJEITADO' });

  const res = await request(app).get('/api/v1/orders/received').set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'PROVIDER_REJECTED');
});

// ── Desativação de conta (PATCH /users/admin/users/:id/active) ────────────────

test('admin desativa a conta e a próxima requisição com o token antigo → 401', async () => {
  let updateArgs;
  stub(prisma.user, 'findUnique', async () => ({ id: STORE_USER_ID, role_id: 2 }));
  stub(prisma.user, 'update', async (args) => {
    updateArgs = args;
    return { id: STORE_USER_ID, full_name: 'Loja', email: 'loja@petplus.test', role_id: 2, is_active: false };
  });
  const storeToken = signTestToken({ id: STORE_USER_ID, role_id: 2, provider_status: 'APROVADO' });

  const res = await request(app)
    .patch(`/api/v1/users/admin/users/${STORE_USER_ID}/active`)
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({ is_active: false });

  assert.equal(res.status, 200);
  assert.equal(res.body.is_active, false);
  assert.deepEqual(updateArgs.data.is_active, false);
  assert.equal(res.body.password_hash, undefined);

  // O banco simulado não é o mesmo do estado de autenticação: reflete a mudança.
  setAccountState(STORE_USER_ID, { is_active: false });
  const next = await request(app).get('/api/v1/providers/me').set('Authorization', `Bearer ${storeToken}`);
  assert.equal(next.status, 401);
  assert.equal(next.body.error.code, 'ACCOUNT_DISABLED');
});

test('desativação: não-admin → 403; conta de admin → 403; própria conta → 422', async () => {
  const storeToken = signTestToken({ id: STORE_USER_ID, role_id: 2, provider_status: 'APROVADO' });
  const asStore = await request(app)
    .patch(`/api/v1/users/admin/users/${OTHER_ADMIN_ID}/active`)
    .set('Authorization', `Bearer ${storeToken}`)
    .send({ is_active: false });
  assert.equal(asStore.status, 403);

  stub(prisma.user, 'findUnique', async () => ({ id: OTHER_ADMIN_ID, role_id: 1 }));
  const otherAdmin = await request(app)
    .patch(`/api/v1/users/admin/users/${OTHER_ADMIN_ID}/active`)
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({ is_active: false });
  assert.equal(otherAdmin.status, 403);

  const self = await request(app)
    .patch(`/api/v1/users/admin/users/${ADMIN_ID}/active`)
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({ is_active: false });
  assert.equal(self.status, 422);
});

test('desativação: corpo inválido → 422; usuário inexistente → 404', async () => {
  const invalid = await request(app)
    .patch(`/api/v1/users/admin/users/${STORE_USER_ID}/active`)
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({ is_active: 'nao' });
  assert.equal(invalid.status, 422);

  stub(prisma.user, 'findUnique', async () => null);
  const missing = await request(app)
    .patch(`/api/v1/users/admin/users/${STORE_USER_ID}/active`)
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({ is_active: false });
  assert.equal(missing.status, 404);
});

// ── Detalhe público de parceiro ───────────────────────────────────────────────

test('GET /providers/:id: parceiro inexistente ou fora da vitrine → 404 (antes 500)', async () => {
  stub(prisma.provider, 'findFirst', async () => null);

  const res = await request(app).get(`/api/v1/providers/${PROVIDER_ID}`);

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('GET /providers/:id: id inválido → 422', async () => {
  const res = await request(app).get('/api/v1/providers/nao-e-uuid');

  assert.equal(res.status, 422);
});
