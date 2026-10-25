process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// Limite de corpo e validação de imagens (E-03 / AUD-03). Cadeia real do
// Express (parser → auth → validate → controller) com o Prisma stubado.
// ─────────────────────────────────────────────────────────────────────────────

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signTestToken } = require('../helpers/authState');

const prisma = require('../../src/config/database');
const ProductRepository = require('../../src/repositories/ProductRepository');
const app = require('../../src/app');
const { IMAGE_MAX_BYTES } = require('../../src/schemas/imageSchemas');

const TUTOR_ID = '10000000-0000-4000-8000-0000000000a1';
const STORE_USER_ID = '10000000-0000-4000-8000-0000000000a2';
const HOTEL_USER_ID = '10000000-0000-4000-8000-0000000000a3';
const SITTER_USER_ID = '10000000-0000-4000-8000-0000000000a4';

const tutorToken = signTestToken({ id: TUTOR_ID, role_id: 5 });
const storeToken = signTestToken({ id: STORE_USER_ID, role_id: 2, provider_status: 'APROVADO' });
const hotelToken = signTestToken({ id: HOTEL_USER_ID, role_id: 3, provider_status: 'APROVADO' });
const sitterToken = signTestToken({ id: SITTER_USER_ID, role_id: 4 });

const dataUrl = (type, bytes) => `data:image/${type};base64,${Buffer.alloc(bytes, 7).toString('base64')}`;
const smallPng = dataUrl('png', 64);

const restores = [];
function stub(target, method, impl) {
  const original = target[method];
  target[method] = impl;
  restores.push(() => {
    target[method] = original;
  });
}

let dbCalls;

beforeEach(() => {
  dbCalls = [];
  const record = (name, result) => async (args) => {
    dbCalls.push({ name, args });
    return typeof result === 'function' ? result(args) : result;
  };

  stub(prisma.user, 'findUnique', record('user.findUnique', null));
  stub(prisma.user, 'update', record('user.update', ({ data }) => ({ id: 'u', ...data })));
  stub(prisma.provider, 'findUnique', record('provider.findUnique', {
    id: 'store-provider',
    status: 'APROVADO',
    user: { role_id: 2, is_active: true, sitter_evaluations: [] },
  }));
  stub(prisma.provider, 'update', record('provider.update', ({ data }) => ({ id: 'p', ...data })));
  stub(prisma.sitterEvaluation, 'create', record('sitterEvaluation.create', ({ data }) => ({ id: 'e', ...data })));
  stub(prisma, '$transaction', async (ops) => Promise.all(ops));
  stub(ProductRepository, 'create', record('product.create', (data) => ({ id: 'prod', ...data })));
});

afterEach(() => {
  while (restores.length > 0) restores.pop()();
});

// ── Limite padrão (100 kb) e erros do parser ─────────────────────────────────

test('JSON acima de 100 kb no login → 413 antes de qualquer consulta', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'a@a.com', password: 'x'.repeat(110 * 1024) });

  assert.equal(res.status, 413);
  assert.equal(res.body.error.code, 'PAYLOAD_TOO_LARGE');
  assert.match(res.body.message, /100 KB/);
  assert.equal(dbCalls.length, 0);
});

test('corpo grande em rota autenticada → 413 mesmo sem token (o parser vem antes da autenticação)', async () => {
  const res = await request(app)
    .put('/api/v1/users/me')
    .send({ full_name: 'x'.repeat(110 * 1024) });

  assert.equal(res.status, 413);
});

test('JSON malformado → 400 INVALID_JSON (antes respondia 500)', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email": "a@a.com",');

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'INVALID_JSON');
});

// ── Avatar (POST /users/me/avatar) ───────────────────────────────────────────

test('avatar de 2 MB passa pelo limite próprio da rota (acima dos 100 kb padrão)', async () => {
  const res = await request(app)
    .post('/api/v1/users/me/avatar')
    .set('Authorization', `Bearer ${tutorToken}`)
    .send({ image: dataUrl('jpeg', IMAGE_MAX_BYTES) });

  assert.equal(res.status, 200, JSON.stringify(res.body).slice(0, 200));
  assert.ok(dbCalls.some((c) => c.name === 'user.update'));
});

test('avatar acima do limite da rota → 413', async () => {
  const res = await request(app)
    .post('/api/v1/users/me/avatar')
    .set('Authorization', `Bearer ${tutorToken}`)
    .send({ image: dataUrl('png', Math.round(2.5 * 1024 * 1024)) });

  assert.equal(res.status, 413);
  assert.equal(res.body.error.code, 'PAYLOAD_TOO_LARGE');
});

