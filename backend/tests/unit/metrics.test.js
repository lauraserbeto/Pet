const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { record, getMetrics, _reset } = require('../../src/middlewares/metrics');

beforeEach(() => _reset());

test('agrega count, errors e error_rate por rota', () => {
  record('GET /x', 10, false);
  record('GET /x', 20, false);
  record('GET /x', 30, false);
  record('GET /x', 40, true);
  const { routes } = getMetrics();
  assert.equal(routes['GET /x'].count, 4);
  assert.equal(routes['GET /x'].errors, 1);
  assert.equal(routes['GET /x'].error_rate, 0.25);
});

test('calcula percentis e média de latência', () => {
  for (let i = 1; i <= 100; i++) record('GET /y', i, false);
  const l = getMetrics().routes['GET /y'].latency_ms;
  assert.ok(l.p50 >= 45 && l.p50 <= 55, `p50=${l.p50}`);
  assert.ok(l.p95 >= 90 && l.p95 <= 100, `p95=${l.p95}`);
  assert.equal(l.avg, 50.5);
});

test('getMetrics expõe uptime_s numérico', () => {
  assert.equal(typeof getMetrics().uptime_s, 'number');
});
