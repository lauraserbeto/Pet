const { ORDER_STATUS } = require('../constants/orderStatus');

const TIME_ZONE = 'America/Sao_Paulo';
const PAID_ORDER_STATUSES = [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.SHIPPED, ORDER_STATUS.COMPLETED];
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
function dayKey(date) {
  const parts = Object.fromEntries(dayFormatter.formatToParts(new Date(date)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function metricsWindow(days, now = new Date()) {
  const today = dayKey(now);
  const keys = Array.from({ length: days }, (_, i) => new Date(Date.parse(`${today}T12:00:00Z`) - (days - 1 - i) * 86400000).toISOString().slice(0, 10));
  // Contrato atual: dias civis de São Paulo. Intl fornece o offset da data,
  // independentemente do TZ do processo que executa a API.
  const offset = new Intl.DateTimeFormat('en', { timeZone: TIME_ZONE, timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${keys[0]}T12:00:00Z`)).find(p => p.type === 'timeZoneName').value.replace('GMT', '') || '+00:00';
  return { keys, since: new Date(`${keys[0]}T00:00:00${offset}`), until: now, time_zone: TIME_ZONE };
}
function paidOrdersWhere(base) {
  return { ...base, status: { in: PAID_ORDER_STATUSES }, OR: [
    { payment_attempt: { is: null } }, { payment_attempt: { is: { status: 'APPROVED' } } },
  ] };
}
const cents = value => Math.round(Number(value || 0) * 100);
const amount = value => value / 100;
function revenueSeries(groups, keys) {
  const buckets = new Map(keys.map(date => [date, 0]));
  for (const row of groups) {
    const key = dayKey(row.created_at);
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + cents(row._sum.total_price));
  }
  return Array.from(buckets, ([date, total]) => ({ date, amount: amount(total) }));
}
function appointmentPayments(rows, window) {
  let gross = 0, refunded = 0, paidCount = 0, refundCount = 0;
  const inRange = raw => raw && new Date(raw) >= window.since && new Date(raw) <= window.until;
  for (const row of rows) {
    if (!['APPROVED', 'REFUNDED'].includes(row.status)) continue;
    if (inRange(row.paid_at)) { gross += cents(row.amount); paidCount += 1; }
    if (row.status === 'REFUNDED' && inRange(row.refunded_at)) { refunded += cents(row.amount); refundCount += 1; }
  }
  return { gross_amount: amount(gross), refunded_amount: amount(refunded), net_amount: amount(gross - refunded), paid_count: paidCount, refunded_count: refundCount, mode: 'SIMULATED' };
}
module.exports = { TIME_ZONE, PAID_ORDER_STATUSES, dayKey, metricsWindow, paidOrdersWhere, revenueSeries, appointmentPayments, cents, amount };
