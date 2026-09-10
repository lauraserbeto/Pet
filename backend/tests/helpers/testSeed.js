const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../../src/config/database');
const { PROVIDER_STATUS } = require('../../src/constants/providerStatus');

const TEST_PASSWORD_HASH = '$2a$10$Lc8l76mKa6ReiLqq2d6zVuJ1prHHscyAsBwJa84JEZ.KVb8rvoT.q';

async function seedRoles() {
  await prisma.role.createMany({
    data: [
      { id: 1, name: 'ADMIN', description: 'Administrador' },
      { id: 2, name: 'LOJISTA', description: 'Lojista' },
      { id: 3, name: 'HOTEL', description: 'Hotel' },
      { id: 4, name: 'PET_SITTER', description: 'Pet sitter' },
      { id: 5, name: 'TUTOR', description: 'Tutor' },
    ],
    skipDuplicates: true,
  });
}

function uniqueSuffix() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
}

async function createUser(overrides = {}) {
  const suffix = uniqueSuffix();

  return prisma.user.create({
    data: {
      role_id: overrides.role_id ?? 5,
      full_name: overrides.full_name ?? 'Tutor QA',
      email: overrides.email ?? `qa-${suffix}@petplus.test`,
      password_hash: overrides.password_hash ?? TEST_PASSWORD_HASH,
      phone: overrides.phone ?? '(11) 99999-0000',
      is_active: overrides.is_active ?? true,
      terms_accepted: true,
      onboarding_step: overrides.onboarding_step ?? 'COMPLETE',
    },
  });
}

function createAuthToken(user) {
  return jwt.sign(
    { id: user.id, role_id: user.role_id },
    process.env.JWT_SECRET
  );
}

async function createAuthenticatedTutor(overrides = {}) {
  const tutor = await createUser({ ...overrides, role_id: 5 });
  const token = createAuthToken(tutor);

  return {
    tutor,
    token,
    authorization: `Bearer ${token}`,
  };
}

async function createApprovedStore(overrides = {}) {
  const suffix = uniqueSuffix();
  const storeUser = await createUser({
    role_id: 2,
    full_name: overrides.full_name ?? 'Loja QA',
    email: overrides.email ?? `store-${suffix}@petplus.test`,
  });

  const provider = await prisma.provider.create({
    data: {
      user_id: storeUser.id,
      business_name: overrides.business_name ?? 'Pet Shop QA',
      document: overrides.document ?? `qa-doc-${suffix}`,
      document_type: 'CNPJ',
      status: overrides.status ?? PROVIDER_STATUS.APPROVED,
      description: overrides.description ?? 'Fornecedor de teste QA',
      phone: overrides.phone ?? '(11) 98888-0000',
      zip_code: overrides.zip_code ?? '01001-000',
      address_line: overrides.address_line ?? 'Rua QA',
      city: overrides.city ?? 'Sao Paulo',
      state: overrides.state ?? 'SP',
    },
  });

  return { storeUser, provider };
}

async function createProduct(providerId, overrides = {}) {
  const suffix = uniqueSuffix();

  return prisma.product.create({
    data: {
      provider_id: providerId,
      name: overrides.name ?? 'Racao QA Premium',
      category: overrides.category ?? 'ALIMENTO',
      pet_type: overrides.pet_type ?? 'DOG',
      description: overrides.description ?? 'Produto usado nos testes de integracao QA-1',
      sku: overrides.sku ?? `QA-${suffix}`,
      stock_quantity: overrides.stock_quantity ?? 10,
      price: overrides.price ?? '49.90',
      image_url: overrides.image_url ?? 'https://example.com/produto-qa.jpg',
      status: overrides.status ?? 'ACTIVE',
    },
  });
}

async function createStoreWithProduct(productOverrides = {}, storeOverrides = {}) {
  const { storeUser, provider } = await createApprovedStore(storeOverrides);
  const product = await createProduct(provider.id, productOverrides);

  return { storeUser, provider, product };
}

module.exports = {
  seedRoles,
  createAuthenticatedTutor,
  createStoreWithProduct,
  createProduct,
};
