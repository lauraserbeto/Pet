// Máquina de estados do Appointment (AGD-1; regras vigentes pela DEC-A, 23/10/2026).
//
// Espelha o padrão de orderStatus.js/providerStatus.js. O campo
// `Appointment.status` é VarChar livre no schema — a validação mora aqui.
//
// ATENÇÃO: esta máquina é independente da de Order/pagamento. Um agendamento
// CONFIRMADO não diz nada sobre o pedido; são ciclos de vida distintos.
//
// Todo agendamento nasce PENDENTE. Fluxo feliz, pela política de cobrança
// GRAVADA NO AGENDAMENTO na reserva (`Appointment.payment_policy`):
//
//   PRESENCIAL:  PENDENTE ──parceiro──▶ CONFIRMADO ──parceiro──▶ CONCLUIDO
//   PRE_PAGO:    PENDENTE ──pagamento──▶ AGUARDANDO_CONFIRMACAO ──parceiro──▶ CONFIRMADO ──▶ CONCLUIDO
//
// AGUARDANDO_CONFIRMACAO = "pago, aguardando a confirmação do parceiro". Só o
// pagamento aprovado (PAG-2) leva a esse estado — nunca a rota de status.
//
// Saídas: RECUSADO (parceiro nega) e CANCELADO (tutor ou parceiro desiste antes
// do início), ambos terminais. Estorno de agendamento pago é da PAG-2.

const { PAYMENT_POLICY, normalizePaymentPolicy } = require('./paymentPolicy');

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

/** Status que ainda ocupam a agenda (contam para conflito de horário). */
const ACTIVE_APPOINTMENT_STATUSES = Object.freeze([
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.AWAITING_CONFIRMATION,
  APPOINTMENT_STATUS.CONFIRMED,
]);

/** Status que tutor e parceiro podem pedir pela rota PATCH /appointments/:id/status. */
const MANUAL_TARGET_STATUSES = Object.freeze([
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.REJECTED,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.CANCELLED,
]);

/** Quem provoca a transição. PAYMENT = pagamento aprovado (PAG-2). */
const APPOINTMENT_ACTOR = Object.freeze({
  TUTOR: 'TUTOR',
  PROVIDER: 'PROVIDER',
  PAYMENT: 'PAYMENT',
});

const { TUTOR, PROVIDER, PAYMENT } = APPOINTMENT_ACTOR;
const S = APPOINTMENT_STATUS;

// Recusa por política (PRE_PAGO ainda não pago tentando ser confirmado/recusado).
const PAYMENT_REQUIRED = Object.freeze({
  reason: 'PAYMENT_REQUIRED',
  message: 'Agendamento pré-pago só pode ser confirmado ou recusado depois do pagamento.',
});

/**
 * Regras de transição (DEC-A). `policies` restringe à política gravada no
 * agendamento (`policyError` diz o motivo da recusa); `beforeStart`/`afterStart`
 * comparam com o horário de início.
 */
const APPOINTMENT_TRANSITION_RULES = Object.freeze([
  { from: S.PENDING, to: S.CONFIRMED, actors: [PROVIDER], policies: [PAYMENT_POLICY.ON_SITE], policyError: PAYMENT_REQUIRED },
  { from: S.PENDING, to: S.REJECTED, actors: [PROVIDER], policies: [PAYMENT_POLICY.ON_SITE], policyError: PAYMENT_REQUIRED },
  {
    from: S.PENDING,
    to: S.AWAITING_CONFIRMATION,
    actors: [PAYMENT],
    policies: [PAYMENT_POLICY.PREPAID],
    policyError: {
      reason: 'INVALID_TRANSITION',
      message: 'Agendamento com pagamento presencial não passa por AGUARDANDO_CONFIRMACAO.',
    },
  },
  { from: S.PENDING, to: S.CANCELLED, actors: [TUTOR], beforeStart: true },
  { from: S.AWAITING_CONFIRMATION, to: S.CONFIRMED, actors: [PROVIDER] },
  { from: S.AWAITING_CONFIRMATION, to: S.REJECTED, actors: [PROVIDER] },
  { from: S.AWAITING_CONFIRMATION, to: S.CANCELLED, actors: [TUTOR], beforeStart: true },
  { from: S.CONFIRMED, to: S.COMPLETED, actors: [PROVIDER], afterStart: true },
  { from: S.CONFIRMED, to: S.CANCELLED, actors: [TUTOR, PROVIDER], beforeStart: true },
]);

/** Destinos possíveis a partir de cada status (sem considerar ator, política e horário). */
const ALLOWED_APPOINTMENT_TRANSITIONS = Object.freeze(
  APPOINTMENT_STATUS_VALUES.reduce((map, status) => {
    map[status] = APPOINTMENT_TRANSITION_RULES.filter((r) => r.from === status).map((r) => r.to);
    return map;
  }, {})
);

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
 * Decide se `actor` pode levar o agendamento de `from` para `to`.
 *
 * Devolve `{ allowed: true }` ou `{ allowed: false, reason, message }`, com
 * `reason` entre: INVALID_TRANSITION, FORBIDDEN_ACTOR, PAYMENT_REQUIRED,
 * ALREADY_STARTED (cancelar depois do início) e NOT_STARTED (concluir antes).
 * Checa nessa ordem: transição existe, ator, política, horário.
 *
 * @param {object} params
 * @param {string} params.from      status atual
 * @param {string} params.to        status pedido
 * @param {string} params.actor     APPOINTMENT_ACTOR
 * @param {string} params.policy    política gravada no agendamento
 * @param {Date}   params.now
 * @param {Date|string} params.startTime
 */
function canTransition({ from, to, actor, policy, now, startTime }) {
  const rule = APPOINTMENT_TRANSITION_RULES.find((r) => r.from === from && r.to === to);
  if (!rule) {
    return {
      allowed: false,
      reason: 'INVALID_TRANSITION',
      message: `Transição inválida: "${from}" → "${to}".`,
    };
  }

  if (!rule.actors.includes(actor)) {
    return {
      allowed: false,
      reason: 'FORBIDDEN_ACTOR',
      message: `Você não pode alterar este agendamento para "${to}".`,
    };
  }

  if (rule.policies && !rule.policies.includes(normalizePaymentPolicy(policy))) {
    return { allowed: false, ...rule.policyError };
  }

  const start = startTime instanceof Date ? startTime : new Date(startTime);
  if (rule.beforeStart && now >= start) {
    return {
      allowed: false,
      reason: 'ALREADY_STARTED',
      message: 'O atendimento já começou: não é mais possível cancelar.',
    };
  }
  if (rule.afterStart && now < start) {
    return {
      allowed: false,
      reason: 'NOT_STARTED',
      message: 'O atendimento só pode ser concluído depois do horário de início.',
    };
  }

  return { allowed: true };
}

function isAppointmentTerminalStatus(status) {
  const transitions = ALLOWED_APPOINTMENT_TRANSITIONS[status];
  return Array.isArray(transitions) && transitions.length === 0;
}

module.exports = {
  APPOINTMENT_STATUS,
  INITIAL_APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_VALUES,
  ACTIVE_APPOINTMENT_STATUSES,
  MANUAL_TARGET_STATUSES,
  APPOINTMENT_ACTOR,
  APPOINTMENT_TRANSITION_RULES,
  ALLOWED_APPOINTMENT_TRANSITIONS,
  APPOINTMENT_STATUS_ALIASES,
  PAYMENT_POLICY,
  normalizeAppointmentStatus,
  isValidAppointmentStatus,
  canTransition,
  isAppointmentTerminalStatus,
};
