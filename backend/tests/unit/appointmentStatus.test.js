process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  APPOINTMENT_STATUS: S,
  APPOINTMENT_ACTOR: A,
  INITIAL_APPOINTMENT_STATUS,
  ACTIVE_APPOINTMENT_STATUSES,
  MANUAL_TARGET_STATUSES,
  APPOINTMENT_TRANSITION_RULES,
  ALLOWED_APPOINTMENT_TRANSITIONS,
  normalizeAppointmentStatus,
  isValidAppointmentStatus,
  canTransition,
  isAppointmentTerminalStatus,
} = require('../../src/constants/appointmentStatus');
const { PAYMENT_POLICY } = require('../../src/constants/paymentPolicy');

const PRESENCIAL = PAYMENT_POLICY.ON_SITE;
const PRE_PAGO = PAYMENT_POLICY.PREPAID;

// Atendimento às 14h de 10/11; "antes" e "depois" relativos a ele.
const START = new Date('2026-11-10T14:00:00-03:00');
const BEFORE = new Date('2026-11-09T10:00:00-03:00');
const AFTER = new Date('2026-11-10T15:00:00-03:00');

const decide = (from, to, actor, policy = PRESENCIAL, now = BEFORE) =>
  canTransition({ from, to, actor, policy, now, startTime: START });

const assertAllowed = (decision) => assert.deepEqual(decision, { allowed: true });
const assertDenied = (decision, reason) => {
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, reason);
  assert.ok(decision.message);
};

test('todo agendamento nasce PENDENTE', () => {
  assert.equal(INITIAL_APPOINTMENT_STATUS, S.PENDING);
  assert.equal(S.PENDING, 'PENDENTE');
});

test('normaliza os status legados em inglês do schema antigo', () => {
  assert.equal(normalizeAppointmentStatus('PENDING'), S.PENDING);
  assert.equal(normalizeAppointmentStatus('confirmed'), S.CONFIRMED);
  assert.equal(normalizeAppointmentStatus(' CANCELED '), S.CANCELLED);
  assert.equal(normalizeAppointmentStatus('INVENTADO'), null);
  assert.equal(normalizeAppointmentStatus(null), null);
});

test('isValidAppointmentStatus aceita só os canônicos', () => {
  assert.ok(isValidAppointmentStatus(S.AWAITING_CONFIRMATION));
  assert.ok(!isValidAppointmentStatus('PENDING'));
});

test('ocupam a agenda: PENDENTE, AGUARDANDO_CONFIRMACAO e CONFIRMADO', () => {
  assert.deepEqual([...ACTIVE_APPOINTMENT_STATUSES], [S.PENDING, S.AWAITING_CONFIRMATION, S.CONFIRMED]);
});

// --- PRESENCIAL: o parceiro decide direto ---

test('PRESENCIAL: parceiro confirma ou recusa um PENDENTE', () => {
  assertAllowed(decide(S.PENDING, S.CONFIRMED, A.PROVIDER));
  assertAllowed(decide(S.PENDING, S.REJECTED, A.PROVIDER));
});

test('PRESENCIAL não passa por AGUARDANDO_CONFIRMACAO, nem pelo pagamento', () => {
  assertDenied(decide(S.PENDING, S.AWAITING_CONFIRMATION, A.PAYMENT), 'INVALID_TRANSITION');
});

test('política ausente na reserva é tratada como PRESENCIAL', () => {
  assertAllowed(decide(S.PENDING, S.CONFIRMED, A.PROVIDER, null));
  assertDenied(decide(S.PENDING, S.AWAITING_CONFIRMATION, A.PAYMENT, null), 'INVALID_TRANSITION');
});

// --- PRE_PAGO: só o pagamento tira do PENDENTE ---

test('PRE_PAGO não pago: parceiro não confirma nem recusa', () => {
  assertDenied(decide(S.PENDING, S.CONFIRMED, A.PROVIDER, PRE_PAGO), 'PAYMENT_REQUIRED');
  assertDenied(decide(S.PENDING, S.REJECTED, A.PROVIDER, PRE_PAGO), 'PAYMENT_REQUIRED');
});

test('PRE_PAGO: só o pagamento leva a AGUARDANDO_CONFIRMACAO', () => {
  assertAllowed(decide(S.PENDING, S.AWAITING_CONFIRMATION, A.PAYMENT, PRE_PAGO));
  assertDenied(decide(S.PENDING, S.AWAITING_CONFIRMATION, A.PROVIDER, PRE_PAGO), 'FORBIDDEN_ACTOR');
  assertDenied(decide(S.PENDING, S.AWAITING_CONFIRMATION, A.TUTOR, PRE_PAGO), 'FORBIDDEN_ACTOR');
});

