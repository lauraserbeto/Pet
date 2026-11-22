process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// AVL-1: sistema de avaliações — POST /reviews e GET /reviews.
// Cobre: criação por tutor autenticado, gates de status (CONCLUIDO/DELIVERED),
// ownership, duplicata, listagem por alvo e validação de rating.
// ─────────────────────────────────────────────────────────────────────────────

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signTestToken } = require('../helpers/authState');

const prisma = require('../../src/config/database');
const app = require('../../src/app');

// UUIDs de teste
const TUTOR_ID = 'a0000000-0000-4000-8000-000000000001';
const OTHER_TUTOR_ID = 'a0000000-0000-4000-8000-000000000002';
const PRODUCT_ID = 'b0000000-0000-4000-8000-000000000001';
const PROVIDER_ID = 'b0000000-0000-4000-8000-000000000002';
const ORDER_ID = 'c0000000-0000-4000-8000-000000000001';
const APPT_ID = 'c0000000-0000-4000-8000-000000000002';
const REVIEW_ID = 'd0000000-0000-4000-8000-000000000001';

const restores = [];
function stub(target, method, impl) {
  const original = target[method];
  target[method] = impl;
  restores.push(() => { target[method] = original; });
}

// Dados base reutilizados nos testes
let orderRow;
let appointmentRow;
let createdReview;

beforeEach(() => {
  orderRow = {
    id: ORDER_ID,
    customer_id: TUTOR_ID,
    status: 'CONCLUIDO',
    items: [{ product_id: PRODUCT_ID }],
  };

  appointmentRow = {
    id: APPT_ID,
    provider_id: PROVIDER_ID,
    status: 'CONCLUIDO',
    pet: { tutor_id: TUTOR_ID },
  };

  createdReview = null;

  // Stubs padrão: sem review existente, criação capturada
  stub(prisma.review, 'findUnique', async () => null);
  stub(prisma.review, 'create', async (args) => {
    createdReview = args.data;
    return {
      id: REVIEW_ID,
      ...args.data,
      author: { id: TUTOR_ID, full_name: 'João Tutor', avatar_url: null },
    };
  });
  stub(prisma.review, 'findMany', async () => []);
  stub(prisma.review, 'count', async () => 0);
  stub(prisma.order, 'findUnique', async () => orderRow);
  stub(prisma.appointment, 'findUnique', async () => appointmentRow);
});

afterEach(() => {
  while (restores.length > 0) restores.pop()();
});

const tutorToken = (overrides = {}) =>
  signTestToken({ id: TUTOR_ID, role_id: 5, ...overrides });

// ── POST /reviews — via Order (produto) ───────────────────────────────────────

test('POST /reviews: tutor avalia produto de Order CONCLUIDO → 201', async () => {
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 5, comment: 'Ótimo!', product_id: PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 201);
  assert.equal(res.body.review.rating, 5);
  assert.equal(createdReview.product_id, PRODUCT_ID);
  assert.equal(createdReview.order_id, ORDER_ID);
  assert.equal(createdReview.author_id, TUTOR_ID);
  // Nunca grava password_hash ou document
  assert.equal(createdReview.password_hash, undefined);
});

test('POST /reviews: Order ainda PENDENTE → 422', async () => {
  orderRow.status = 'AGUARDANDO_PAGAMENTO';

  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, product_id: PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 422);
  assert.equal(createdReview, null);
});

test('POST /reviews: Order de outro tutor → 403', async () => {
  orderRow.customer_id = OTHER_TUTOR_ID;

  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, product_id: PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 403);
  assert.equal(createdReview, null);
});

test('POST /reviews: Order inexistente → 404', async () => {
  stub(prisma.order, 'findUnique', async () => null);

  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, product_id: PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 404);
  assert.equal(createdReview, null);
});

