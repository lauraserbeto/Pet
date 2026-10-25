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

/** Endereço de entrega do usuário (E-05). */
async function createAddress(userId, overrides = {}) {
  return prisma.address.create({
    data: {
      user_id: userId,
      cep: overrides.cep ?? '01001-000',
      rua: overrides.rua ?? 'Praça da Sé',
      numero: overrides.numero ?? '100',
      complemento: overrides.complemento ?? 'Apto 12',
      bairro: overrides.bairro ?? 'Sé',
      cidade: overrides.cidade ?? 'São Paulo',
      estado: overrides.estado ?? 'SP',
      is_default: overrides.is_default ?? true,
    },
  });
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

// --- Agendamento (E-04) ---

/**
 * Hotel (3) ou Pet Sitter (4) aprovado e operacional. O sitter recebe a
 * avaliação aprovada, salvo `sitterEvaluation: false`.
 */
async function createApprovedPartner({ role_id = 3, payment_policy = 'PRESENCIAL', sitterEvaluation = true } = {}) {
  const suffix = uniqueSuffix();
  const partnerUser = await createUser({
    role_id,
    full_name: role_id === 4 ? 'Pet Sitter QA' : 'Hotel QA',
    email: `partner-${suffix}@petplus.test`,
  });

  if (role_id === 4 && sitterEvaluation) {
    await prisma.sitterEvaluation.create({
      data: { user_id: partnerUser.id, experience_details: 'Experiência QA', status: 'APPROVED' },
    });
  }

  const provider = await prisma.provider.create({
    data: {
      user_id: partnerUser.id,
      business_name: role_id === 4 ? 'Sitter QA' : 'Hotel QA',
      document: `qa-doc-${suffix}`,
      document_type: role_id === 4 ? 'CPF' : 'CNPJ',
      status: PROVIDER_STATUS.APPROVED,
      payment_policy,
      // Tarifas do perfil diferentes do preço do serviço (DEC-B).
      daily_rate: '999.00',
      hourly_rate: '999.00',
    },
  });

  return { partnerUser, provider };
}

async function createService(providerId, overrides = {}) {
  return prisma.service.create({
    data: {
      provider_id: providerId,
      name: overrides.name ?? 'Serviço QA',
      category: overrides.category ?? 'BOARDING',
      price: overrides.price ?? '100.00',
      is_active: overrides.is_active ?? true,
    },
  });
}

async function createPet(tutorId, overrides = {}) {
  return prisma.pet.create({
    data: {
      tutor_id: tutorId,
      name: overrides.name ?? 'Rex QA',
      species: overrides.species ?? 'DOG',
    },
  });
}

module.exports = {
  seedRoles,
  createAuthenticatedTutor,
  createAddress,
  createStoreWithProduct,
  createProduct,
  createApprovedPartner,
  createService,
  createPet,
};
