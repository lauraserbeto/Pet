process.env.LOG_LEVEL = 'silent'; // silencia logs de requisição durante os testes
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');

test('GET /api/metrics retorna RED por rota (não depende do banco)', async () => {
  // Gera uma métrica com uma rota que não toca o banco (404).
  await request(app).get('/api/v1/rota-inexistente');

  const res = await request(app).get('/api/metrics');
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.uptime_s, 'number');
  assert.ok(res.body.routes && typeof res.body.routes === 'object');
  assert.ok(Object.keys(res.body.routes).length >= 1, 'deve registrar ao menos uma rota');
});
