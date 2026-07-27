// `Provider.status` é um VarChar livre (não é enum no schema), e o fluxo grava
// valores diferentes conforme o caminho de aprovação:
//   - Lojista/Hotel  → 'APROVADO' (ProviderController.updateStatus)
//   - Pet Sitter     → 'ATIVO'    (UserController.reviewEvaluation)
// Por isso "aprovado" é testado por CONJUNTO, nunca por igualdade simples.

const PROVIDER_STATUS = {
  PENDING: 'PENDENTE',
  APPROVED: 'APROVADO',
  REJECTED: 'REJEITADO',
};

/** Valores que significam "parceiro liberado na plataforma". */
const APPROVED_PROVIDER_STATUSES = ['APROVADO', 'ATIVO', 'ACTIVE'];

function isApprovedProviderStatus(status) {
  return APPROVED_PROVIDER_STATUSES.includes(status);
}

module.exports = {
  PROVIDER_STATUS,
  APPROVED_PROVIDER_STATUSES,
  isApprovedProviderStatus,
};