test('POST /reviews: review duplicada do mesmo produto no Order → 409', async () => {
  stub(prisma.review, 'findUnique', async ({ where }) =>
    where.order_id_product_id ? { id: REVIEW_ID } : null
  );

  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, product_id: PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 409);
  assert.equal(createdReview, null);
});

test('POST /reviews: produto que não estava nos itens do pedido → 422', async () => {
  const OTHER_PRODUCT_ID = 'b0000000-0000-4000-8000-000000000099';
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 5, product_id: OTHER_PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 422);
  assert.equal(createdReview, null);
});

test('POST /reviews: produtos diferentes no mesmo pedido podem ser avaliados → 201', async () => {
  const SECOND_PRODUCT_ID = 'b0000000-0000-4000-8000-000000000003';
  orderRow.items = [{ product_id: PRODUCT_ID }, { product_id: SECOND_PRODUCT_ID }];

  // Primeira avaliação (PRODUCT_ID) já existe, mas para o SECOND_PRODUCT_ID não existe
  stub(prisma.review, 'findUnique', async (args) => {
    if (args.where?.order_id_product_id?.product_id === PRODUCT_ID || args.where?.order_id === ORDER_ID) {
      return { id: REVIEW_ID };
    }
    return null;
  });

  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 5, product_id: SECOND_PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 201);
  assert.equal(createdReview.product_id, SECOND_PRODUCT_ID);
});

test('POST /reviews: race condition (P2002 no create de Order) → 409', async () => {
  stub(prisma.review, 'create', async () => {
    const error = new Error('Unique constraint failed');
    error.code = 'P2002';
    error.meta = { target: ['order_id', 'product_id'] };
    throw error;
  });

  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 5, product_id: PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'CONFLICT');
  assert.equal(res.body.error.message, 'Este produto já foi avaliado neste pedido.');
});

// ── POST /reviews — via Appointment (provider) ────────────────────────────────

test('POST /reviews: tutor avalia provider de Appointment CONCLUIDO → 201', async () => {
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, comment: 'Ótimo hotel!', provider_id: PROVIDER_ID, appointment_id: APPT_ID });

  assert.equal(res.status, 201);
  assert.equal(createdReview.provider_id, PROVIDER_ID);
  assert.equal(createdReview.appointment_id, APPT_ID);
});

test('POST /reviews: Appointment ainda PENDENTE → 422', async () => {
  appointmentRow.status = 'PENDENTE';

  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, provider_id: PROVIDER_ID, appointment_id: APPT_ID });

  assert.equal(res.status, 422);
  assert.equal(createdReview, null);
});

test('POST /reviews: Appointment de outro tutor → 403', async () => {
  appointmentRow.pet.tutor_id = OTHER_TUTOR_ID;

  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, provider_id: PROVIDER_ID, appointment_id: APPT_ID });

  assert.equal(res.status, 403);
  assert.equal(createdReview, null);
});

test('POST /reviews: review duplicada do mesmo Appointment → 409', async () => {
  stub(prisma.review, 'findUnique', async ({ where }) =>
    where.appointment_id ? { id: REVIEW_ID } : null
  );

  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, provider_id: PROVIDER_ID, appointment_id: APPT_ID });

  assert.equal(res.status, 409);
  assert.equal(createdReview, null);
});

test('POST /reviews: prestador diferente do provider do agendamento → 422', async () => {
  const OTHER_PROVIDER_ID = 'b0000000-0000-4000-8000-000000000099';
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 5, provider_id: OTHER_PROVIDER_ID, appointment_id: APPT_ID });

  assert.equal(res.status, 422);
  assert.equal(createdReview, null);
});

test('POST /reviews: race condition (P2002 no create de Appointment) → 409', async () => {
  stub(prisma.review, 'create', async () => {
    const error = new Error('Unique constraint failed');
    error.code = 'P2002';
    error.meta = { target: ['appointment_id'] };
    throw error;
  });

  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 5, provider_id: PROVIDER_ID, appointment_id: APPT_ID });

  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'CONFLICT');
  assert.equal(res.body.error.message, 'Este agendamento já foi avaliado.');
});

