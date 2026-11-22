process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const prisma = require('../../src/config/database');
const app = require('../../src/app');
const { getDbIntegrationSkipReason, prepareTestDatabase, resetTestDatabase, disconnectTestDatabase } = require('../helpers/dbIntegration');
const { seedRoles, createAuthenticatedTutor, createStoreWithProduct, createProduct, createApprovedPartner, createPet, createService } = require('../helpers/testSeed');
const skip = getDbIntegrationSkipReason();
let prepared = false;
before(async () => { if (!skip) { await prepareTestDatabase(); prepared = true; } });
beforeEach(async () => { if (!skip) { await resetTestDatabase(); await seedRoles(); } });
after(async () => { if (prepared) await disconnectTestDatabase(); });

async function postReview(token, body, expected = 201) {
  const response = await request(app).post('/api/v1/reviews').set('Authorization', `Bearer ${token}`).send(body);
  assert.equal(response.status, expected, JSON.stringify(response.body));
  return response;
}

async function reviewedProduct() {
  const { provider, product } = await createStoreWithProduct();
  const neutral = await createProduct(provider.id);
  const tutor = await createAuthenticatedTutor();
  async function order(status = 'CONCLUIDO') {
    return prisma.order.create({ data: { provider_id: provider.id, customer_id: tutor.tutor.id, status, total_price: '49.90',
      items: { create: { product_id: product.id, quantity: 1, unit_price: '49.90' } } } });
  }
  for (const rating of [4, 5, 3]) {
    const origin = await order();
    await postReview(tutor.token, { product_id: product.id, order_id: origin.id, rating });
  }
  return { provider, product, neutral, tutor, order };
}

