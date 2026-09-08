process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';
const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const UserRepository = require('../../src/repositories/UserRepository');
const LoginUseCase = require('../../src/useCases/auth/LoginUseCase');

// Monta um usuário fake e intercepta o repositório + a checagem de senha,
// isolando a REGRA DE ACESSO (role × status) do banco.
function stubUser({ role_id, status, onboarding_step = 'INCOMPLETE', rejection_reason = null, is_active }) {
  const user = {
    id: 'user-1',
    full_name: 'Fulano',
    email: 'fulano@teste.com',
    password_hash: 'hash',
    role_id,
    onboarding_step,
    is_active,
    provider: status ? { status, business_name: 'Negócio', rejection_reason } : null,
  };
  mock.method(UserRepository, 'findByEmail', async () => user);
  mock.method(bcrypt, 'compare', async () => true);
}

afterEach(() => mock.restoreAll());

const login = () => LoginUseCase.execute('fulano@teste.com', 'senha123');

test('Lojista (2) PENDENTE é bloqueado com 403', async () => {
  stubUser({ role_id: 2, status: 'PENDENTE' });
  await assert.rejects(login, (err) => {
    assert.equal(err.statusCode, 403);
    assert.match(err.message, /em análise/i);
    return true;
  });
});

test('Hotel (3) PENDENTE é bloqueado com 403', async () => {
  stubUser({ role_id: 3, status: 'PENDENTE' });
  await assert.rejects(login, (err) => err.statusCode === 403);
});

test('Lojista (2) APROVADO entra normalmente', async () => {
  stubUser({ role_id: 2, status: 'APROVADO' });
  const result = await login();
  assert.ok(result.token);
  assert.equal(result.user.role_id, 2);
});

test('Hotel (3) ATIVO é bloqueado após normalização do enum STA-1', async () => {
  stubUser({ role_id: 3, status: 'ATIVO' });
  await assert.rejects(login, (err) => err.statusCode === 403);
});

test('Hotel (3) ACTIVE é bloqueado após normalização do enum STA-1', async () => {
  stubUser({ role_id: 3, status: 'ACTIVE' });
  await assert.rejects(login, (err) => err.statusCode === 403);
});

test('Pet Sitter (4) PENDENTE/INCOMPLETE CONSEGUE logar (precisa completar o onboarding)', async () => {
  stubUser({ role_id: 4, status: 'PENDENTE', onboarding_step: 'INCOMPLETE' });
  const result = await login();
  assert.ok(result.token, 'sitter novo precisa entrar para preencher a avaliação');
  assert.equal(result.user.onboarding_step, 'INCOMPLETE');
});

test('Pet Sitter (4) em IN_REVIEW também loga', async () => {
  stubUser({ role_id: 4, status: 'PENDENTE', onboarding_step: 'IN_REVIEW' });
  assert.ok((await login()).token);
});

test('Parceiro REJEITADO é bloqueado com o motivo', async () => {
  stubUser({ role_id: 2, status: 'REJEITADO', rejection_reason: 'Documento inválido' });
  await assert.rejects(login, (err) => {
    assert.equal(err.statusCode, 403);
    assert.match(err.message, /recusado.*Documento inválido/i);
    return true;
  });
});

test('Tutor (5) sem provider entra normalmente', async () => {
  stubUser({ role_id: 5, status: null });
  assert.ok((await login()).token);
});

test('Admin (1) entra normalmente', async () => {
  stubUser({ role_id: 1, status: null });
  assert.ok((await login()).token);
});

test('status desconhecido em Lojista bloqueia (teste por conjunto, não por igualdade)', async () => {
  stubUser({ role_id: 2, status: 'QUALQUER_COISA' });
  await assert.rejects(login, (err) => err.statusCode === 403);
});

// --- SEC-1: conta desativada ---

test('Usuário com is_active = false é bloqueado com 403', async () => {
  stubUser({ role_id: 1, is_active: false });
  await assert.rejects(login, (err) => {
    assert.equal(err.statusCode, 403);
    assert.match(err.message, /desativada/i);
    return true;
  });
});

test('is_active = false bloqueia mesmo um parceiro aprovado', async () => {
  stubUser({ role_id: 2, status: 'APROVADO', is_active: false });
  await assert.rejects(login, (err) => {
    assert.equal(err.statusCode, 403);
    assert.match(err.message, /desativada/i);
    return true;
  });
});

test('is_active null/undefined vale como ativo (default do schema)', async () => {
  stubUser({ role_id: 1, is_active: null });
  const semFlag = await login();
  assert.ok(semFlag.token);

  stubUser({ role_id: 1 });
  const indefinido = await login();
  assert.ok(indefinido.token);
});

test('is_active = true continua logando normalmente', async () => {
  stubUser({ role_id: 1, is_active: true });
  const result = await login();
  assert.ok(result.token);
  assert.equal(result.user.email, 'fulano@teste.com');
});
