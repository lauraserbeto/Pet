process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  APPOINTMENT_STATUS: S,
  INITIAL_APPOINTMENT_STATUS,
  normalizeAppointmentStatus,
  isValidAppointmentStatus,
  isValidAppointmentTransition,
  isAppointmentTerminalStatus,
  nextStatusAfterPartnerAccepts,
} = require('../../src/constants/appointmentStatus');
const { PAYMENT_POLICY } = require('../../src/constants/paymentPolicy');

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

// --- A regra central: AGUARDANDO_CONFIRMACAO é exclusivo de PRE_PAGO ---

test('PRE_PAGO passa por AGUARDANDO_CONFIRMACAO', () => {
  assert.equal(nextStatusAfterPartnerAccepts(PAYMENT_POLICY.PREPAID), S.AWAITING_CONFIRMATION);
  assert.ok(isValidAppointmentTransition(S.PENDING, S.AWAITING_CONFIRMATION, PAYMENT_POLICY.PREPAID));
});

test('PRESENCIAL vai direto a CONFIRMADO e não admite AGUARDANDO_CONFIRMACAO', () => {
  assert.equal(nextStatusAfterPartnerAccepts(PAYMENT_POLICY.ON_SITE), S.CONFIRMED);
  assert.ok(isValidAppointmentTransition(S.PENDING, S.CONFIRMED, PAYMENT_POLICY.ON_SITE));
  assert.ok(!isValidAppointmentTransition(S.PENDING, S.AWAITING_CONFIRMATION, PAYMENT_POLICY.ON_SITE));
});

test('parceiro sem política definida é tratado como PRESENCIAL', () => {
  assert.equal(nextStatusAfterPartnerAccepts(null), S.CONFIRMED);
  assert.ok(!isValidAppointmentTransition(S.PENDING, S.AWAITING_CONFIRMATION, null));
});

// --- Máquina de estados ---

test('fluxo feliz PRE_PAGO: PENDENTE → AGUARDANDO → CONFIRMADO → CONCLUIDO', () => {
  const p = PAYMENT_POLICY.PREPAID;
  assert.ok(isValidAppointmentTransition(S.PENDING, S.AWAITING_CONFIRMATION, p));
  assert.ok(isValidAppointmentTransition(S.AWAITING_CONFIRMATION, S.CONFIRMED, p));
  assert.ok(isValidAppointmentTransition(S.CONFIRMED, S.COMPLETED, p));
});

test('não dá para pular direto de PENDENTE para CONCLUIDO', () => {
  assert.ok(!isValidAppointmentTransition(S.PENDING, S.COMPLETED));
});

test('CONCLUIDO, RECUSADO e CANCELADO são terminais', () => {
  for (const status of [S.COMPLETED, S.REJECTED, S.CANCELLED]) {
    assert.ok(isAppointmentTerminalStatus(status), status);
    assert.ok(!isValidAppointmentTransition(status, S.CONFIRMED));
  }
});

test('recusa só acontece enquanto PENDENTE', () => {
  assert.ok(isValidAppointmentTransition(S.PENDING, S.REJECTED));
  assert.ok(!isValidAppointmentTransition(S.CONFIRMED, S.REJECTED));
});

test('cancelamento é possível até estar CONFIRMADO, mas não depois de CONCLUIDO', () => {
  assert.ok(isValidAppointmentTransition(S.PENDING, S.CANCELLED));
  assert.ok(isValidAppointmentTransition(S.AWAITING_CONFIRMATION, S.CANCELLED));
  assert.ok(isValidAppointmentTransition(S.CONFIRMED, S.CANCELLED));
  assert.ok(!isValidAppointmentTransition(S.COMPLETED, S.CANCELLED));
});

test('status desconhecido não transita para lugar nenhum', () => {
  assert.ok(!isValidAppointmentTransition('INVENTADO', S.CONFIRMED));
});
