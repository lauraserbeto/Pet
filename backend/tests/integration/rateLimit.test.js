const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');

// Arquivo separado → o node:test roda em processo isolado, com o contador do
// rate limiter zerado (store em memória). Não interfere nos demais testes.

test('rate limit: a 21ª requisição em /auth/login retorna 429 (PET-04)', async () => {
  let last;
  // Corpo vazio → login responde 400 antes de tocar o banco; o limiter conta
  // todas as requisições e bloqueia a partir da 21ª (limite = 20/janela).
  for (let i = 0; i < 21; i++) {
    last = await request(app).post('/api/v1/auth/login').send({});
  }
  assert.equal(last.status, 429);
  assert.equal(last.body.error.code, 'RATE_LIMITED');
});
