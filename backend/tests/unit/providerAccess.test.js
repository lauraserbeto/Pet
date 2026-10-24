process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  PROVIDER_ROLES,
  OPERATIONAL_PROVIDER_SELECT,
  isOperationalProvider,
  operationalProviderWhere,
  findOperationalStore,
} = require('../../src/useCases/providers/providerAccess');

function provider({ status = 'APROVADO', roleId = 2, isActive = true, evaluations = [] } = {}) {
  return {
    id: 'prov-1',
    status,
    user: { role_id: roleId, is_active: isActive, sitter_evaluations: evaluations },
  };
}

test('lojista aprovado e ativo é operacional', () => {
  assert.equal(isOperationalProvider(provider()), true);
  assert.equal(isOperationalProvider(provider(), { roleId: PROVIDER_ROLES.STORE }), true);
});

test('cadastro pendente, recusado ou em revisão não é operacional', () => {
  for (const status of ['PENDENTE', 'REJEITADO', 'EM_REVISAO']) {
    assert.equal(isOperationalProvider(provider({ status })), false, status);
  }
});

test('conta desativada não é operacional; is_active nulo vale como ativa', () => {
  assert.equal(isOperationalProvider(provider({ isActive: false })), false);
  assert.equal(isOperationalProvider(provider({ isActive: null })), true);
});

test('Pet Sitter só é operacional com avaliação aprovada (decisão 1 do PLANO)', () => {
  const sitter = { roleId: PROVIDER_ROLES.PET_SITTER };
  assert.equal(isOperationalProvider(provider(sitter)), false);
  assert.equal(isOperationalProvider(provider({ ...sitter, evaluations: [{ status: 'APPROVED' }] })), true);
});

test('papel diferente do exigido não é operacional (hotel não vende produto)', () => {
  assert.equal(
    isOperationalProvider(provider({ roleId: PROVIDER_ROLES.HOTEL }), { roleId: PROVIDER_ROLES.STORE }),
    false
  );
});

test('sem usuário carregado responde false (na dúvida, não opera)', () => {
  assert.equal(isOperationalProvider({ status: 'APROVADO' }), false);
  assert.equal(isOperationalProvider(null), false);
});

test('filtro Prisma de lojista exige APROVADO, conta ativa e papel 2', () => {
  const where = operationalProviderWhere({ roleId: PROVIDER_ROLES.STORE });

  assert.equal(where.status, 'APROVADO');
  assert.deepEqual(where.user.AND[0], { OR: [{ is_active: true }, { is_active: null }] });
  assert.ok(where.user.AND.some((c) => c.role_id === PROVIDER_ROLES.STORE));
  // Lojista não passa pela regra da avaliação do Pet Sitter.
  assert.equal(where.user.AND.some((c) => JSON.stringify(c).includes('sitter_evaluations')), false);
});

test('filtro Prisma sem papel definido aplica a regra da avaliação do Pet Sitter', () => {
  const where = operationalProviderWhere();

  assert.ok(where.user.AND.some((c) => JSON.stringify(c).includes('sitter_evaluations')));
});

test('select operacional carrega status, papel, conta e avaliação aprovada', () => {
  assert.equal(OPERATIONAL_PROVIDER_SELECT.status, true);
  assert.equal(OPERATIONAL_PROVIDER_SELECT.user.select.role_id, true);
  assert.equal(OPERATIONAL_PROVIDER_SELECT.user.select.is_active, true);
  assert.equal(OPERATIONAL_PROVIDER_SELECT.user.select.sitter_evaluations.where.status, 'APPROVED');
});

test('findOperationalStore recusa quem não é lojista antes de consultar o banco', async () => {
  let consulted = false;
  const providerRepository = {
    findUnique: async () => {
      consulted = true;
      return provider();
    },
  };

  await assert.rejects(
    findOperationalStore({ userId: 'u', userRole: 3, providerRepository }),
    (error) => error.statusCode === 403
  );
  assert.equal(consulted, false);
});

test('findOperationalStore: sem cadastro → 403; pendente → 403 PROVIDER_NOT_OPERATIONAL', async () => {
  await assert.rejects(
    findOperationalStore({ userId: 'u', userRole: 2, providerRepository: { findUnique: async () => null } }),
    (error) => error.statusCode === 403
  );

  await assert.rejects(
    findOperationalStore({
      userId: 'u',
      userRole: 2,
      providerRepository: { findUnique: async () => provider({ status: 'PENDENTE' }) },
    }),
    (error) => error.statusCode === 403 && error.code === 'PROVIDER_NOT_OPERATIONAL'
  );
});

test('findOperationalStore devolve o lojista aprovado e ativo', async () => {
  const store = provider();
  const result = await findOperationalStore({
    userId: 'u',
    userRole: 2,
    providerRepository: { findUnique: async () => store },
  });

  assert.equal(result, store);
});