// ── Validação de schema (Zod) ─────────────────────────────────────────────────

test('POST /reviews: rating 0 → 422', async () => {
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 0, product_id: PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /reviews: rating 6 → 422', async () => {
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 6, product_id: PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 422);
});

test('POST /reviews: sem alvo → 422', async () => {
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, order_id: ORDER_ID });

  assert.equal(res.status, 422);
});

test('POST /reviews: dois alvos → 422', async () => {
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, product_id: PRODUCT_ID, provider_id: PROVIDER_ID, order_id: ORDER_ID });

  assert.equal(res.status, 422);
});

test('POST /reviews: comentário com 2001 caracteres → 422', async () => {
  const longComment = 'a'.repeat(2001);
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 5, comment: longComment, product_id: PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /reviews: sem token → 401', async () => {
  const res = await request(app)
    .post('/api/v1/reviews')
    .send({ rating: 4, product_id: PRODUCT_ID, order_id: ORDER_ID });

  assert.equal(res.status, 401);
  assert.equal(createdReview, null);
});

test('POST /reviews: outro perfil com origem própria concluída recebe 403', async () => {
  for (const role_id of [1, 2, 3, 4]) {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${tutorToken({ role_id, provider_status: 'APROVADO' })}`)
      .send({ rating: 4, product_id: PRODUCT_ID, order_id: ORDER_ID });
    assert.equal(res.status, 403, `role ${role_id}`);
    assert.equal(createdReview, null);
  }
});

test('POST /reviews: produto + appointment (incoerente) → 422', async () => {
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, product_id: PRODUCT_ID, appointment_id: APPT_ID });

  assert.equal(res.status, 422);
});

test('POST /reviews: provider + order (incoerente) → 422', async () => {
  const res = await request(app)
    .post('/api/v1/reviews')
    .set('Authorization', `Bearer ${tutorToken()}`)
    .send({ rating: 4, provider_id: PROVIDER_ID, order_id: ORDER_ID });

  assert.equal(res.status, 422);
});

// ── GET /reviews ──────────────────────────────────────────────────────────────

test('GET /reviews?product_id=: retorna reviews do produto (sem token)', async () => {
  const reviewData = {
    id: REVIEW_ID,
    rating: 5,
    comment: 'Top!',
    product_id: PRODUCT_ID,
    author: { id: TUTOR_ID, full_name: 'João', avatar_url: null },
  };
  stub(prisma.review, 'findMany', async (args) => {
    assert.equal(args.where.product_id, PRODUCT_ID);
    return [reviewData];
  });
  stub(prisma.review, 'count', async () => 1);

  const res = await request(app).get(`/api/v1/reviews?product_id=${PRODUCT_ID}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].rating, 5);
  assert.equal(res.headers['x-total-count'], '1');
});

test('GET /reviews?provider_id=: retorna reviews do provider', async () => {
  stub(prisma.review, 'findMany', async (args) => {
    assert.equal(args.where.provider_id, PROVIDER_ID);
    return [];
  });

  const res = await request(app).get(`/api/v1/reviews?provider_id=${PROVIDER_ID}`);

  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body), true);
});

test('GET /reviews: paginação (page=2, limit=5) calcula skip/take e headers X-*', async () => {
  let capturedQuery;
  stub(prisma.review, 'findMany', async (args) => {
    capturedQuery = args;
    return [];
  });
  stub(prisma.review, 'count', async () => 12);

  const res = await request(app).get(`/api/v1/reviews?product_id=${PRODUCT_ID}&page=2&limit=5`);

  assert.equal(res.status, 200);
  assert.equal(capturedQuery.skip, 5);
  assert.equal(capturedQuery.take, 5);
  assert.equal(res.headers['x-page'], '2');
  assert.equal(res.headers['x-limit'], '5');
  assert.equal(res.headers['x-total-count'], '12');
  assert.equal(res.headers['x-total-pages'], '3');
});

