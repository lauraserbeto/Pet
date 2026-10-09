// Política de cobrança do parceiro (AGD-1).
//
// PRESENCIAL (padrão): o tutor paga no local, no momento do serviço. O
// agendamento vai de PENDENTE direto para CONFIRMADO quando o parceiro aceita.
//
// PRE_PAGO: o parceiro exige pagamento antecipado. Entra o estado intermediário
// AGUARDANDO_CONFIRMACAO, entre o aceite do parceiro e a confirmação do
// pagamento.
//
// O campo `Provider.payment_policy` é VarChar livre no schema, seguindo o mesmo
// padrão de `Provider.status` e `Order.status`.

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
