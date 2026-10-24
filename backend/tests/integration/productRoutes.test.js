process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// Gate de produto (E-01 / PRD-2): só LOJISTA aprovado e com conta ativa cria,
// edita ou exclui produto; a vitrine e o detalhe público só mostram produto de
// lojista operacional. Cadeia real do Express com Prisma e repositório stubados.
// ─────────────────────────────────────────────────────────────────────────────

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signTestToken } = require('../helpers/authState');

const prisma = require('../../src/config/database');
const ProductRepository = require('../../src/repositories/ProductRepository');
const app = require('../../src/app');

const STORE_USER_ID = '10000000-0000-4000-8000-000000000001';
const STORE_PROVIDER_ID = '20000000-0000-4000-8000-000000000001';
const OTHER_PROVIDER_ID = '20000000-0000-4000-8000-000000000002';
const PRODUCT_ID = '30000000-0000-4000-8000-000000000001';

const restores = [];
function stub(target, method, impl) {
  const original = target[method];
  target[method] = impl;
  restores.push(() => {
    target[method] = original;
  });
}

let createdWith;
let updatedWith;
let storeProvider;

beforeEach(() => {
  createdWith = undefined;
  updatedWith = undefined;
  storeProvider = {
    id: STORE_PROVIDER_ID,
    status: 'APROVADO',
    user: { role_id: 2, is_active: true, sitter_evaluations: [] },
  };

  stub(prisma.provider, 'findUnique', async () => storeProvider);
  stub(ProductRepository, 'create', async (data) => {
    createdWith = data;
    return { id: PRODUCT_ID, ...data };
  });
  stub(ProductRepository, 'findById', async () => ({
    id: PRODUCT_ID,
    provider_id: STORE_PROVIDER_ID,
    name: 'Ração',
    price: 50,
  }));
  stub(ProductRepository, 'update', async (_id, data) => {
    updatedWith = data;
    return { id: PRODUCT_ID, ...data };
  });
});

afterEach(() => {
  while (restores.length > 0) restores.pop()();
});

const storeToken = (overrides = {}) =>
  signTestToken({ id: STORE_USER_ID, role_id: 2, provider_status: 'APROVADO', ...overrides });

const validProduct = { name: 'Ração Premium', price: 89.9, stock_quantity: 10, category: 'Alimentação', pet_type: 'Cães' };

// ── POST /products ────────────────────────────────────────────────────────────

test('POST /products: lojista aprovado e ativo cria produto com preço numérico', async () => {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${storeToken()}`)
    .send({ ...validProduct, price: 'R$ 89,90' });

  assert.equal(res.status, 201);
  assert.equal(createdWith.provider_id, STORE_PROVIDER_ID);
  assert.equal(createdWith.price, 89.9);
  assert.equal(createdWith.status, 'ACTIVE');
});

test('POST /products: tutor, hotel e pet sitter → 403', async () => {
  for (const roleId of [5, 3, 4]) {
    const token = signTestToken({ id: `user-role-${roleId}`, role_id: roleId });
    const res = await request(app).post('/api/v1/products').set('Authorization', `Bearer ${token}`).send(validProduct);

    assert.equal(res.status, 403, `role_id ${roleId} não pode criar produto`);
  }
  assert.equal(createdWith, undefined);
});

test('POST /products: lojista com cadastro pendente → 403 PROVIDER_NOT_OPERATIONAL', async () => {
  storeProvider = { ...storeProvider, status: 'PENDENTE' };

  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${storeToken({ provider_status: 'PENDENTE' })}`)
    .send(validProduct);

  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'PROVIDER_NOT_OPERATIONAL');
  assert.equal(createdWith, undefined);
});

test('POST /products: lojista recusado → 403 PROVIDER_REJECTED (sessão restrita)', async () => {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${storeToken({ provider_status: 'REJEITADO' })}`)
    .send(validProduct);

  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'PROVIDER_REJECTED');
  assert.equal(createdWith, undefined);
});

test('POST /products: lojista com conta desativada → 401 ACCOUNT_DISABLED', async () => {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${storeToken({ is_active: false })}`)
    .send(validProduct);

  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'ACCOUNT_DISABLED');
});

test('POST /products: corpo inválido → 422 sem gravar', async () => {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${storeToken()}`)
    .send({ name: '', price: 'abc', stock_quantity: -1 });

  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.equal(createdWith, undefined);
});

// ── PUT /products/:id ─────────────────────────────────────────────────────────

test('PUT /products/:id: dono atualiza só os campos enviados', async () => {
  const res = await request(app)
    .put(`/api/v1/products/${PRODUCT_ID}`)
    .set('Authorization', `Bearer ${storeToken()}`)
    .send({ price: 99.5, provider_id: OTHER_PROVIDER_ID });

  assert.equal(res.status, 200);
  assert.equal(updatedWith.price, 99.5);
  assert.equal(updatedWith.name, undefined);
  // provider_id não é campo editável: chave desconhecida é descartada.
  assert.equal(updatedWith.provider_id, undefined);
});

test('PUT /products/:id: produto de outro lojista → 403', async () => {
  stub(ProductRepository, 'findById', async () => ({ id: PRODUCT_ID, provider_id: OTHER_PROVIDER_ID }));

  const res = await request(app)
    .put(`/api/v1/products/${PRODUCT_ID}`)
    .set('Authorization', `Bearer ${storeToken()}`)
    .send({ price: 10 });

  assert.equal(res.status, 403);
  assert.equal(updatedWith, undefined);
});

test('PUT /products/:id: produto inexistente → 404 (antes virava 500)', async () => {
  stub(ProductRepository, 'findById', async () => null);

  const res = await request(app)
    .put(`/api/v1/products/${PRODUCT_ID}`)
    .set('Authorization', `Bearer ${storeToken()}`)
    .send({ price: 10 });

  assert.equal(res.status, 404);
});

test('PUT /products/:id: id inválido → 422', async () => {
  const res = await request(app)
    .put('/api/v1/products/nao-e-uuid')
    .set('Authorization', `Bearer ${storeToken()}`)
    .send({ price: 10 });

  assert.equal(res.status, 422);
});

// ── Vitrine e detalhe público ─────────────────────────────────────────────────

test('GET /products: vitrine filtra lojista aprovado, ativo e com papel de lojista', async () => {
  let listQuery;
  stub(prisma.product, 'count', async () => 0);
  stub(prisma.product, 'findMany', async (args) => {
    listQuery = args;
    return [];
  });

  const res = await request(app).get('/api/v1/products');

  assert.equal(res.status, 200);
  assert.equal(listQuery.where.status, 'ACTIVE');
  assert.equal(listQuery.where.provider.status, 'APROVADO');
  assert.ok(listQuery.where.provider.user.AND.some((c) => c.role_id === 2));
});

test('GET /products/:id: produto de lojista fora da vitrine → 404', async () => {
  let detailQuery;
  stub(prisma.product, 'findFirst', async (args) => {
    detailQuery = args;
    return null;
  });

  const res = await request(app).get(`/api/v1/products/${PRODUCT_ID}`);

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
  assert.equal(detailQuery.where.provider.status, 'APROVADO');
});

test('GET /products/:id: id inválido → 422', async () => {
  const res = await request(app).get('/api/v1/products/nao-e-uuid');

  assert.equal(res.status, 422);
});