test('avatar acima de 2 MB mas dentro do limite do corpo → 422', async () => {
  const res = await request(app)
    .post('/api/v1/users/me/avatar')
    .set('Authorization', `Bearer ${tutorToken}`)
    .send({ image: dataUrl('png', IMAGE_MAX_BYTES + 1) });

  assert.equal(res.status, 422);
  assert.match(res.body.error.details[0].message, /2 MB/);
});

test('avatar com tipo não permitido (GIF, SVG) → 422', async () => {
  for (const image of [dataUrl('gif', 64), 'data:image/svg+xml;base64,PHN2Zz4=']) {
    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ image });
    assert.equal(res.status, 422, image.slice(0, 30));
  }
});

// ── PUT /users/me: avatar_url só https ───────────────────────────────────────

test('PUT /users/me recusa avatar_url javascript: ou data: (422)', async () => {
  for (const avatar_url of ['javascript:alert(1)', smallPng]) {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ avatar_url });
    assert.equal(res.status, 422, avatar_url.slice(0, 20));
  }
});

// ── Perfil público (PUT /providers/profile) ──────────────────────────────────

test('perfil público: galeria com 9 fotos → 422', async () => {
  const res = await request(app)
    .put('/api/v1/providers/profile')
    .set('Authorization', `Bearer ${hotelToken}`)
    .send({ gallery_images: Array(9).fill(smallPng) });

  assert.equal(res.status, 422);
  assert.ok(!dbCalls.some((c) => c.name === 'provider.update'));
});

test('perfil público: foto da galeria com tipo não permitido → 422', async () => {
  const res = await request(app)
    .put('/api/v1/providers/profile')
    .set('Authorization', `Bearer ${hotelToken}`)
    .send({ gallery_images: [smallPng, dataUrl('gif', 64)] });

  assert.equal(res.status, 422);
});

test('perfil público: avatar + galeria completa de 2 MB cada cabem no limite da rota', async () => {
  const big = dataUrl('webp', IMAGE_MAX_BYTES);
  const res = await request(app)
    .put('/api/v1/providers/profile')
    .set('Authorization', `Bearer ${hotelToken}`)
    .send({ avatar_url: big, gallery_images: Array(8).fill(big), description: 'Hotel' });

  assert.equal(res.status, 200, JSON.stringify(res.body).slice(0, 200));
});

test('perfil público: chaves desconhecidas são descartadas antes do use case', async () => {
  const res = await request(app)
    .put('/api/v1/providers/profile')
    .set('Authorization', `Bearer ${hotelToken}`)
    .send({ business_name: 'Ignorado', status: 'APROVADO', city: 'Campinas', gallery_images: [smallPng] });

  assert.equal(res.status, 200);
  const update = dbCalls.find((c) => c.name === 'provider.update');
  assert.deepEqual(Object.keys(update.args.data).sort(), ['city', 'gallery_images']);
});

// ── Produto (POST /products) ─────────────────────────────────────────────────

test('produto com imagem válida de 2 MB → 201', async () => {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${storeToken}`)
    .send({ name: 'Ração', price: 49.9, stock_quantity: 3, image_url: dataUrl('png', IMAGE_MAX_BYTES) });

  assert.equal(res.status, 201, JSON.stringify(res.body).slice(0, 200));
});

test('produto com imagem acima de 2 MB → 422', async () => {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${storeToken}`)
    .send({ name: 'Ração', price: 49.9, image_url: dataUrl('png', IMAGE_MAX_BYTES + 1) });

  assert.equal(res.status, 422);
});

// ── Avaliação do Pet Sitter (POST /users/me/evaluations) ─────────────────────

const evaluation = (photos) => ({
  experience_details: { experience: 'Cuido de cães há 5 anos', medicines: 'Sim', elderly: 'Sim' },
  environment_photos: photos,
  quiz_answers: { q1: 'a', q2: 'b', q3: 'c' },
});

test('avaliação com 7 fotos → 422', async () => {
  const res = await request(app)
    .post('/api/v1/users/me/evaluations')
    .set('Authorization', `Bearer ${sitterToken}`)
    .send(evaluation(Array(7).fill(smallPng)));

  assert.equal(res.status, 422);
  assert.ok(!dbCalls.some((c) => c.name === 'sitterEvaluation.create'));
});

test('avaliação com 6 fotos de 2 MB → 201', async () => {
  const res = await request(app)
    .post('/api/v1/users/me/evaluations')
    .set('Authorization', `Bearer ${sitterToken}`)
    .send(evaluation(Array(6).fill(dataUrl('jpeg', IMAGE_MAX_BYTES))));

  assert.equal(res.status, 201, JSON.stringify(res.body).slice(0, 200));
});
