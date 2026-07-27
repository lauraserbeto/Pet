/**
 * Espelha `backend/src/constants/providerStatus.js`.
 *
 * `Provider.status` é texto livre no schema e recebe valores diferentes conforme
 * o caminho de aprovação: 'APROVADO' (lojista/hotel) ou 'ATIVO' (pet sitter).
 * Por isso "aprovado" é sempre testado por conjunto, nunca por igualdade.
 */
export const APPROVED_PROVIDER_STATUSES = ["APROVADO", "ATIVO", "ACTIVE"];

export function isApprovedProviderStatus(status?: string | null): boolean {
  return !!status && APPROVED_PROVIDER_STATUSES.includes(status);
}
