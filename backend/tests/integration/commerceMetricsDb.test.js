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
const { GetProviderMetricsUseCase } = require('../../src/useCases/providers/GetProviderMetricsUseCase');
const { CommerceMetricsRepository } = require('../../src/repositories/CommerceMetricsRepository');
const { getDbIntegrationSkipReason, prepareTestDatabase, resetTestDatabase, disconnectTestDatabase } = require('../helpers/dbIntegration');
const { seedRoles, createAuthenticatedTutor, createStoreWithProduct, createApprovedPartner, createService, createPet } = require('../helpers/testSeed');
const skip = getDbIntegrationSkipReason();
let prepared = false;
before(async () => { if (!skip) { await prepareTestDatabase(); prepared = true; } });
beforeEach(async () => { if (!skip) { await resetTestDatabase(); await seedRoles(); } });
after(async () => { if (prepared) await disconnectTestDatabase(); });
const now = new Date('2026-11-19T18:00:00Z');
const token = user => jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET);
const get = (path, user) => request(app).get(path).set('Authorization', `Bearer ${token(user)}`);
async function createUser({ role_id = 5 } = {}) {
  const { tutor } = await createAuthenticatedTutor();
  return role_id === 5 ? tutor : prisma.user.update({ where: { id: tutor.id }, data: { role_id } });
}
async function dataset() {
  const { tutor } = await createAuthenticatedTutor();
  const store = await createStoreWithProduct();
  const other = await createStoreWithProduct();
  const order = (provider, status, total_price, created_at, attempt) => prisma.order.create({ data: {
    provider_id: provider.id, customer_id: tutor.id, status, total_price, created_at: new Date(created_at),
    ...(attempt ? { payment_attempt: { create: { amount: total_price, status: attempt } } } : {}),
  } });
  for (const status of ['PAGO', 'PREPARANDO', 'ENVIADO', 'CONCLUIDO']) await order(store.provider, status, '10.10', '2026-11-19T03:01:00Z');
  await order(store.provider, 'PAGO', '20.20', '2026-11-19T03:00:00Z', 'APPROVED');
  await order(store.provider, 'PAGO', '800', '2026-11-19T10:00:00Z', 'PENDING'); // inconsistente legado: não reconhecer
  await order(store.provider, 'CANCELADO', '900', '2026-11-19T10:00:00Z', 'APPROVED');
  await order(store.provider, 'AGUARDANDO_PAGAMENTO', '700', '2026-11-19T10:00:00Z');
  await order(store.provider, 'PAGO', '600', '2026-11-19T02:59:59Z'); // dia anterior em SP
  await order(store.provider, 'PAGO', '500', '2026-11-20T03:00:00Z'); // futuro
  await order(other.provider, 'CONCLUIDO', '30.30', '2026-11-19T13:00:00Z');
  return { tutor, store, other };
}
test('DSH DB: receita inclui avanço de status, isola parceiro, exclui cancelado/não aprovado/fora da janela', { skip }, async () => {
  const { store, other } = await dataset();
  const useCase = new GetProviderMetricsUseCase();
  const own = await useCase.execute({ userId: store.storeUser.id, userRole: 2, days: 1, now });
  assert.equal(own.commerce.orders.total, 8);
  assert.equal(own.commerce.revenue.orders_amount, 60.6);
  assert.equal(own.commerce.revenue.paid_orders, 5);
  assert.equal(own.commerce.revenue.average_order, 12.12);
  assert.equal(own.commerce.revenue.gateway_orders_amount, 20.2);
  assert.deepEqual(own.commerce.revenue.daily, [{ date: '2026-11-19', amount: 60.6 }]);
  const second = await useCase.execute({ userId: other.storeUser.id, userRole: 2, days: 1, now });
  const admin = await prisma.$transaction(tx => new CommerceMetricsRepository(tx).summary({ days: 1, now }));
  assert.equal(admin.revenue.orders_amount, 90.9);
  assert.equal(Math.round((own.commerce.revenue.orders_amount + second.commerce.revenue.orders_amount) * 100), Math.round(admin.revenue.orders_amount * 100));
  assert.equal(admin.orders.total, own.commerce.orders.total + second.commerce.orders.total);
  assert.equal(JSON.stringify(own).includes('password_hash'), false);
  assert.equal(JSON.stringify(own).includes('document'), false);
  assert.equal(own.commerce.recent_orders.some(row => row.total_price === 30.3), false);
});
test('DSH DB: pagamentos e estornos simulados, mix e consultas não misturam outro parceiro', { skip }, async () => {
  const { tutor } = await createAuthenticatedTutor();
  const hotel = await createApprovedPartner();
  const sitter = await createApprovedPartner({ role_id: 4 });
  const pet = await createPet(tutor.id);
  const service = await createService(hotel.provider.id);
  for (const [partner, status, paidAt, refundedAt] of [
    [hotel, 'APPROVED', '2026-11-19T10:00:00Z', null],
    [hotel, 'REFUNDED', '2026-11-18T10:00:00Z', '2026-11-19T11:00:00Z'],
    [sitter, 'APPROVED', '2026-11-19T10:00:00Z', null],
  ]) {
    const selected = partner === hotel ? service : await createService(partner.provider.id);
    await prisma.appointment.create({ data: { provider_id: partner.provider.id, pet_id: pet.id, service_id: selected.id, status: status === 'REFUNDED' ? 'CANCELADO' : 'CONFIRMADO', payment_policy: 'PRE_PAGO', total_price: '50.10', created_at: new Date('2026-11-19T09:00:00Z'), start_time: now, end_time: new Date(now.getTime() + 3600000), payment: { create: { amount: '50.10', status, paid_at: new Date(paidAt), refunded_at: refundedAt ? new Date(refundedAt) : null } } } });
  }
  const result = await new GetProviderMetricsUseCase().execute({ userId: hotel.partnerUser.id, userRole: 3, days: 1, now });
  assert.equal(result.commerce.appointments.total, 2);
  assert.equal(result.commerce.appointment_payments.gross_amount, 50.1);
  assert.equal(result.commerce.appointment_payments.refunded_amount, 50.1);
  assert.equal(result.commerce.appointment_payments.net_amount, 0);
  assert.deepEqual(result.commerce.service_mix, [{ id: service.id, name: service.name, count: 2 }]);
  assert.equal(result.commerce.recent_appointments.length, 2);
  assert.equal(result.commerce.recent_appointments[0].service.name, service.name);
});
test('DSH HTTP: autenticação/perfil/estado, janela inválida, parceiro vazio e contrato admin real', { skip }, async () => {
  const store = await createStoreWithProduct();
  const tutor = await createUser();
  const admin = await createUser({ role_id: 1 });
  const path = '/api/v1/providers/me/metrics';
  assert.equal((await request(app).get(path)).status, 401);
  assert.equal((await get(path, tutor)).status, 403);
  assert.equal((await get(path, admin)).status, 403);
  for (const days of ['0', '366', 'abc', '1.5']) assert.equal((await get(`${path}?days=${days}`, store.storeUser)).status, 422);
  const empty = await get(`${path}?days=7&provider_id=other`, store.storeUser);
  assert.equal(empty.status, 200, JSON.stringify(empty.body));
  assert.equal(empty.body.commerce.revenue.orders_amount, 0);
  assert.equal(empty.body.commerce.orders.total, 0);
  assert.equal(empty.body.commerce.revenue.daily.length, 7);
  assert.deepEqual(empty.body.commerce.service_mix, []);
  assert.equal((await get('/api/v1/admin/metrics', store.storeUser)).status, 403);
  const platform = await get('/api/v1/admin/metrics?days=7', admin);
  assert.equal(platform.status, 200, JSON.stringify(platform.body));
  assert.equal(platform.body.commerce.revenue.orders_amount, 0);
  assert.equal(platform.body.users.total, 3);
  await prisma.provider.update({ where: { id: store.provider.id }, data: { status: 'PENDENTE' } });
  assert.equal((await get(path, store.storeUser)).status, 403);
});
test('DSH DB: recentes têm limite de dez, mas totais e série abrangem todos; endpoints reconciliam com banco', { skip }, async () => {
  const { tutor } = await createAuthenticatedTutor();
  const store = await createStoreWithProduct();
  const admin = await createUser({ role_id: 1 });
  await prisma.order.createMany({ data: Array.from({ length: 12 }, () => ({ provider_id: store.provider.id, customer_id: tutor.id, status: 'CONCLUIDO', total_price: '0.10' })) });
  const own = await get('/api/v1/providers/me/metrics?days=30', store.storeUser);
  const global = await get('/api/v1/admin/metrics?days=30', admin);
  assert.equal(own.status, 200); assert.equal(global.status, 200);
  assert.equal(own.body.commerce.orders.total, 12);
  assert.equal(own.body.commerce.recent_orders.length, 10);
  assert.equal(own.body.commerce.revenue.orders_amount, 1.2);
  assert.equal(global.body.commerce.revenue.orders_amount, 1.2);
  const direct = await prisma.order.aggregate({ _sum: { total_price: true } });
  assert.equal(Number(direct._sum.total_price), own.body.commerce.revenue.orders_amount);
});