test('nenhuma regra deixa tutor ou parceiro levar a PENDENTE ou AGUARDANDO_CONFIRMACAO', () => {
  for (const rule of APPOINTMENT_TRANSITION_RULES) {
    if (rule.to === S.PENDING || rule.to === S.AWAITING_CONFIRMATION) {
      assert.deepEqual(rule.actors, [A.PAYMENT], `${rule.from} → ${rule.to}`);
    }
  }
  assert.ok(!MANUAL_TARGET_STATUSES.includes(S.PENDING));
  assert.ok(!MANUAL_TARGET_STATUSES.includes(S.AWAITING_CONFIRMATION));
});

test('PRE_PAGO pago: parceiro confirma ou recusa; tutor não', () => {
  assertAllowed(decide(S.AWAITING_CONFIRMATION, S.CONFIRMED, A.PROVIDER, PRE_PAGO));
  assertAllowed(decide(S.AWAITING_CONFIRMATION, S.REJECTED, A.PROVIDER, PRE_PAGO));
  assertDenied(decide(S.AWAITING_CONFIRMATION, S.CONFIRMED, A.TUTOR, PRE_PAGO), 'FORBIDDEN_ACTOR');
});

test('tutor tentando confirmar recebe FORBIDDEN_ACTOR, não PAYMENT_REQUIRED', () => {
  assertDenied(decide(S.PENDING, S.CONFIRMED, A.TUTOR, PRE_PAGO), 'FORBIDDEN_ACTOR');
});

// --- Cancelamento: antes do início ---

test('tutor cancela PENDENTE, AGUARDANDO_CONFIRMACAO ou CONFIRMADO antes do início', () => {
  for (const from of [S.PENDING, S.AWAITING_CONFIRMATION, S.CONFIRMED]) {
    assertAllowed(decide(from, S.CANCELLED, A.TUTOR, PRE_PAGO));
  }
});

test('ninguém cancela depois do início', () => {
  assertDenied(decide(S.CONFIRMED, S.CANCELLED, A.TUTOR, PRESENCIAL, AFTER), 'ALREADY_STARTED');
  assertDenied(decide(S.CONFIRMED, S.CANCELLED, A.PROVIDER, PRESENCIAL, AFTER), 'ALREADY_STARTED');
  assertDenied(decide(S.PENDING, S.CANCELLED, A.TUTOR, PRESENCIAL, START), 'ALREADY_STARTED');
});

test('parceiro cancela só um CONFIRMADO; antes disso ele recusa', () => {
  assertAllowed(decide(S.CONFIRMED, S.CANCELLED, A.PROVIDER));
  assertDenied(decide(S.PENDING, S.CANCELLED, A.PROVIDER), 'FORBIDDEN_ACTOR');
  assertDenied(decide(S.AWAITING_CONFIRMATION, S.CANCELLED, A.PROVIDER, PRE_PAGO), 'FORBIDDEN_ACTOR');
});

// --- Conclusão: só o parceiro, depois do início ---

test('parceiro conclui um CONFIRMADO a partir do horário de início', () => {
  assertAllowed(decide(S.CONFIRMED, S.COMPLETED, A.PROVIDER, PRESENCIAL, AFTER));
  assertAllowed(decide(S.CONFIRMED, S.COMPLETED, A.PROVIDER, PRESENCIAL, START));
});

test('concluir antes do início é recusado', () => {
  assertDenied(decide(S.CONFIRMED, S.COMPLETED, A.PROVIDER), 'NOT_STARTED');
});

test('tutor não conclui', () => {
  assertDenied(decide(S.CONFIRMED, S.COMPLETED, A.TUTOR, PRESENCIAL, AFTER), 'FORBIDDEN_ACTOR');
});

// --- Transições inexistentes ---

test('não dá para pular direto de PENDENTE para CONCLUIDO', () => {
  assertDenied(decide(S.PENDING, S.COMPLETED, A.PROVIDER, PRESENCIAL, AFTER), 'INVALID_TRANSITION');
});

test('recusa só enquanto PENDENTE ou AGUARDANDO_CONFIRMACAO', () => {
  assertDenied(decide(S.CONFIRMED, S.REJECTED, A.PROVIDER), 'INVALID_TRANSITION');
});

test('CONCLUIDO, RECUSADO e CANCELADO são terminais', () => {
  for (const status of [S.COMPLETED, S.REJECTED, S.CANCELLED]) {
    assert.ok(isAppointmentTerminalStatus(status), status);
    assert.deepEqual(ALLOWED_APPOINTMENT_TRANSITIONS[status], []);
    assertDenied(decide(status, S.CANCELLED, A.TUTOR), 'INVALID_TRANSITION');
  }
  assert.ok(!isAppointmentTerminalStatus(S.PENDING));
});

test('status desconhecido não transita para lugar nenhum', () => {
  assertDenied(decide('INVENTADO', S.CONFIRMED, A.PROVIDER), 'INVALID_TRANSITION');
});
