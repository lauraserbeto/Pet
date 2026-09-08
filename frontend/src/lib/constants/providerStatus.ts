/**
 * Espelha `backend/src/constants/providerStatus.js`.
 */
export const PROVIDER_STATUS = {
  PENDING: "PENDENTE",
  APPROVED: "APROVADO",
  REJECTED: "REJEITADO",
  IN_REVIEW: "EM_REVISAO",
} as const;

export const PROVIDER_STATUS_VALUES: string[] = Object.values(PROVIDER_STATUS);
export const APPROVED_PROVIDER_STATUSES: string[] = [PROVIDER_STATUS.APPROVED];

export function isApprovedProviderStatus(status?: string | null): boolean {
  return status === PROVIDER_STATUS.APPROVED;
}
