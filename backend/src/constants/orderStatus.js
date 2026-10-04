// Espelha o padrão de providerStatus.js — centraliza todas as constantes e helpers de status de pedido.
// O campo `Order.status` é um VarChar livre (não é enum no schema).

const ORDER_STATUS = {
  AWAITING_PAYMENT: 'AGUARDANDO_PAGAMENTO',
  PAID: 'PAGO',
  PREPARING: 'PREPARANDO',
  SHIPPED: 'ENVIADO',
  COMPLETED: 'CONCLUIDO',
  CANCELLED: 'CANCELADO',
};

/** Status inicial de todo pedido criado. */
const INITIAL_ORDER_STATUS = ORDER_STATUS.AWAITING_PAYMENT;
const PAYABLE_ORDER_STATUSES = Object.freeze([ORDER_STATUS.AWAITING_PAYMENT]);

const PAYMENT_PROVIDER = {
  SIMULATED: 'SIMULATED',
};

const PAYMENT_STATUS = {
  APPROVED: 'APPROVED',
};

function isPayableOrderStatus(status) {
  return PAYABLE_ORDER_STATUSES.includes(status);
}

function isPaidOrderStatus(status) {
  return status === ORDER_STATUS.PAID;
}

/**
 * Máquina de transições permitidas.
 * Chave: status atual do pedido.
 * Valor: array de próximos status válidos.
 */
const ALLOWED_ORDER_TRANSITIONS = {
  [ORDER_STATUS.AWAITING_PAYMENT]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.PREPARING, ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

/**
 * Mapa de sinônimos/legados em inglês para os valores canônicos em português.
 * Garante compatibilidade retroativa e interoperabilidade com frontends antigos.
 */
const ORDER_STATUS_ALIASES = {
  AGUARDANDO_PAGAMENTO: ORDER_STATUS.AWAITING_PAYMENT,
  AWAITING_PAYMENT: ORDER_STATUS.AWAITING_PAYMENT,
  PENDING: ORDER_STATUS.AWAITING_PAYMENT,
  PAGO: ORDER_STATUS.PAID,
  PAID: ORDER_STATUS.PAID,
  PREPARANDO: ORDER_STATUS.PREPARING,
  PREPARING: ORDER_STATUS.PREPARING,
  ENVIADO: ORDER_STATUS.SHIPPED,
  SHIPPED: ORDER_STATUS.SHIPPED,
  CONCLUIDO: ORDER_STATUS.COMPLETED,
  COMPLETED: ORDER_STATUS.COMPLETED,
  DELIVERED: ORDER_STATUS.COMPLETED,
  CANCELADO: ORDER_STATUS.CANCELLED,
  CANCELLED: ORDER_STATUS.CANCELLED,
  CANCELED: ORDER_STATUS.CANCELLED,
};

/**
 * Normaliza um status recebido (string) para o valor canônico.
 * Aceita sinônimos em inglês e variações de caixa.
 * @param {string} status
 * @returns {string|null} valor canônico ou null se não reconhecido
 */
function normalizeOrderStatus(status) {
  if (!status || typeof status !== 'string') return null;
  return ORDER_STATUS_ALIASES[status.trim().toUpperCase()] ?? null;
}

/**
 * Verifica se um valor é um status de pedido válido (canônico).
 * @param {string} status
 * @returns {boolean}
 */
function isValidOrderStatus(status) {
  return Object.values(ORDER_STATUS).includes(status);
}

/**
 * Valida se a transição entre o status atual e o próximo é permitida pela máquina de estados.
 * @param {string} currentStatus  Status atual do pedido (valor canônico)
 * @param {string} nextStatus     Próximo status desejado (valor canônico)
 * @returns {boolean}
 */
function isValidOrderTransition(currentStatus, nextStatus) {
  const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus];
  if (!Array.isArray(allowed)) return false;
  return allowed.includes(nextStatus);
}

/**
 * Indica se o status é terminal (não admite mais transições).
 * @param {string} status
 * @returns {boolean}
 */
function isOrderTerminalStatus(status) {
  const transitions = ALLOWED_ORDER_TRANSITIONS[status];
  return Array.isArray(transitions) && transitions.length === 0;
}

module.exports = {
  ORDER_STATUS,
  INITIAL_ORDER_STATUS,
  PAYABLE_ORDER_STATUSES,
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
  isPayableOrderStatus,
  isPaidOrderStatus,
  ALLOWED_ORDER_TRANSITIONS,
  ORDER_STATUS_ALIASES,
  normalizeOrderStatus,
  isValidOrderStatus,
  isValidOrderTransition,
  isOrderTerminalStatus,
};
