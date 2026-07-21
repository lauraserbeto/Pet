const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');

// Estes testes exercitam a cadeia real do Express (helmet → rate limit →
// validate → controller → errorHandler) apenas nos caminhos de REJEIÇÃO,
// que não tocam o banco de dados — portanto são determinísticos sem DB.

test('POST /register com role_id 1 (ADMIN) → 422 e não cria admin (PET-01)', async () => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ full_name: 'Atacante', email: 'atk@evil.com', password: 'senha123', role_id: 1 });

  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /register sem senha → 422', async () => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ full_name: 'X', email: 'x@x.com', role_id: 5 });

  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /login sem credenciais → 400', async () => {
  const res = await request(app).post('/api/v1/auth/login').send({});
  assert.equal(res.status, 400);
});

test('respostas trazem cabeçalhos de segurança do helmet (PET-04)', async () => {
  const res = await request(app).post('/api/v1/auth/login').send({});
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-powered-by'], undefined); // helmet remove
});

test('rota inexistente → 404 com shape padronizado', async () => {
  const res = await request(app).get('/api/v1/rota-que-nao-existe');
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});
