const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const {
  PROVIDER_STATUS,
  SITTER_EVALUATION_APPROVED_STATUS,
  isApprovedProviderStatus,
  hasApprovedSitterEvaluation,
} = require('../../constants/providerStatus');

// Parceiro operacional (decisões 1, 5 e 9 do PLANO; E-01): cadastro APROVADO,
// conta ativa e, no caso do Pet Sitter, avaliação (questionário) aprovada.
//
// Ponto único dessa regra no backend. Produtos, vitrine, carrinho, pedido e
// detalhe público consultam daqui — antes cada tela do front decidia sozinha e
// a API aceitava qualquer parceiro com token.

const PROVIDER_ROLES = Object.freeze({
  STORE: 2,
  HOTEL: 3,
  PET_SITTER: 4,
});

// Campos necessários para `isOperationalProvider` avaliar um provider carregado.
const OPERATIONAL_PROVIDER_SELECT = Object.freeze({
  status: true,
  user: {
    select: {
      role_id: true,
      is_active: true,
      sitter_evaluations: {
        where: { status: SITTER_EVALUATION_APPROVED_STATUS },
        select: { status: true },
        take: 1,
      },
    },
  },
});

/** `is_active` é Boolean? com default true: null/undefined valem como ativo. */
function isActiveAccount(user) {
  return user?.is_active !== false;
}

/**
 * Avalia um provider já carregado (com `status` e `user`). Sem `user` carregado,
 * responde false: na dúvida, o parceiro não opera.
 */
function isOperationalProvider(provider, { roleId } = {}) {
  if (!provider || !isApprovedProviderStatus(provider.status)) return false;

  const user = provider.user;
  if (!user || !isActiveAccount(user)) return false;
  if (roleId !== undefined && user.role_id !== roleId) return false;

  if (user.role_id === PROVIDER_ROLES.PET_SITTER) {
    return hasApprovedSitterEvaluation(user.sitter_evaluations);
  }
  return true;
}

/**
 * Filtro Prisma equivalente a `isOperationalProvider`, para consultas:
 * `where: { provider: operationalProviderWhere({ roleId: PROVIDER_ROLES.STORE }) }`.
 */
function operationalProviderWhere({ roleId } = {}) {
  const userConditions = [{ OR: [{ is_active: true }, { is_active: null }] }];

  if (roleId !== undefined) {
    userConditions.push({ role_id: roleId });
  }

  if (roleId === undefined || roleId === PROVIDER_ROLES.PET_SITTER) {
    userConditions.push({
      OR: [
        { role_id: { not: PROVIDER_ROLES.PET_SITTER } },
        { sitter_evaluations: { some: { status: SITTER_EVALUATION_APPROVED_STATUS } } },
      ],
    });
  }

  return {
    status: PROVIDER_STATUS.APPROVED,
    user: { AND: userConditions },
  };
}

/** Lança 403 quando o provider não está apto a operar. */
function assertOperationalProvider(provider, { roleId, message } = {}) {
  if (!isOperationalProvider(provider, { roleId })) {
    throw new AppError(
      message || 'Parceiro não está apto a operar na plataforma.',
      403,
      'PROVIDER_NOT_OPERATIONAL'
    );
  }
  return provider;
}

/**
 * Lojista autenticado que pode gerenciar produtos (decisão 5 do PLANO):
 * papel LOJISTA, cadastro aprovado e conta ativa.
 */
async function findOperationalStore({ userId, userRole, providerRepository = prisma.provider }) {
  if (userRole !== PROVIDER_ROLES.STORE) {
    throw AppError.forbidden('Apenas lojistas podem gerenciar produtos.');
  }

  const provider = await providerRepository.findUnique({
    where: { user_id: userId },
    select: { id: true, ...OPERATIONAL_PROVIDER_SELECT },
  });

  if (!provider) {
    throw AppError.forbidden('Perfil de lojista não encontrado para este usuário.');
  }

  return assertOperationalProvider(provider, {
    roleId: PROVIDER_ROLES.STORE,
    message: 'Apenas lojistas aprovados e com conta ativa podem gerenciar produtos.',
  });
}

module.exports = {
  PROVIDER_ROLES,
  OPERATIONAL_PROVIDER_SELECT,
  isOperationalProvider,
  operationalProviderWhere,
  assertOperationalProvider,
  findOperationalStore,
};
