const { test } = require('node:test');
const assert = require('node:assert/strict');
const { metricsWindow, dayKey, revenueSeries, appointmentPayments, paidOrdersWhere } = require('../../src/utils/commerceMetrics');

test('DSH: janela civil de São Paulo independe do TZ do processo, inclusive virada UTC', () => {
  const now = new Date('2026-11-19T01:30:00Z'); // 18/11 em São Paulo
  const range = metricsWindow(2, now);
  assert.deepEqual(range.keys, ['2026-11-17', '2026-11-18']);
  assert.equal(range.since.toISOString(), '2026-11-17T03:00:00.000Z');
  assert.equal(dayKey('2026-11-19T02:59:59Z'), '2026-11-18');
  assert.equal(dayKey('2026-11-19T03:00:00Z'), '2026-11-19');
});
test('DSH: série soma centavos no mesmo dia, preenche zero e não mistura dia UTC', () => {
  const rows = [
    { created_at: new Date('2026-11-18T23:00:00Z'), _sum: { total_price: '0.10' } },
    { created_at: new Date('2026-11-19T01:00:00Z'), _sum: { total_price: '0.20' } },
    { created_at: new Date('2026-11-10T00:00:00Z'), _sum: { total_price: '500' } },
  ];
  assert.deepEqual(revenueSeries(rows, ['2026-11-17', '2026-11-18']), [{ date: '2026-11-17', amount: 0 }, { date: '2026-11-18', amount: 0.3 }]);
});
test('DSH: estorno de pagamento anterior tem data própria e pode resultar em saldo negativo', () => {
  const range = metricsWindow(1, new Date('2026-11-19T18:00:00Z'));
  const result = appointmentPayments([
    { status: 'REFUNDED', amount: '50.10', paid_at: '2026-11-17T18:00:00Z', refunded_at: '2026-11-19T10:00:00Z' },
    { status: 'APPROVED', amount: '10.10', paid_at: '2026-11-19T09:00:00Z' },
    { status: 'PENDING', amount: '999', paid_at: '2026-11-19T09:00:00Z' },
  ], range);
  assert.deepEqual(result, { gross_amount: 10.1, refunded_amount: 50.1, net_amount: -40, paid_count: 1, refunded_count: 1, mode: 'SIMULATED' });
});
test('DSH: reconhecimento preserva escopo e inclui todos os estados posteriores ao pagamento', () => {
  const where = paidOrdersWhere({ provider_id: 'own', created_at: { gte: 'start' } });
  assert.equal(where.provider_id, 'own');
  assert.deepEqual(where.status.in, ['PAGO', 'PREPARANDO', 'ENVIADO', 'CONCLUIDO']);
  assert.deepEqual(where.OR, [{ payment_attempt: { is: null } }, { payment_attempt: { is: { status: 'APPROVED' } } }]);
});
