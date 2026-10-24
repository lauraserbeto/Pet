process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { after, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signTestToken } = require('../helpers/authState');

const prisma = require('../../src/config/database');
const serviceRepository = require('../../src/repositories/ServiceRepository');
const app = require('../../src/app');

const serviceId = '11111111-1111-4111-8111-111111111111';
const providerId = '22222222-2222-4222-8222-222222222222';
const otherProviderId = '33333333-3333-4333-8333-333333333333';
const userId = '44444444-4444-4444-8444-444444444444';

const originalProviderFindUnique = prisma.provider.findUnique;
const originalProviderFindFirst = prisma.provider.findFirst;
const originalCreate = serviceRepository.create;
const originalFindByProviderId = serviceRepository.findByProviderId;
const originalFindById = serviceRepository.findById;
const originalUpdate = serviceRepository.update;
const originalDeactivate = serviceRepository.deactivate;

function token(roleId, id = userId) {
  return signTestToken({ id, role_id: roleId });
}

function approvedProvider(roleId = 3, status = 'APROVADO') {
  return {
    id: providerId,
    status,
    user: { role_id: roleId },
  };
}

function service(overrides = {}) {
  return {
    id: serviceId,
    provider_id: providerId,
    name: 'Hospedagem diária',
    category: 'BOARDING',
    description: 'Ambiente monitorado',
    price: 120.5,
    duration_minutes: null,
    is_active: true,
    created_at: new Date('2026-10-10T10:00:00Z'),
    ...overrides,
  };
}

let lastDetailQuery;

beforeEach(() => {
  prisma.provider.findUnique = async () => approvedProvider();
  // Detalhe público (GET /providers/:id) consulta com o filtro de parceiro operacional (E-01).
  prisma.provider.findFirst = async (args) => {
    lastDetailQuery = args;
    return {
      ...approvedProvider(),
      document: '12.345.678/0001-90',
      user: { full_name: 'Hotel Pet+', avatar_url: null, role_id: 3 },
      products: [],
      services: [service()],
    };
  };
  serviceRepository.create = async (data) => service(data);
  serviceRepository.findByProviderId = async () => [service()];
  serviceRepository.findById = async () => service();
  serviceRepository.update = async (_id, data) => service(data);
  serviceRepository.deactivate = async () => service({ is_active: false });
});

after(() => {
  prisma.provider.findUnique = originalProviderFindUnique;
  prisma.provider.findFirst = originalProviderFindFirst;
  serviceRepository.create = originalCreate;
  serviceRepository.findByProviderId = originalFindByProviderId;
  serviceRepository.findById = originalFindById;
  serviceRepository.update = originalUpdate;
  serviceRepository.deactivate = originalDeactivate;
});

test('POST /providers/services: hotel aprovado cria serviço e recebe preço numérico', async () => {
  const response = await request(app)
    .post('/api/v1/providers/services')
    .set('Authorization', `Bearer ${token(3)}`)
    .send({
      name: 'Hospedagem diária',
      category: 'BOARDING',
      description: 'Ambiente monitorado',
      price: 'R$ 120,50',
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.service.price, 120.5);
  assert.equal(response.body.service.billing_unit, 'DIARIA');
});

test('POST /providers/services: parceiro pendente não pode criar serviço', async () => {
  prisma.provider.findUnique = async () => approvedProvider(3, 'PENDENTE');

  const response = await request(app)
    .post('/api/v1/providers/services')
    .set('Authorization', `Bearer ${token(3)}`)
    .send({ name: 'Hospedagem', category: 'BOARDING', price: 120 });

  assert.equal(response.status, 403);
  assert.match(response.body.error.message, /aprovados/i);
});

test('POST /providers/services: lojista não pode criar serviço', async () => {
  const response = await request(app)
    .post('/api/v1/providers/services')
    .set('Authorization', `Bearer ${token(2)}`)
    .send({ name: 'Hospedagem', category: 'BOARDING', price: 120 });

  assert.equal(response.status, 403);
});

test('POST /providers/services: rejeita categoria desconhecida', async () => {
  const response = await request(app)
    .post('/api/v1/providers/services')
    .set('Authorization', `Bearer ${token(3)}`)
    .send({ name: 'Serviço inválido', category: 'UNKNOWN', price: 40 });

  assert.equal(response.status, 422);
});

test('POST /providers/services: pet sitter aprovado recebe unidade de cobrança por hora', async () => {
  prisma.provider.findUnique = async () => approvedProvider(4);

  const response = await request(app)
    .post('/api/v1/providers/services')
    .set('Authorization', `Bearer ${token(4)}`)
    .send({ name: 'Passeio', category: 'WALKING', price: 40, duration_minutes: 60 });

  assert.equal(response.status, 201);
  assert.equal(response.body.service.billing_unit, 'HORA');
});

test('PUT /providers/services/:id: bloqueia serviço de outro parceiro', async () => {
  serviceRepository.findById = async () => service({ provider_id: otherProviderId });

  const response = await request(app)
    .put(`/api/v1/providers/services/${serviceId}`)
    .set('Authorization', `Bearer ${token(3)}`)
    .send({ price: 130 });

  assert.equal(response.status, 403);
});

test('PUT /providers/services/:id: atualiza serviço próprio', async () => {
  const response = await request(app)
    .put(`/api/v1/providers/services/${serviceId}`)
    .set('Authorization', `Bearer ${token(3)}`)
    .send({ name: 'Hospedagem premium', price: 150 });

  assert.equal(response.status, 200);
  assert.equal(response.body.service.name, 'Hospedagem premium');
  assert.equal(response.body.service.price, 150);
});

test('DELETE /providers/services/:id: desativa serviço próprio sem apagar histórico', async () => {
  const response = await request(app)
    .delete(`/api/v1/providers/services/${serviceId}`)
    .set('Authorization', `Bearer ${token(3)}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.service.is_active, false);
});

test('GET /providers/services: lista somente os serviços ativos do parceiro autenticado', async () => {
  const response = await request(app)
    .get('/api/v1/providers/services')
    .set('Authorization', `Bearer ${token(3)}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].billing_unit, 'DIARIA');
});

test('GET /providers/:id: detalhe público expõe serviço ativo com preço numérico', async () => {
  const response = await request(app).get(`/api/v1/providers/${providerId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.services[0].price, 120.5);
  assert.equal(response.body.services[0].billing_unit, 'DIARIA');
  assert.equal(response.body.document, undefined);
  assert.equal(response.body.user.email, undefined);
  // Só parceiro operacional aparece no detalhe público.
  assert.equal(lastDetailQuery.where.id, providerId);
  assert.equal(lastDetailQuery.where.status, 'APROVADO');
});