test('AVL-2 DB: produto expõe média 4/contagem 3 na lista, detalhe e perfil da loja; sem reviews retorna null/0', { skip }, async () => {
  const { provider, product, neutral } = await reviewedProduct();
  const list = await request(app).get('/api/v1/products');
  assert.equal(list.status, 200);
  assert.equal(list.body.find(item => item.id === product.id).rating_avg, 4);
  assert.equal(list.body.find(item => item.id === product.id).rating_count, 3);
  assert.equal(list.body.find(item => item.id === neutral.id).rating_avg, null);
  assert.equal(list.body.find(item => item.id === neutral.id).rating_count, 0);
  const detail = await request(app).get(`/api/v1/products/${product.id}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.rating_avg, 4);
  assert.equal(detail.body.rating_count, 3);
  assert.equal(detail.body.provider.document, undefined);
  const store = await request(app).get(`/api/v1/providers/${provider.id}`);
  assert.equal(store.status, 200);
  assert.equal(store.body.products.find(item => item.id === product.id).rating_avg, 4);
});

test('AVL-2 DB: próxima leitura reflete nova review e desconsidera origem não concluída', { skip }, async () => {
  const { product, tutor, order } = await reviewedProduct();
  const pending = await order('AGUARDANDO_PAGAMENTO');
  // Registro legado inconsistente: não deve contaminar a nota pública.
  await prisma.review.create({ data: { author_id: tutor.tutor.id, product_id: product.id, order_id: pending.id, rating: 1 } });
  let detail = await request(app).get(`/api/v1/products/${product.id}`);
  assert.equal(detail.body.rating_avg, 4); assert.equal(detail.body.rating_count, 3);
  const completed = await order();
  await postReview(tutor.token, { product_id: product.id, order_id: completed.id, rating: 5 });
  detail = await request(app).get(`/api/v1/products/${product.id}`);
  assert.equal(detail.body.rating_avg, 4.3); assert.equal(detail.body.rating_count, 4);
});

for (const role of [3, 4]) {
  test(`AVL-2 DB: parceiro role ${role} expõe agregado real em lista/detalhe, com neutro sem reviews`, { skip }, async () => {
    const partner = await createApprovedPartner({ role_id: role });
    const neutral = await createApprovedPartner({ role_id: role });
    for (const provider of [partner.provider, neutral.provider]) {
      await prisma.provider.update({ where: { id: provider.id }, data: {
        description: 'Parceiro QA', phone: '11999990000', city: 'São Paulo', zip_code: '01001000',
        gallery_images: ['https://example.com/qa.jpg'], sitter_roles: ['SITTING'],
      } });
      await createService(provider.id, { category: role === 3 ? 'BOARDING' : 'SITTING' });
    }
    const service = await createService(partner.provider.id, { category: role === 3 ? 'BOARDING' : 'SITTING' });
    for (const rating of [4, 5, 3]) {
      const { tutor, token } = await createAuthenticatedTutor();
      const pet = await createPet(tutor.id);
      const appointment = await prisma.appointment.create({ data: {
        provider_id: partner.provider.id, service_id: service.id, pet_id: pet.id, status: 'CONCLUIDO', payment_policy: 'PRESENCIAL', total_price: '80',
        start_time: new Date('2026-01-10T10:00:00Z'), end_time: new Date('2026-01-11T10:00:00Z'),
      } });
      await postReview(token, { provider_id: partner.provider.id, appointment_id: appointment.id, rating });
    }
    const list = await request(app).get(`/api/v1/providers/${role === 3 ? 'hotels' : 'sitters'}`);
    assert.equal(list.status, 200, JSON.stringify(list.body));
    const item = list.body.find(item => item.id === partner.provider.id);
    assert.ok(item); assert.equal(item.rating_avg, 4); assert.equal(item.rating_count, 3);
    const empty = list.body.find(item => item.id === neutral.provider.id);
    assert.ok(empty); assert.equal(empty.rating_avg, null); assert.equal(empty.rating_count, 0);
    const detail = await request(app).get(`/api/v1/providers/${partner.provider.id}`);
    assert.equal(detail.status, 200); assert.equal(detail.body.rating_avg, 4); assert.equal(detail.body.rating_count, 3);
    assert.equal(detail.body.document, undefined); assert.equal(detail.body.user.password_hash, undefined);
  });
}

test('AVL-1 DB: papel atual diferente de Tutor é recusado mesmo com origem própria concluída', { skip }, async () => {
  const { product, tutor, order } = await reviewedProduct();
  const origin = await order();
  await prisma.user.update({ where: { id: tutor.tutor.id }, data: { role_id: 1 } });
  const token = jwt.sign({ id: tutor.tutor.id, role_id: 1 }, process.env.JWT_SECRET);
  await postReview(token, { product_id: product.id, order_id: origin.id, rating: 5 }, 403);
  assert.equal(await prisma.review.count({ where: { order_id: origin.id } }), 0);
});

test('AVL-1 DB: migration corretiva deixa índices completos e unicidade concorrente preservada', { skip }, async () => {
  const indexes = await prisma.$queryRaw`SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname IN ('reviews_order_id_product_id_key', 'reviews_appointment_id_key')`;
  assert.equal(indexes.length, 2);
  for (const { indexdef } of indexes) assert.ok(!indexdef.includes('WHERE'), indexdef);
  const { product, tutor, order } = await reviewedProduct();
  const origin = await order();
  const results = await Promise.all(Array.from({ length: 6 }, () => request(app).post('/api/v1/reviews').set('Authorization', `Bearer ${tutor.token}`).send({ product_id: product.id, order_id: origin.id, rating: 5 })));
  assert.equal(results.filter(item => item.status === 201).length, 1);
  assert.equal(results.filter(item => item.status === 409).length, 5);
  assert.equal(await prisma.review.count({ where: { order_id: origin.id } }), 1);
});

test('AVL-F DB: distribuição completa, paginação estável e filtros de avaliações válidas', { skip }, async () => {
  const { product, tutor, order } = await reviewedProduct();
  const pending = await order('AGUARDANDO_PAGAMENTO');
  await prisma.review.create({ data: { author_id: tutor.tutor.id, product_id: product.id, order_id: pending.id, rating: 1 } });
  await prisma.review.updateMany({ where: { product_id: product.id }, data: { created_at: new Date('2026-01-01T00:00:00Z') } });
  const summary = await request(app).get(`/api/v1/reviews/summary?product_id=${product.id}`);
  assert.equal(summary.status, 200); assert.equal(summary.body.rating_count, 3); assert.equal(summary.body.rating_avg, 4);
  assert.deepEqual(summary.body.distribution.map(row => row.count), [1, 1, 1, 0, 0]);
  const first = await request(app).get(`/api/v1/reviews?product_id=${product.id}&limit=2&page=1`);
  const second = await request(app).get(`/api/v1/reviews?product_id=${product.id}&limit=2&page=2`);
  assert.equal(first.headers['x-total-count'], '3'); assert.equal(first.headers['x-total-pages'], '2');
  assert.equal(first.body.length, 2); assert.equal(second.body.length, 1);
  assert.equal(new Set([...first.body, ...second.body].map(row => row.id)).size, 3);
});

test('AVL-F DB: avaliação própria sobrevive a reload e não é exposta para outra conta', { skip }, async () => {
  const { product, tutor } = await reviewedProduct();
  const row = await prisma.review.findFirst({ where: { product_id: product.id } });
  const url = `/api/v1/reviews/mine?product_id=${product.id}&order_id=${row.order_id}`;
  const own = await request(app).get(url).set('Authorization', `Bearer ${tutor.token}`);
  assert.equal(own.status, 200); assert.equal(own.body.review.id, row.id);
  const other = await createAuthenticatedTutor();
  const hidden = await request(app).get(url).set('Authorization', `Bearer ${other.token}`);
  assert.equal(hidden.status, 200); assert.equal(hidden.body.review, null);
});