test('GET /reviews: ordenação explícita por created_at desc', async () => {
  let capturedQuery;
  stub(prisma.review, 'findMany', async (args) => {
    capturedQuery = args;
    return [];
  });
  stub(prisma.review, 'count', async () => 0);

  const res = await request(app).get(`/api/v1/reviews?product_id=${PRODUCT_ID}`);

  assert.equal(res.status, 200);
  assert.deepEqual(capturedQuery.orderBy, [{ created_at: 'desc' }, { id: 'desc' }]);
});

test('GET /reviews: sem filtro → 422', async () => {
  const res = await request(app).get('/api/v1/reviews');
  assert.equal(res.status, 422);
});

test('GET /reviews: ambos os filtros → 422', async () => {
  const res = await request(app).get(
    `/api/v1/reviews?product_id=${PRODUCT_ID}&provider_id=${PROVIDER_ID}`
  );
  assert.equal(res.status, 422);
});

test('GET /reviews: author não vaza password_hash no select', async () => {
  // O use case inclui author com select explícito (id, full_name, avatar_url).
  // Injeção via construtor — padrão do projeto (testabilidade sem banco).
  const { ListReviewsUseCase } = require('../../src/useCases/reviews/ListReviewsUseCase');
  let capturedInclude;
  const fakeDb = {
    review: {
      count: async () => 0,
      findMany: async (args) => { capturedInclude = args.include; return []; },
    },
  };
  const instance = new ListReviewsUseCase({ db: fakeDb });
  await instance.execute({ product_id: PRODUCT_ID, page: 1, limit: 10 });
  // O autor não deve incluir password_hash nem document
  const authorSelect = capturedInclude?.author?.select ?? {};
  assert.equal(authorSelect.password_hash, undefined);
  assert.equal(authorSelect.document, undefined);
  assert.ok(authorSelect.full_name, 'full_name deve estar no select');
});

test('GET /reviews/summary: distribuição considera o conjunto completo, sem exigir autenticação', async () => {
  stub(prisma.review, 'groupBy', async args => {
    assert.equal(args.where.product_id, PRODUCT_ID);
    assert.equal(args.where.order.is.status, 'CONCLUIDO');
    return [{ rating: 5, _count: { _all: 12 } }, { rating: 3, _count: { _all: 3 } }];
  });
  const res = await request(app).get(`/api/v1/reviews/summary?product_id=${PRODUCT_ID}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.rating_count, 15);
  assert.equal(res.body.rating_avg, 4.6);
  assert.deepEqual(res.body.distribution, [{ rating: 5, count: 12 }, { rating: 4, count: 0 }, { rating: 3, count: 3 }, { rating: 2, count: 0 }, { rating: 1, count: 0 }]);
});

test('GET /reviews/mine: exige tutor e recorta origem pelo autor autenticado', async () => {
  stub(prisma.review, 'findFirst', async args => {
    assert.equal(args.where.author_id, TUTOR_ID);
    assert.equal(args.where.product_id, PRODUCT_ID);
    assert.equal(args.where.order_id, ORDER_ID);
    return { id: REVIEW_ID, rating: 5 };
  });
  const url = `/api/v1/reviews/mine?product_id=${PRODUCT_ID}&order_id=${ORDER_ID}`;
  assert.equal((await request(app).get(url)).status, 401);
  assert.equal((await request(app).get(url).set('Authorization', `Bearer ${tutorToken({ role_id: 1 })}`)).status, 403);
  const own = await request(app).get(url).set('Authorization', `Bearer ${tutorToken()}`);
  assert.equal(own.status, 200); assert.equal(own.body.review.id, REVIEW_ID);
  assert.equal((await request(app).get(`/api/v1/reviews/mine?product_id=${PRODUCT_ID}`).set('Authorization', `Bearer ${tutorToken()}`)).status, 422);
});
