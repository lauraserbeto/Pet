/**
 * Espelha `backend/src/constants/paymentPolicy.js` (AGD-1; regras pela DEC-A, 23/10/2026).
 * A política vale para os agendamentos criados depois da troca; os já feitos
 * mantêm a política da reserva.
 */
export const PAYMENT_POLICY = {
  ON_SITE: "PRESENCIAL",
  PREPAID: "PRE_PAGO",
} as const;

export type PaymentPolicy = (typeof PAYMENT_POLICY)[keyof typeof PAYMENT_POLICY];

export const DEFAULT_PAYMENT_POLICY: PaymentPolicy = PAYMENT_POLICY.ON_SITE;

export const PAYMENT_POLICY_LABELS: Record<PaymentPolicy, string> = {
  PRESENCIAL: "Pagamento presencial",
  PRE_PAGO: "Pagamento antecipado",
};

export const PAYMENT_POLICY_DESCRIPTIONS: Record<PaymentPolicy, string> = {
  PRESENCIAL: "Você confirma ou recusa cada solicitação; o tutor paga no local.",
  PRE_PAGO: "O tutor paga ao reservar; você confirma ou recusa depois (a recusa gera estorno integral).",
};

/** Valor ausente ou desconhecido vale como presencial — nunca como pré-pago. */
export function normalizePaymentPolicy(policy?: string | null): PaymentPolicy {
  return policy === PAYMENT_POLICY.PREPAID ? PAYMENT_POLICY.PREPAID : DEFAULT_PAYMENT_POLICY;
}
