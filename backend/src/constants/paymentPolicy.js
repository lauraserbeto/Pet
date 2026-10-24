// Política de cobrança do parceiro (AGD-1; regras vigentes pela DEC-A, 23/10/2026).
//
// PRESENCIAL (padrão): o tutor paga no local, no momento do serviço. O
// agendamento nasce PENDENTE e o parceiro confirma ou recusa.
//
// PRE_PAGO: o parceiro exige pagamento antecipado. O tutor paga na reserva e o
// agendamento passa a AGUARDANDO_CONFIRMACAO; depois o parceiro confirma ou
// recusa (recusa ou cancelamento de agendamento pago geram estorno — PAG-2).
//
// `Provider.payment_policy` e `Appointment.payment_policy` são o enum
// `PaymentPolicy` no banco. O agendamento guarda a política vigente na reserva.

const PAYMENT_POLICY = {
  ON_SITE: 'PRESENCIAL',
  PREPAID: 'PRE_PAGO',
};

/** Política aplicada a quem não definiu nada. */
const DEFAULT_PAYMENT_POLICY = PAYMENT_POLICY.ON_SITE;

const PAYMENT_POLICY_VALUES = Object.freeze(Object.values(PAYMENT_POLICY));

/** Normaliza o valor lido do banco; nulo/desconhecido cai no padrão. */
function normalizePaymentPolicy(policy) {
  if (!policy || typeof policy !== 'string') return DEFAULT_PAYMENT_POLICY;
  const upper = policy.trim().toUpperCase();
  return PAYMENT_POLICY_VALUES.includes(upper) ? upper : DEFAULT_PAYMENT_POLICY;
}

function isPrepaid(policy) {
  return normalizePaymentPolicy(policy) === PAYMENT_POLICY.PREPAID;
}

function isValidPaymentPolicy(policy) {
  return PAYMENT_POLICY_VALUES.includes(policy);
}

module.exports = {
  PAYMENT_POLICY,
  DEFAULT_PAYMENT_POLICY,
  PAYMENT_POLICY_VALUES,
  normalizePaymentPolicy,
  isPrepaid,
  isValidPaymentPolicy,
};
