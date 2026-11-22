const PROVIDER_STATUS = Object.freeze({
  PENDING: 'PENDENTE',
  APPROVED: 'APROVADO',
  REJECTED: 'REJEITADO',
  IN_REVIEW: 'EM_REVISAO',
});

const PROVIDER_STATUS_VALUES = Object.freeze(Object.values(PROVIDER_STATUS));
const APPROVED_PROVIDER_STATUSES = Object.freeze([PROVIDER_STATUS.APPROVED]);
const SITTER_EVALUATION_APPROVED_STATUS = 'APPROVED';

function isProviderStatus(status) {
  return PROVIDER_STATUS_VALUES.includes(status);
}

function isApprovedProviderStatus(status) {
  return status === PROVIDER_STATUS.APPROVED;
}

function hasApprovedSitterEvaluation(evaluations = []) {
  return Array.isArray(evaluations)
    && evaluations.some((evaluation) => evaluation?.status === SITTER_EVALUATION_APPROVED_STATUS);
}

function isOperationalSitter(provider) {
  if (!provider) return false;

  const providerStatus = provider.status ?? provider.provider_status ?? provider.providerStatus;
  const evaluationStatus = provider.sitter_evaluation_status ?? provider.sitterEvaluationStatus;
  const evaluations = provider.sitter_evaluations
    ?? provider.sitterEvaluations
    ?? provider.user?.sitter_evaluations
    ?? [];

  return isApprovedProviderStatus(providerStatus)
    && (evaluationStatus === SITTER_EVALUATION_APPROVED_STATUS || hasApprovedSitterEvaluation(evaluations));
}

/**
 * Transições que o ADMIN pode fazer no status do parceiro (E-11 / AUD-15).
 * - Novo cadastro ou reenvio em análise: aprovar ou recusar.
 * - Recusado: pode ser reconsiderado e aprovado ("Aprovar novamente").
 * - Aprovado: não volta a pendente nem vira recusado por aqui; suspender é
 *   desativar a conta (`User.is_active`, DEC-G).
 * REJEITADO → EM_REVISAO é do próprio parceiro (POST /providers/me/resubmit).
 * Pet Sitter só vai a APROVADO com avaliação aprovada (DEC-D), checado no use case.
 */
const ADMIN_PROVIDER_TRANSITIONS = Object.freeze({
  [PROVIDER_STATUS.PENDING]: Object.freeze([PROVIDER_STATUS.APPROVED, PROVIDER_STATUS.REJECTED]),
  [PROVIDER_STATUS.IN_REVIEW]: Object.freeze([PROVIDER_STATUS.APPROVED, PROVIDER_STATUS.REJECTED]),
  [PROVIDER_STATUS.REJECTED]: Object.freeze([PROVIDER_STATUS.APPROVED]),
  [PROVIDER_STATUS.APPROVED]: Object.freeze([]),
});

function canAdminTransitionProvider(from, to) {
  return (ADMIN_PROVIDER_TRANSITIONS[from] || []).includes(to);
}

module.exports = {
  ADMIN_PROVIDER_TRANSITIONS,
  canAdminTransitionProvider,
  PROVIDER_STATUS,
  PROVIDER_STATUS_VALUES,
  APPROVED_PROVIDER_STATUSES,
  SITTER_EVALUATION_APPROVED_STATUS,
  isProviderStatus,
  isApprovedProviderStatus,
  hasApprovedSitterEvaluation,
  isOperationalSitter,
};
