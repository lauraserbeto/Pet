const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bucketProviderStatus, toDayKey, groupByDay, toCountMap } = require('../../src/utils/adminMetrics');

test('bucketProviderStatus considera apenas APROVADO como aprovado', () => {
  assert.equal(bucketProviderStatus('APROVADO'), 'aprovados');
  assert.equal(bucketProviderStatus('ATIVO'), 'pendentes');
  assert.equal(bucketProviderStatus('ACTIVE'), 'pendentes');
});

test('bucketProviderStatus separa recusados e trata o resto como pendente', () => {
  assert.equal(bucketProviderStatus('REJEITADO'), 'recusados');
  assert.equal(bucketProviderStatus('PENDENTE'), 'pendentes');
  assert.equal(bucketProviderStatus('QUALQUER_COISA'), 'pendentes');
  assert.equal(bucketProviderStatus(null), 'pendentes');
});

test('groupByDay preenche todos os dias da janela, inclusive os vazios', () => {
  const now = new Date('2026-07-10T12:00:00');
  const result = groupByDay([], 7, now);
  assert.equal(result.length, 7);
  assert.equal(result[0].date, '2026-07-04');
  assert.equal(result[6].date, '2026-07-10');
  assert.ok(result.every((d) => d.count === 0));
});

test('groupByDay conta múltiplos registros no mesmo dia', () => {
  const now = new Date('2026-07-10T12:00:00');
  const dates = [
    new Date('2026-07-10T08:00:00'),
    new Date('2026-07-10T20:00:00'),
    new Date('2026-07-09T10:00:00'),
  ];
  const result = groupByDay(dates, 7, now);
  assert.equal(result.find((d) => d.date === '2026-07-10').count, 2);
  assert.equal(result.find((d) => d.date === '2026-07-09').count, 1);
});

test('groupByDay ignora datas fora da janela', () => {
  const now = new Date('2026-07-10T12:00:00');
  const result = groupByDay([new Date('2026-01-01T10:00:00')], 7, now);
  assert.equal(result.reduce((sum, d) => sum + d.count, 0), 0);
});

test('toDayKey usa YYYY-MM-DD com zero à esquerda', () => {
  assert.equal(toDayKey(new Date('2026-03-05T23:59:00')), '2026-03-05');
});

test('toCountMap converte groupBy do Prisma em objeto de contagens', () => {
  const rows = [
    { role_id: 1, _count: { _all: 1 } },
    { role_id: 5, _count: { _all: 8 } },
  ];
  const map = toCountMap(rows, 'role_id', (id) => (id === 1 ? 'admin' : 'tutor'));
  assert.deepEqual(map, { admin: 1, tutor: 8 });
});
