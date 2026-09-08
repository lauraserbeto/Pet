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

module.exports = {
  PROVIDER_STATUS,
  PROVIDER_STATUS_VALUES,
  APPROVED_PROVIDER_STATUSES,
  SITTER_EVALUATION_APPROVED_STATUS,
  isProviderStatus,
  isApprovedProviderStatus,
  hasApprovedSitterEvaluation,
  isOperationalSitter,
};
