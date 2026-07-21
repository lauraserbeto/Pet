const { test } = require('node:test');
const assert = require('node:assert/strict');
const { registerSchema, SELF_SERVICE_ROLES } = require('../../src/schemas/authSchemas');

const base = { full_name: 'Fulano Teste', email: 'fulano@teste.com', password: 'senha123' };

test('rejeita role_id 1 (ADMIN) — trava a escalada de privilégio (PET-01)', () => {
  const r = registerSchema.safeParse({ ...base, role_id: 1 });
  assert.equal(r.success, false);
  assert.match(r.error.issues[0].message, /inválido para cadastro/i);
});

test('aceita todas as roles self-service (2,3,4,5)', () => {
  for (const role of SELF_SERVICE_ROLES) {
    const extra = role === 5
      ? {}
      : { business_name: 'Loja X', document: '12345678000199', document_type: 'CNPJ' };
    const r = registerSchema.safeParse({ ...base, role_id: role, ...extra });
    assert.equal(r.success, true, `role ${role} deveria ser aceita`);
  }
});

test('rejeita role_id fora do conjunto (0, 6, 99)', () => {
  for (const role of [0, 6, 99]) {
    assert.equal(registerSchema.safeParse({ ...base, role_id: role }).success, false);
  }
});

test('rejeita role_id como string "1" (tipo inválido)', () => {
  assert.equal(registerSchema.safeParse({ ...base, role_id: '1' }).success, false);
});

test('rejeita e-mail inválido', () => {
  assert.equal(registerSchema.safeParse({ ...base, email: 'nao-eh-email', role_id: 5 }).success, false);
});

test('rejeita senha curta (< 6 caracteres)', () => {
  assert.equal(registerSchema.safeParse({ ...base, password: '123', role_id: 5 }).success, false);
});

test('remove campos não declarados (anti mass-assignment)', () => {
  const r = registerSchema.safeParse({
    ...base,
    role_id: 5,
    is_active: true,
    onboarding_step: 'COMPLETED',
    rejection_reason: 'x',
  });
  assert.equal(r.success, true);
  assert.equal('is_active' in r.data, false);
  assert.equal('onboarding_step' in r.data, false);
  assert.equal('rejection_reason' in r.data, false);
});
