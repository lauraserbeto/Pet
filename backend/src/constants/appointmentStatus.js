// Máquina de estados do Appointment (AGD-1).
//
// Espelha o padrão de orderStatus.js/providerStatus.js. O campo
// `Appointment.status` é VarChar livre no schema — a validação mora aqui.
//
// ATENÇÃO: esta máquina é independente da de Order/pagamento. Um agendamento
// CONFIRMADO não diz nada sobre o pedido; são ciclos de vida distintos.
//
// Fluxo feliz, por política de cobrança do parceiro:
//
//   PRESENCIAL:  PENDENTE ───────────────────────────────▶ CONFIRMADO ─▶ CONCLUIDO
//   PRE_PAGO:    PENDENTE ─▶ AGUARDANDO_CONFIRMACAO ─────▶ CONFIRMADO ─▶ CONCLUIDO
//
// AGUARDANDO_CONFIRMACAO só existe em parceiro PRE_PAGO: é a janela entre o
// aceite do parceiro e a confirmação do pagamento. Em PRESENCIAL o pagamento
// acontece no local, então esse estado nunca ocorre.
//
// Saídas: RECUSADO (parceiro nega) e CANCELADO (tutor ou parceiro desiste),
// ambos terminais.

const { PAYMENT_POLICY, isPrepaid } = require('./paymentPolicy');

const APPOINTMENT_STATUS = {
  PENDING: 'PENDENTE',
  AWAITING_CONFIRMATION: 'AGUARDANDO_CONFIRMACAO',
  CONFIRMED: 'CONFIRMADO',
  COMPLETED: 'CONCLUIDO',
  REJECTED: 'RECUSADO',
  CANCELLED: 'CANCELADO',
};

/** Status inicial de todo agendamento criado. */
const INITIAL_APPOINTMENT_STATUS = APPOINTMENT_STATUS.PENDING;

const APPOINTMENT_STATUS_VALUES = Object.freeze(Object.values(APPOINTMENT_STATUS));

/**
 * Transições permitidas, ignorando a política de cobrança.
 * Use `isValidAppointmentTransition` para aplicar também a regra condicional
 * de AGUARDANDO_CONFIRMACAO.
 */
const ALLOWED_APPOINTMENT_TRANSITIONS = {
  [APPOINTMENT_STATUS.PENDING]: [
    APPOINTMENT_STATUS.AWAITING_CONFIRMATION,
    APPOINTMENT_STATUS.CONFIRMED,
    APPOINTMENT_STATUS.REJECTED,
    APPOINTMENT_STATUS.CANCELLED,
  ],
  [APPOINTMENT_STATUS.AWAITING_CONFIRMATION]: [
    APPOINTMENT_STATUS.CONFIRMED,
    APPOINTMENT_STATUS.CANCELLED,
  ],
  [APPOINTMENT_STATUS.CONFIRMED]: [
    APPOINTMENT_STATUS.COMPLETED,
    APPOINTMENT_STATUS.CANCELLED,
  ],
  [APPOINTMENT_STATUS.COMPLETED]: [],
  [APPOINTMENT_STATUS.REJECTED]: [],
  [APPOINTMENT_STATUS.CANCELLED]: [],
};

/** Sinônimos em inglês herdados do schema antigo (`PENDING`, `CONFIRMED`, ...). */
const APPOINTMENT_STATUS_ALIASES = {
  PENDENTE: APPOINTMENT_STATUS.PENDING,
  PENDING: APPOINTMENT_STATUS.PENDING,
  AGUARDANDO_CONFIRMACAO: APPOINTMENT_STATUS.AWAITING_CONFIRMATION,
  AWAITING_CONFIRMATION: APPOINTMENT_STATUS.AWAITING_CONFIRMATION,
  CONFIRMADO: APPOINTMENT_STATUS.CONFIRMED,
  CONFIRMED: APPOINTMENT_STATUS.CONFIRMED,
  CONCLUIDO: APPOINTMENT_STATUS.COMPLETED,
  COMPLETED: APPOINTMENT_STATUS.COMPLETED,
  RECUSADO: APPOINTMENT_STATUS.REJECTED,
  REJECTED: APPOINTMENT_STATUS.REJECTED,
  CANCELADO: APPOINTMENT_STATUS.CANCELLED,
  CANCELLED: APPOINTMENT_STATUS.CANCELLED,
  CANCELED: APPOINTMENT_STATUS.CANCELLED,
};

/** Normaliza um status recebido para o valor canônico, ou null. */
function normalizeAppointmentStatus(status) {
  if (!status || typeof status !== 'string') return null;
  return APPOINTMENT_STATUS_ALIASES[status.trim().toUpperCase()] ?? null;
}

function isValidAppointmentStatus(status) {
  return APPOINTMENT_STATUS_VALUES.includes(status);
}

/**
 * Próximo status do fluxo feliz depois que o parceiro aceita o agendamento.
 * PRE_PAGO passa por AGUARDANDO_CONFIRMACAO; PRESENCIAL vai direto a CONFIRMADO.
 */
function nextStatusAfterPartnerAccepts(paymentPolicy) {
  return isPrepaid(paymentPolicy)
    ? APPOINTMENT_STATUS.AWAITING_CONFIRMATION
    : APPOINTMENT_STATUS.CONFIRMED;
}

/**
 * Valida a transição. A política de cobrança é opcional: sem ela, a regra
 * condicional de AGUARDANDO_CONFIRMACAO não é aplicada.
 *
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @param {string} [paymentPolicy] PRESENCIAL | PRE_PAGO
 */
function isValidAppointmentTransition(currentStatus, nextStatus, paymentPolicy) {
  const allowed = ALLOWED_APPOINTMENT_TRANSITIONS[currentStatus];
  if (!Array.isArray(allowed) || !allowed.includes(nextStatus)) return false;

  // AGUARDANDO_CONFIRMACAO é exclusivo de parceiro PRE_PAGO.
  if (
    paymentPolicy !== undefined &&
    nextStatus === APPOINTMENT_STATUS.AWAITING_CONFIRMATION &&
    !isPrepaid(paymentPolicy)
  ) {
    return false;
  }

  return true;
}

function isAppointmentTerminalStatus(status) {
  const transitions = ALLOWED_APPOINTMENT_TRANSITIONS[status];
  return Array.isArray(transitions) && transitions.length === 0;
}

module.exports = {
  APPOINTMENT_STATUS,
  INITIAL_APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_VALUES,
  ALLOWED_APPOINTMENT_TRANSITIONS,
  APPOINTMENT_STATUS_ALIASES,
  PAYMENT_POLICY,
  normalizeAppointmentStatus,
  isValidAppointmentStatus,
  isValidAppointmentTransition,
  isAppointmentTerminalStatus,
  nextStatusAfterPartnerAccepts,
};
