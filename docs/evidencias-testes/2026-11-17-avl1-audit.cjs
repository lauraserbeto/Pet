// Revisão de ad21e26. Executar somente contra uma cópia temporária da branch
// e o PostgreSQL descartável indicado abaixo; não usa o backend do workspace.
const { createRequire } = require('node:module');
const { resolve, join } = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const backend = resolve(process.argv[2] || '.');
const url = new URL(process.env.DATABASE_URL || 'http://invalid');
if (!backend.includes('petplus-avl1-review-') || process.env.RUN_DB_INTEGRATION_TESTS !== 'true' ||
    url.hostname !== '127.0.0.1' || url.port !== '55442' || url.pathname !== '/petplus_test') {
  throw Error('Exige cópia temporária de revisão e banco descartável explicitamente autorizado.');
}
const load = createRequire(join(backend, 'package.json'));
const request = load('supertest');
const jwt = load('jsonwebtoken');
const prisma = load('./src/config/database');
const app = load('./src/app');
const { prepareTestDatabase, disconnectTestDatabase } = load('./tests/helpers/dbIntegration');
const { seedRoles, createAuthenticatedTutor, createStoreWithProduct, createProduct, createApprovedPartner, createPet, createService } = load('./tests/helpers/testSeed');
const results = [];
async function check(name, body) {
  try { await body(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, message: error.message }); }
}
async function main() {
  await prepareTestDatabase();
  try {
    await seedRoles();
    const { tutor, token } = await createAuthenticatedTutor();
    const { token: otherToken } = await createAuthenticatedTutor();
    const { provider: store, product } = await createStoreWithProduct();
    const second = await createProduct(store.id);
    const order = await prisma.order.create({ data: {
      customer_id: tutor.id, provider_id: store.id, total_price: '99.80', status: 'CONCLUIDO',
      items: { create: [product, second].map(value => ({ product_id: value.id, quantity: 1, unit_price: '49.90' })) },
    } });
    const { provider } = await createApprovedPartner();
    const service = await createService(provider.id);
    const pet = await createPet(tutor.id);
    const createAppointment = (status = 'CONCLUIDO') => prisma.appointment.create({ data: {
      provider_id: provider.id, service_id: service.id, pet_id: pet.id, status,
      payment_policy: 'PRESENCIAL', total_price: '80',
      start_time: new Date('2026-01-10T10:00:00Z'), end_time: new Date('2026-01-11T10:00:00Z'),
    } });
    const post = (body, auth = token) => request(app).post('/api/v1/reviews').set('Authorization', `Bearer ${auth}`).send(body);
    const productBody = { rating: 5, product_id: product.id, order_id: order.id };
    await check('pedido concluído: criação real e autor sem senha/documento', async () => {
      const response = await post(productBody);
      assert.equal(response.status, 201);
      assert.equal(response.body.review.author.password_hash, undefined);
      assert.equal(response.body.review.author.email, undefined);
      assert.equal(response.body.review.author.document, undefined);
      assert.equal(await prisma.review.count({ where: { order_id: order.id } }), 1);
    });
    await check('duplicata do produto/pedido retorna 409', async () => assert.equal((await post(productBody)).status, 409));
    await check('outro produto do mesmo pedido é avaliável', async () => assert.equal((await post({ ...productBody, product_id: second.id })).status, 201));
    await check('outro tutor recebe 403', async () => assert.equal((await post(productBody, otherToken)).status, 403));
    const pending = await createAppointment('PENDENTE');
    await check('agendamento pendente rejeitado', async () => assert.equal((await post({ rating: 4, provider_id: provider.id, appointment_id: pending.id })).status, 422));
    const completed = await createAppointment();
    await check('agendamento concluído: concorrência gera uma avaliação e conflitos 409', async () => {
      const body = { rating: 4, provider_id: provider.id, appointment_id: completed.id };
      const responses = await Promise.all(Array.from({ length: 8 }, () => post(body)));
      assert.equal(responses.filter(value => value.status === 201).length, 1);
      assert.equal(responses.filter(value => value.status === 409).length, 7);
      assert.equal(await prisma.review.count({ where: { appointment_id: completed.id } }), 1);
    });
    await check('alvo incompatível com agendamento rejeitado', async () => assert.equal((await post({ rating: 4, provider_id: store.id, appointment_id: completed.id })).status, 422));
    await check('rating inválido recusado pelo PostgreSQL', async () => {
      const origin = await createAppointment();
      await assert.rejects(async () => {
        await prisma.review.create({ data: { author_id: tutor.id, provider_id: provider.id, appointment_id: origin.id, rating: 6 } });
      });
    });
    await check('listagem pública filtra produto correto e retorna metadados', async () => {
      const response = await request(app).get(`/api/v1/reviews?product_id=${product.id}`);
      assert.equal(response.status, 200);
      assert.equal(response.body.length, 1);
      assert.equal(response.body[0].product_id, product.id);
      assert.equal(response.headers['x-total-count'], '1');
    });

    // Muitas avaliações com o mesmo instante são válidas no schema. ANALYZE
    // produz estatísticas normais, sem forçar plano de execução ou desativar índices.
    const origins = Array.from({ length: 60 }, () => randomUUID());
    await prisma.appointment.createMany({ data: origins.map(id => ({
      id, provider_id: provider.id, service_id: service.id, pet_id: pet.id,
      status: 'CONCLUIDO', payment_policy: 'PRESENCIAL', total_price: '80',
      start_time: new Date('2026-01-01T10:00:00Z'), end_time: new Date('2026-01-02T10:00:00Z'),
    })) });
    await prisma.review.createMany({ data: origins.map(appointment_id => ({
      author_id: tutor.id, provider_id: provider.id, appointment_id, rating: 5,
      created_at: new Date('2099-01-01T00:00:00Z'),
    })) });
    await prisma.$executeRawUnsafe('ANALYZE reviews');
    await check('paginação com datas iguais não repete avaliações entre páginas', async () => {
      const first = await request(app).get(`/api/v1/reviews?provider_id=${provider.id}&page=1&limit=10`);
      const next = await request(app).get(`/api/v1/reviews?provider_id=${provider.id}&page=2&limit=10`);
      assert.equal(first.status, 200); assert.equal(next.status, 200);
      const ids = new Set(first.body.map(item => item.id));
      const overlap = next.body.filter(item => ids.has(item.id));
      assert.equal(overlap.length, 0, `Houve ${overlap.length} avaliações repetidas nas páginas 1 e 2.`);
    });
    await check('página válida muito alta não causa erro interno', async () => {
      const response = await request(app).get(`/api/v1/reviews?provider_id=${provider.id}&page=214748365&limit=20`);
      assert.notEqual(response.status, 500, 'page=214748365 e limit=20 foram aceitos pelo Zod, mas retornaram HTTP 500.');
    });
    await check('somente tutor pode criar avaliação (contrato Swagger)', async () => {
      const origin = await createAppointment();
      await prisma.user.update({ where: { id: tutor.id }, data: { role_id: 1 } });
      const adminToken = jwt.sign({ id: tutor.id, role_id: 1 }, process.env.JWT_SECRET);
      const response = await post({ rating: 3, provider_id: provider.id, appointment_id: origin.id }, adminToken);
      assert.equal(response.status, 403, `Usuário role 1 proprietário de origem concluída recebeu ${response.status}.`);
    });
    console.log(JSON.stringify({ commit: 'ad21e2666de5bed9f9c77bacf7046c648d04d553', results }, null, 2));
  } finally { await disconnectTestDatabase(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
