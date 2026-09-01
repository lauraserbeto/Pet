process.env.LOG_LEVEL = 'silent';

const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// 1. Mocka o Prisma Client antes de carregar o app para evitar a necessidade de uma conexão real com o banco de dados
const prisma = require('../../src/config/database');

const mockProduct = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  name: 'Test Product',
  price: 10.50,
  status: 'ACTIVE',
  stock_quantity: 10,
  image_url: 'http://example.com/image.jpg',
  provider: { id: 'provider-123', business_name: 'Test Provider' }
};

const mockCart = {
  id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  user_id: 'user-123',
  updated_at: new Date(),
  items: []
};

// Aplica os mocks globalmente no prisma client
prisma.product = {
  findUnique: async () => mockProduct,
  findMany: async () => [mockProduct]
};
prisma.cart = {
  findUnique: async () => mockCart,
  create: async () => mockCart,
  update: async () => mockCart,
};
prisma.cartItem = {
  findUnique: async () => null,
  findFirst: async () => null,
  count: async () => 0,
  create: async () => ({ id: 'item-123', quantity: 1, unit_price_snapshot: 10.50, product: mockProduct }),
  update: async () => ({ id: 'item-123', quantity: 1, unit_price_snapshot: 10.50, product: mockProduct }),
  delete: async () => ({}),
  deleteMany: async () => ({}),
};

// Agora carrega o app
const app = require('../../src/app');

// Função auxiliar para gerar um token com um papel (role) específico
function generateToken(roleId) {
  const payload = { id: 'user-123' };
  if (roleId !== undefined) {
    payload.role_id = roleId;
  }
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret-key-32-chars-long-minimum');
}

// Garante que a variável JWT_SECRET esteja definida para os testes
before(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret-key-32-chars-long-minimum';
  }
});

// --- Casos de teste para addItem ---
test('addItem: ADMIN (1) retorna 403', async () => {
  const token = generateToken(1);
  const res = await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ product_id: mockProduct.id, quantity: 1 });
  assert.equal(res.status, 403);
});

test('addItem: LOJISTA (2) retorna 403', async () => {
  const token = generateToken(2);
  const res = await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ product_id: mockProduct.id, quantity: 1 });
  assert.equal(res.status, 403);
});

test('addItem: HOTEL (3) retorna 403', async () => {
  const token = generateToken(3);
  const res = await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ product_id: mockProduct.id, quantity: 1 });
  assert.equal(res.status, 403);
});

test('addItem: PET_SITTER (4) retorna 403', async () => {
  const token = generateToken(4);
  const res = await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ product_id: mockProduct.id, quantity: 1 });
  assert.equal(res.status, 403);
});

test('addItem: TUTOR (5) retorna sucesso (2xx)', async () => {
  const token = generateToken(5);
  const res = await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ product_id: mockProduct.id, quantity: 1 });
  assert.ok(res.status === 201 || res.status === 200, `Esperado 200 ou 201, obteve ${res.status}`);
});

test('addItem: sem role (requisição anônima com token sem role) retorna sucesso (2xx)', async () => {
  const token = generateToken(undefined);
  const res = await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ product_id: mockProduct.id, quantity: 1 });
  assert.ok(res.status === 201 || res.status === 200, `Esperado 200 ou 201, obteve ${res.status}`);
});


// --- Casos de teste para merge ---
test('merge: ADMIN (1) retorna 403', async () => {
  const token = generateToken(1);
  const res = await request(app)
    .post('/api/v1/cart/merge')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ product_id: mockProduct.id, quantity: 1 }] });
  assert.equal(res.status, 403);
});

test('merge: LOJISTA (2) retorna 403', async () => {
  const token = generateToken(2);
  const res = await request(app)
    .post('/api/v1/cart/merge')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ product_id: mockProduct.id, quantity: 1 }] });
  assert.equal(res.status, 403);
});

test('merge: HOTEL (3) retorna 403', async () => {
  const token = generateToken(3);
  const res = await request(app)
    .post('/api/v1/cart/merge')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ product_id: mockProduct.id, quantity: 1 }] });
  assert.equal(res.status, 403);
});

test('merge: PET_SITTER (4) retorna 403', async () => {
  const token = generateToken(4);
  const res = await request(app)
    .post('/api/v1/cart/merge')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ product_id: mockProduct.id, quantity: 1 }] });
  assert.equal(res.status, 403);
});

test('merge: TUTOR (5) retorna sucesso (2xx)', async () => {
  const token = generateToken(5);
  const res = await request(app)
    .post('/api/v1/cart/merge')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ product_id: mockProduct.id, quantity: 1 }] });
  assert.ok(res.status === 200 || res.status === 201, `Esperado 200 ou 201, obteve ${res.status}`);
});

test('merge: sem role (requisição anônima com token sem role) retorna sucesso (2xx)', async () => {
  const token = generateToken(undefined);
  const res = await request(app)
    .post('/api/v1/cart/merge')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ product_id: mockProduct.id, quantity: 1 }] });
  assert.ok(res.status === 200 || res.status === 201, `Esperado 200 ou 201, obteve ${res.status}`);
});
