const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { PROVIDER_STATUS } = require('../../constants/providerStatus');
const { SERVICE_CATEGORIES } = require('../../schemas/serviceSchemas');

const SERVICE_PROVIDER_ROLES = Object.freeze({
  HOTEL: 3,
  PET_SITTER: 4,
});

function assertServiceProviderRole(userRole) {
  if (![SERVICE_PROVIDER_ROLES.HOTEL, SERVICE_PROVIDER_ROLES.PET_SITTER].includes(userRole)) {
    throw AppError.forbidden('Apenas hotéis e pet sitters podem gerenciar serviços.');
  }
}

function assertValidCategory(category) {
  if (!SERVICE_CATEGORIES.includes(category)) {
    throw AppError.validation('Categoria de serviço inválida.');
  }
}

async function findApprovedServiceProvider({ userId, userRole, providerRepository = prisma.provider }) {
  assertServiceProviderRole(userRole);

  const provider = await providerRepository.findUnique({
    where: { user_id: userId },
    select: {
      id: true,
      status: true,
      user: { select: { role_id: true } },
    },
  });

  if (!provider || provider.user?.role_id !== userRole) {
    throw AppError.forbidden('Perfil de parceiro não encontrado para este usuário.');
  }

  if (provider.status !== PROVIDER_STATUS.APPROVED) {
    throw AppError.forbidden('Apenas parceiros aprovados podem gerenciar serviços.');
  }

  return provider;
}

function toNumber(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}

function serializeService(service, roleId) {
  if (!service) return service;

  return {
    id: service.id,
    provider_id: service.provider_id,
    name: service.name,
    category: service.category,
    description: service.description,
    price: toNumber(service.price),
    duration_minutes: service.duration_minutes,
    billing_unit: roleId === SERVICE_PROVIDER_ROLES.HOTEL ? 'DIARIA' : 'HORA',
    is_active: service.is_active,
    created_at: service.created_at,
  };
}

module.exports = {
  SERVICE_PROVIDER_ROLES,
  assertValidCategory,
  findApprovedServiceProvider,
  serializeService,
};
