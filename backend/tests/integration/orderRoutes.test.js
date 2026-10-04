process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const prisma = require('../../src/config/database');
const CartRepository = require('../../src/repositories/CartRepository');
const app = require('../../src/app');
const { ORDER_STATUS } = require('../../src/constants/orderStatus');

function generateToken(roleId = 5, userId = 'user-tutor-123') {
  const payload = { id: userId };
  if (roleId !== undefined) {
    payload.role_id = roleId;
  }
  return jwt.sign(payload, process.env.JWT_SECRET);
}

const mockProvider1 = {
  id: 'provider-uuid-0001',
  business_name: 'Pet Shop Alfa',
};

const mockProvider2 = {
  id: 'provider-uuid-0002',
  business_name: 'Rações Beta',
};

const mockProduct1 = {
  id: 'prod-uuid-0001',
  name: 'Ração Premium 15kg',
  price: 150.0,
  status: 'ACTIVE',
  stock_quantity: 10,
  image_url: 'https://example.com/p1.jpg',
  provider_id: mockProvider1.id,
  provider: mockProvider1,
};

const mockProduct2 = {
  id: 'prod-uuid-0002',
  name: 'Brinquedo Mordedor',
  price: 30.5,
  status: 'ACTIVE',
  stock_quantity: 5,
  image_url: 'https://example.com/p2.jpg',
  provider_id: mockProvider1.id,
  provider: mockProvider1,
};

const mockProductOtherProvider = {
  id: 'prod-uuid-0003',
  name: 'Shampoo Hipoalergênico',
  price: 45.0,
  status: 'ACTIVE',
  stock_quantity: 8,
  image_url: 'https://example.com/p3.jpg',
  provider_id: mockProvider2.id,
  provider: mockProvider2,
};

function mockPayableOrder(overrides = {}) {
  return {
    id: overrides.id || '11111111-1111-4111-8111-111111111111',
    customer_id: overrides.customer_id || 'user-tutor-123',
    provider_id: overrides.provider_id || mockProvider1.id,
    total_price: overrides.total_price ?? 150.0,
    status: overrides.status || ORDER_STATUS.AWAITING_PAYMENT,
    created_at: new Date('2026-09-30T12:00:00Z'),
    updated_at: new Date('2026-09-30T12:00:00Z'),
    provider: {
      id: mockProvider1.id,
      business_name: mockProvider1.business_name,
    },
    items: [
      {
        id: 'order-item-pay-1',
        order_id: overrides.id || '11111111-1111-4111-8111-111111111111',
        product_id: mockProduct1.id,
        quantity: 1,
        unit_price: 150.0,
        product: {
          id: mockProduct1.id,
          name: mockProduct1.name,
          image_url: mockProduct1.image_url,
          sku: 'SKU-PAY-1',
        },
      },
    ],
  };
}

test('POST /api/v1/orders: 401 sem token de autenticação', async () => {
  const res = await request(app).post('/api/v1/orders');
  assert.equal(res.status, 401);
});

test('POST /api/v1/orders: 403 para usuários que não são clientes (role_id 1 - ADMIN)', async () => {
  const token = generateToken(1);
  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403);
});

test('POST /api/v1/orders: 403 para Lojistas tentando comprar (role_id 2 - LOJISTA)', async () => {
  const token = generateToken(2);
  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403);
});

test('POST /api/v1/orders: 400 quando o carrinho está vazio', async () => {
  const token = generateToken(5);

  CartRepository.findByUser = async () => ({
    id: 'cart-123',
    user_id: 'user-tutor-123',
    items: [],
  });

  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 400);
  assert.match(res.body.error.message, /vazio/i);
});

test('POST /api/v1/orders: 409 e rollback se estoque for insuficiente na validação prévia', async () => {
  const token = generateToken(5);

  CartRepository.findByUser = async () => ({
    id: 'cart-123',
    user_id: 'user-tutor-123',
    items: [
      {
        id: 'item-1',
        product_id: mockProduct1.id,
        quantity: 15, // estoque é 10
        unit_price_snapshot: 150.0,
        product: { ...mockProduct1, stock_quantity: 10 },
      },
    ],
  });

  let transactionCalled = false;
  prisma.$transaction = async (fn) => {
    transactionCalled = true;
    return await fn(prisma);
  };

  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 409);
  assert.equal(transactionCalled, false, 'Transação não deve ter sido iniciada com estoque prévio insuficiente');
});

test('POST /api/v1/orders: 409 se produto estiver com status INACTIVE', async () => {
  const token = generateToken(5);

  CartRepository.findByUser = async () => ({
    id: 'cart-123',
    user_id: 'user-tutor-123',
    items: [
      {
        id: 'item-1',
        product_id: mockProduct1.id,
        quantity: 1,
        unit_price_snapshot: 150.0,
        product: { ...mockProduct1, status: 'INACTIVE' },
      },
    ],
  });

  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 409);
  assert.match(res.body.error.message, /indisponível/i);
});

test('POST /api/v1/orders: Sucesso (Happy-Path Single Provider) cria Order + OrderItems, congela preço, baixa estoque e limpa carrinho', async () => {
  const token = generateToken(5, 'user-tutor-123');

  const cartState = {
    id: 'cart-123',
    user_id: 'user-tutor-123',
    items: [
      {
        id: 'item-1',
        product_id: mockProduct1.id,
        quantity: 2,
        unit_price_snapshot: 140.0, // preço promocional congelado no carrinho (diferente do preço atual de 150)
        product: { ...mockProduct1, stock_quantity: 10, price: 150.0 },
      },
      {
        id: 'item-2',
        product_id: mockProduct2.id,
        quantity: 1,
        unit_price_snapshot: 30.5,
        product: { ...mockProduct2, stock_quantity: 5, price: 30.5 },
      },
    ],
  };

  CartRepository.findByUser = async () => cartState;

  const stockDecrements = [];
  let cartCleared = false;
  let cartTouched = false;

  const mockTx = {
    product: {
      findUnique: async ({ where }) => {
        if (where.id === mockProduct1.id) return { ...mockProduct1, stock_quantity: 10 };
        if (where.id === mockProduct2.id) return { ...mockProduct2, stock_quantity: 5 };
        return null;
      },
      update: async ({ where, data }) => {
        stockDecrements.push({ id: where.id, decrement: data.stock_quantity.decrement });
        return {};
      },
    },
    order: {
      create: async ({ data }) => {
        return {
          id: 'order-uuid-9999',
          customer_id: data.customer_id,
          provider_id: data.provider_id,
          total_price: data.total_price,
          status: data.status,
          created_at: new Date('2026-09-08T12:00:00Z'),
          updated_at: new Date('2026-09-08T12:00:00Z'),
          provider: {
            id: mockProvider1.id,
            business_name: mockProvider1.business_name,
          },
          items: data.items.create.map((item, idx) => ({
            id: `order-item-${idx + 1}`,
            order_id: 'order-uuid-9999',
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            product: {
              id: item.product_id,
              name: item.product_id === mockProduct1.id ? mockProduct1.name : mockProduct2.name,
              image_url: 'http://example.com/img.jpg',
            },
          })),
        };
      },
    },
    cartItem: {
      deleteMany: async ({ where }) => {
        if (where.cart_id === cartState.id) cartCleared = true;
        return { count: 2 };
      },
    },
    cart: {
      update: async ({ where }) => {
        if (where.id === cartState.id) cartTouched = true;
        return {};
      },
    },
  };

  prisma.$transaction = async (fn) => {
    return await fn(mockTx);
  };

  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 201);
  assert.ok(res.body.order, 'Deve retornar o pedido criado');
  assert.ok(Array.isArray(res.body.orders), 'Deve retornar lista de pedidos');
  assert.equal(res.body.orders.length, 1);

  const order = res.body.order;
  assert.equal(order.status, 'AGUARDANDO_PAGAMENTO');
  assert.equal(order.customer_id, 'user-tutor-123');
  assert.equal(order.provider_id, mockProvider1.id);
  // Total esperado: 2 * 140.0 + 1 * 30.5 = 280 + 30.5 = 310.5
  assert.equal(order.total_price, 310.5);
  assert.equal(typeof order.total_price, 'number');

  // Verifica os itens
  assert.equal(order.items.length, 2);
  const item1 = order.items.find((i) => i.product_id === mockProduct1.id);
  assert.equal(item1.quantity, 2);
  assert.equal(item1.unit_price, 140.0, 'Snapshot de preço deve ser mantido mesmo se produto mudou');
  assert.equal(item1.line_total, 280.0);

  // Verifica decremento de estoque
  assert.equal(stockDecrements.length, 2);
  assert.deepEqual(stockDecrements, [
    { id: mockProduct1.id, decrement: 2 },
    { id: mockProduct2.id, decrement: 1 },
  ]);

  // Verifica que carrinho foi limpo e atualizado
  assert.equal(cartCleared, true, 'Carrinho deve ser esvaziado');
  assert.equal(cartTouched, true, 'Timestamp do carrinho deve ser atualizado');
});

test('POST /api/v1/orders: Multi-provider cria múltiplos pedidos na mesma transação atômica (Opção A)', async () => {
  const token = generateToken(5, 'user-tutor-123');

  const cartState = {
    id: 'cart-multi-123',
    user_id: 'user-tutor-123',
    items: [
      {
        id: 'item-1',
        product_id: mockProduct1.id,
        quantity: 1,
        unit_price_snapshot: 150.0,
        product: { ...mockProduct1, stock_quantity: 10 },
      },
      {
        id: 'item-3',
        product_id: mockProductOtherProvider.id,
        quantity: 2,
        unit_price_snapshot: 45.0,
        product: { ...mockProductOtherProvider, stock_quantity: 8 },
      },
    ],
  };

  CartRepository.findByUser = async () => cartState;

  const createdOrders = [];
  const stockDecrements = [];
  let cartCleared = false;

  const mockTx = {
    product: {
      findUnique: async ({ where }) => {
        if (where.id === mockProduct1.id) return { ...mockProduct1, stock_quantity: 10 };
        if (where.id === mockProductOtherProvider.id) return { ...mockProductOtherProvider, stock_quantity: 8 };
        return null;
      },
      update: async ({ where, data }) => {
        stockDecrements.push({ id: where.id, decrement: data.stock_quantity.decrement });
        return {};
      },
    },
    order: {
      create: async ({ data }) => {
        const order = {
          id: `order-uuid-${createdOrders.length + 1}`,
          customer_id: data.customer_id,
          provider_id: data.provider_id,
          total_price: data.total_price,
          status: data.status,
          created_at: new Date('2026-09-08T12:00:00Z'),
          updated_at: new Date('2026-09-08T12:00:00Z'),
          provider: {
            id: data.provider_id,
            business_name: data.provider_id === mockProvider1.id ? mockProvider1.business_name : mockProvider2.business_name,
          },
          items: data.items.create.map((item, idx) => ({
            id: `item-${idx + 1}`,
            order_id: `order-uuid-${createdOrders.length + 1}`,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        };
        createdOrders.push(order);
        return order;
      },
    },
    cartItem: {
      deleteMany: async () => {
        cartCleared = true;
        return { count: 2 };
      },
    },
    cart: {
      update: async () => ({}),
    },
  };

  prisma.$transaction = async (fn) => {
    return await fn(mockTx);
  };

  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 201);
  assert.equal(res.body.orders.length, 2, 'Deve criar 2 pedidos (1 para cada provider)');
  assert.equal(createdOrders.length, 2);

  // Pedido 1: Provider 1
  const order1 = res.body.orders.find((o) => o.provider_id === mockProvider1.id);
  assert.ok(order1);
  assert.equal(order1.total_price, 150.0);
  assert.equal(order1.items.length, 1);

  // Pedido 2: Provider 2
  const order2 = res.body.orders.find((o) => o.provider_id === mockProvider2.id);
  assert.ok(order2);
  assert.equal(order2.total_price, 90.0); // 2 * 45.0
  assert.equal(order2.items.length, 1);

  // Estoques decrementados
  assert.equal(stockDecrements.length, 2);
  assert.equal(cartCleared, true);
});

test('POST /api/v1/orders: 409 e rollback se estoque mudar concorrentemente durante a transação', async () => {
  const token = generateToken(5, 'user-tutor-123');

  CartRepository.findByUser = async () => ({
    id: 'cart-123',
    user_id: 'user-tutor-123',
    items: [
      {
        id: 'item-1',
        product_id: mockProduct1.id,
        quantity: 2,
        unit_price_snapshot: 150.0,
        product: { ...mockProduct1, stock_quantity: 10 }, // passa na validação prévia
      },
    ],
  });

  let ordersCreatedCount = 0;
  let cartCleared = false;

  const mockTx = {
    product: {
      findUnique: async () => {
        // Simula estoque esgotado concorrentemente por outro cliente antes do lock
        return { ...mockProduct1, stock_quantity: 1 };
      },
    },
    order: {
      create: async () => {
        ordersCreatedCount++;
        return {};
      },
    },
    cartItem: {
      deleteMany: async () => {
        cartCleared = true;
        return {};
      },
    },
    cart: {
      update: async () => ({}),
    },
  };

  prisma.$transaction = async (fn) => {
    return await fn(mockTx);
  };

  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 409);
  assert.match(res.body.error.message, /estoque insuficiente/i);
  assert.equal(ordersCreatedCount, 0, 'Nenhum pedido deve ser criado em caso de erro');
  assert.equal(cartCleared, false, 'Carrinho não deve ser limpo');
});

test('POST /api/v1/orders/:id/pay: marca pedido próprio como PAGO', async () => {
  const orderId = '11111111-1111-4111-8111-111111111111';
  const token = generateToken(5, 'user-tutor-123');
  const order = mockPayableOrder({ id: orderId });
  let updateCalled = false;

  prisma.order = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: orderId, customer_id: 'user-tutor-123' });
      return order;
    },
    update: async ({ where, data }) => {
      updateCalled = true;
      assert.deepEqual(where, { id: orderId });
      assert.equal(data.status, ORDER_STATUS.PAID);
      return { ...order, status: data.status, updated_at: data.updated_at };
// ============================================================
// GET /api/v1/orders — Listagem de pedidos do tutor (PED-2)
// ============================================================

test('GET /api/v1/orders: 401 sem token de autenticação', async () => {
  const res = await request(app).get('/api/v1/orders');
  assert.equal(res.status, 401);
});

test('GET /api/v1/orders: 200 retorna pedidos do tutor logado com headers de paginação', async () => {
  const userId = 'tutor-list-001';
  const token = generateToken(5, userId);

  const mockOrder = {
    id: 'order-list-001',
    provider_id: mockProvider1.id,
    customer_id: userId,
    total_price: 150.0,
    status: 'AGUARDANDO_PAGAMENTO',
    created_at: new Date('2026-09-08T10:00:00Z'),
    updated_at: new Date('2026-09-08T10:00:00Z'),
    provider: { id: mockProvider1.id, business_name: mockProvider1.business_name },
    customer: null,
    items: [],
  };

  prisma.order = {
    count: async ({ where }) => {
      assert.equal(where.customer_id, userId);
      return 1;
    },
    findMany: async ({ where }) => {
      assert.equal(where.customer_id, userId);
      return [mockOrder];
    },
  };

  const res = await request(app)
    .post(`/api/v1/orders/${orderId}/pay`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.order.id, orderId);
  assert.equal(res.body.order.status, ORDER_STATUS.PAID);
  assert.equal(res.body.payment.provider, 'SIMULATED');
  assert.equal(res.body.payment.status, 'APPROVED');
  assert.equal(updateCalled, true);
});

test('POST /api/v1/orders/:id/pay: pagamento já PAGO é idempotente', async () => {
  const orderId = '22222222-2222-4222-8222-222222222222';
  const token = generateToken(5, 'user-tutor-123');
  const order = mockPayableOrder({ id: orderId, status: ORDER_STATUS.PAID });
  let updateCalled = false;

  prisma.order = {
    findFirst: async () => order,
    update: async () => {
      updateCalled = true;
      return order;
    },
  };

  const res = await request(app)
    .post(`/api/v1/orders/${orderId}/pay`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.order.status, ORDER_STATUS.PAID);
  assert.equal(updateCalled, false);
});

test('POST /api/v1/orders/:id/pay: pedido de outro tutor retorna 404 sem vazar existência', async () => {
  const orderId = '33333333-3333-4333-8333-333333333333';
  const token = generateToken(5, 'user-tutor-123');

  prisma.order = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: orderId, customer_id: 'user-tutor-123' });
    .get('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].id, 'order-list-001');
  assert.equal(res.body[0].status, 'AGUARDANDO_PAGAMENTO');
  assert.equal(typeof res.body[0].total_price, 'number');

  // Headers de paginação
  assert.equal(res.headers['x-total-count'], '1');
  assert.equal(res.headers['x-page'], '1');
  assert.equal(res.headers['x-limit'], '20');
  assert.equal(res.headers['x-total-pages'], '1');
});

test('GET /api/v1/orders: isolamento de tutor — tutor A não vê pedidos de tutor B', async () => {
  const userIdA = 'tutor-A-001';
  const userIdB = 'tutor-B-001';
  const tokenA = generateToken(5, userIdA);

  const orderB = {
    id: 'order-b-001',
    provider_id: mockProvider1.id,
    customer_id: userIdB,
    total_price: 50.0,
    status: 'PAGO',
    created_at: new Date(),
    updated_at: new Date(),
    provider: { id: mockProvider1.id, business_name: 'Pet Shop Alfa' },
    customer: null,
    items: [],
  };

  prisma.order = {
    count: async ({ where }) => (where.customer_id === userIdA ? 0 : 1),
    findMany: async ({ where }) => (where.customer_id === userIdA ? [] : [orderB]),
  };

  const res = await request(app)
    .get('/api/v1/orders')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 0, 'Tutor A não deve ver os pedidos de Tutor B');
  assert.equal(res.headers['x-total-count'], '0');
});

test('GET /api/v1/orders: resposta não vaza password_hash do cliente', async () => {
  const userId = 'tutor-safe-001';
  const token = generateToken(5, userId);

  prisma.order = {
    count: async () => 1,
    findMany: async () => [
      {
        id: 'order-safe-001',
        provider_id: mockProvider1.id,
        customer_id: userId,
        total_price: 99.0,
        status: 'PAGO',
        created_at: new Date(),
        updated_at: new Date(),
        provider: { id: mockProvider1.id, business_name: 'Shop' },
        customer: {
          id: userId,
          full_name: 'João Tutor',
          email: 'joao@test.com',
          phone: null,
          password_hash: 'SEGREDO_HASH_SECRETO',
        },
        items: [],
      },
    ],
  };

  const res = await request(app)
    .get('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  const order = res.body[0];
  // Confirma que password_hash nunca é exposto
  assert.equal(order.customer?.password_hash, undefined, 'password_hash jamais deve ser exposto');
  assert.equal(order.customer?.full_name, 'João Tutor');
  assert.equal(order.customer?.email, 'joao@test.com');
});

// ============================================================
// GET /api/v1/orders/received e GET /api/v1/providers/orders
// ============================================================

test('GET /api/v1/orders/received: 401 sem token', async () => {
  const res = await request(app).get('/api/v1/orders/received');
  assert.equal(res.status, 401);
});

test('GET /api/v1/providers/orders: 401 sem token', async () => {
  const res = await request(app).get('/api/v1/providers/orders');
  assert.equal(res.status, 401);
});

test('GET /api/v1/orders/received: 403 para usuário sem perfil de parceiro', async () => {
  const userId = 'user-sem-provider';
  const token = generateToken(5, userId);

  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return null;
      return null;
    },
  };

  const res = await request(app)
    .post(`/api/v1/orders/${orderId}/pay`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 404);
});

test('POST /api/v1/orders/:id/pay: bloqueia usuário que não é tutor', async () => {
  const orderId = '44444444-4444-4444-8444-444444444444';
  const token = generateToken(2, 'user-store-123');
  let findCalled = false;

  prisma.order = {
    findFirst: async () => {
      findCalled = true;
    .get('/api/v1/orders/received')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 403);
});

test('GET /api/v1/orders/received: 200 retorna apenas pedidos do parceiro logado com paginação', async () => {
  const userId = 'user-provider-001';
  const token = generateToken(2, userId);

  const mockProviderFull = { id: 'prov-001', user_id: userId, business_name: 'Minha Loja' };

  const mockReceivedOrder = {
    id: 'recv-order-001',
    provider_id: mockProviderFull.id,
    customer_id: 'customer-xyz',
    total_price: 200.0,
    status: 'PAGO',
    created_at: new Date('2026-09-01T00:00:00Z'),
    updated_at: new Date('2026-09-01T00:00:00Z'),
    customer: {
      id: 'customer-xyz',
      full_name: 'Maria Cliente',
      email: 'maria@test.com',
      phone: null,
    },
    items: [],
  };

  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return mockProviderFull;
      return null;
    },
  };

  prisma.order = {
    count: async ({ where }) => {
      assert.equal(where.provider_id, mockProviderFull.id);
      return 1;
    },
    findMany: async ({ where }) => {
      assert.equal(where.provider_id, mockProviderFull.id);
      return [mockReceivedOrder];
    },
  };

  const res = await request(app)
    .get('/api/v1/orders/received')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].id, 'recv-order-001');
  assert.equal(res.body[0].status, 'PAGO');

  // Headers de paginação
  assert.equal(res.headers['x-total-count'], '1');
  assert.equal(res.headers['x-page'], '1');
  assert.equal(res.headers['x-limit'], '20');
  assert.equal(res.headers['x-total-pages'], '1');
});

test('GET /api/v1/providers/orders: 200 retorna pedidos do parceiro (alias da rota /received)', async () => {
  const userId = 'user-provider-002';
  const token = generateToken(2, userId);

  const mockProviderFull = { id: 'prov-002', user_id: userId, business_name: 'Loja Dois' };

  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return mockProviderFull;
      return null;
    },
  };

  const res = await request(app)
    .post(`/api/v1/orders/${orderId}/pay`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 403);
  assert.equal(findCalled, false);
});

test('POST /api/v1/orders/:id/pay: rejeita pedido em status não pagável', async () => {
  const orderId = '55555555-5555-4555-8555-555555555555';
  const token = generateToken(5, 'user-tutor-123');
  const order = mockPayableOrder({ id: orderId, status: ORDER_STATUS.CANCELLED });

  prisma.order = {
    findFirst: async () => order,
  };

  const res = await request(app)
    .post(`/api/v1/orders/${orderId}/pay`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 409);
  assert.match(res.body.error.message, /não pode ser pago/i);
});

  prisma.order = {
    count: async () => 0,
    findMany: async () => [],
  };

  const res = await request(app)
    .get('/api/v1/providers/orders')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.equal(res.headers['x-total-count'], '0');
});

// ============================================================
// PATCH /api/v1/orders/:id/status — Máquina de estados (PED-2)
// ============================================================

test('PATCH /api/v1/orders/:id/status: 401 sem token', async () => {
  const res = await request(app)
    .patch('/api/v1/orders/some-order-id/status')
    .send({ status: 'PAGO' });
  assert.equal(res.status, 401);
});

test('PATCH /api/v1/orders/:id/status: 404 para pedido inexistente', async () => {
  const userId = 'user-provider-patch-1';
  const token = generateToken(2, userId);

  const mockProviderFull = { id: 'prov-patch-1', user_id: userId };

  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return mockProviderFull;
      return null;
    },
  };

  prisma.order = {
    findUnique: async () => null,
    update: async () => { throw new Error('Não deve ser chamado'); },
  };

  const res = await request(app)
    .patch('/api/v1/orders/order-inexistente/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'PAGO' });

  assert.equal(res.status, 404);
});

test('PATCH /api/v1/orders/:id/status: 403 quando parceiro não é o dono do pedido', async () => {
  const userId = 'user-provider-patch-2';
  const token = generateToken(2, userId);

  // O provider do usuário é prov-X mas o pedido pertence a prov-Y
  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return { id: 'prov-X', user_id: userId };
      return null;
    },
  };

  prisma.order = {
    findUnique: async () => ({
      id: 'order-patch-002',
      provider_id: 'prov-Y', // diferente de prov-X
      customer_id: 'customer-abc',
      status: 'AGUARDANDO_PAGAMENTO',
    }),
    update: async () => { throw new Error('Não deve ser chamado'); },
  };

  const res = await request(app)
    .patch('/api/v1/orders/order-patch-002/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'PAGO' });

  assert.equal(res.status, 403);
});

test('PATCH /api/v1/orders/:id/status: 403 para usuário sem perfil de parceiro', async () => {
  const userId = 'user-tutor-no-provider';
  const token = generateToken(5, userId);

  prisma.provider = {
    findUnique: async () => null,
  };

  prisma.order = {
    findUnique: async () => ({
      id: 'order-patch-003',
      provider_id: 'prov-Z',
      customer_id: 'customer-def',
      status: 'AGUARDANDO_PAGAMENTO',
    }),
    update: async () => { throw new Error('Não deve ser chamado'); },
  };

  const res = await request(app)
    .patch('/api/v1/orders/order-patch-003/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'PAGO' });

  assert.equal(res.status, 403);
});

test('PATCH /api/v1/orders/:id/status: 422 para status desconhecido', async () => {
  const userId = 'user-provider-patch-3';
  const token = generateToken(2, userId);

  // Não precisamos configurar o prisma porque a validação do status deve ser a primeira verificação
  prisma.provider = {
    findUnique: async () => ({ id: 'prov-P', user_id: userId }),
  };
  prisma.order = {
    findUnique: async () => ({
      id: 'order-patch-004',
      provider_id: 'prov-P',
      status: 'AGUARDANDO_PAGAMENTO',
    }),
  };

  const res = await request(app)
    .patch('/api/v1/orders/order-patch-004/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'STATUS_INVENTADO_XYZ' });

  assert.equal(res.status, 422);
});

test('PATCH /api/v1/orders/:id/status: 422 para transição inválida (CONCLUIDO → AGUARDANDO_PAGAMENTO)', async () => {
  const userId = 'user-provider-patch-4';
  const token = generateToken(2, userId);

  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return { id: 'prov-Q', user_id: userId };
      return null;
    },
  };

  prisma.order = {
    findUnique: async () => ({
      id: 'order-patch-005',
      provider_id: 'prov-Q',
      customer_id: 'customer-ghi',
      status: 'CONCLUIDO', // status terminal
    }),
    update: async () => { throw new Error('Não deve ser chamado'); },
  };

  const res = await request(app)
    .patch('/api/v1/orders/order-patch-005/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'AGUARDANDO_PAGAMENTO' });

  assert.equal(res.status, 422);
  assert.match(res.body.error.message, /transição inválida/i);
});

test('PATCH /api/v1/orders/:id/status: 422 para transição inválida (ENVIADO → AGUARDANDO_PAGAMENTO)', async () => {
  const userId = 'user-provider-patch-5';
  const token = generateToken(2, userId);

  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return { id: 'prov-R', user_id: userId };
      return null;
    },
  };

  prisma.order = {
    findUnique: async () => ({
      id: 'order-patch-006',
      provider_id: 'prov-R',
      customer_id: 'customer-jkl',
      status: 'ENVIADO',
    }),
    update: async () => { throw new Error('Não deve ser chamado'); },
  };

  const res = await request(app)
    .patch('/api/v1/orders/order-patch-006/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'AGUARDANDO_PAGAMENTO' });

  assert.equal(res.status, 422);
});

test('PATCH /api/v1/orders/:id/status: 200 para transição válida (AGUARDANDO_PAGAMENTO → PAGO)', async () => {
  const userId = 'user-provider-patch-6';
  const token = generateToken(2, userId);

  const updatedOrder = {
    id: 'order-patch-007',
    provider_id: 'prov-S',
    customer_id: 'customer-mno',
    total_price: 100.0,
    status: 'PAGO',
    created_at: new Date('2026-09-01T00:00:00Z'),
    updated_at: new Date('2026-09-09T12:00:00Z'),
    provider: { id: 'prov-S', business_name: 'Loja S' },
    customer: { id: 'customer-mno', full_name: 'Ana Cliente', email: 'ana@test.com', phone: null },
    items: [],
  };

  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return { id: 'prov-S', user_id: userId };
      return null;
    },
  };

  prisma.order = {
    findUnique: async () => ({
      id: 'order-patch-007',
      provider_id: 'prov-S',
      customer_id: 'customer-mno',
      status: 'AGUARDANDO_PAGAMENTO',
    }),
    update: async ({ data }) => {
      assert.equal(data.status, 'PAGO');
      return updatedOrder;
    },
  };

  const res = await request(app)
    .patch('/api/v1/orders/order-patch-007/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'PAGO' });

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'PAGO');
  assert.equal(res.body.id, 'order-patch-007');
  // Verificar que não há vazamento de senha
  assert.equal(res.body.customer?.password_hash, undefined);
});

test('PATCH /api/v1/orders/:id/status: 200 para transição válida (PAGO → ENVIADO)', async () => {
  const userId = 'user-provider-patch-7';
  const token = generateToken(2, userId);

  const updatedOrder = {
    id: 'order-patch-008',
    provider_id: 'prov-T',
    customer_id: 'customer-pqr',
    total_price: 75.0,
    status: 'ENVIADO',
    created_at: new Date(),
    updated_at: new Date(),
    provider: { id: 'prov-T', business_name: 'Loja T' },
    customer: { id: 'customer-pqr', full_name: 'Carlos Cliente', email: 'carlos@test.com', phone: null },
    items: [],
  };

  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return { id: 'prov-T', user_id: userId };
      return null;
    },
  };

  prisma.order = {
    findUnique: async () => ({
      id: 'order-patch-008',
      provider_id: 'prov-T',
      customer_id: 'customer-pqr',
      status: 'PAGO',
    }),
    update: async ({ data }) => {
      assert.equal(data.status, 'ENVIADO');
      return updatedOrder;
    },
  };

  const res = await request(app)
    .patch('/api/v1/orders/order-patch-008/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'ENVIADO' });

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ENVIADO');
});

test('PATCH /api/v1/orders/:id/status: 200 para transição válida (ENVIADO → CONCLUIDO)', async () => {
  const userId = 'user-provider-patch-8';
  const token = generateToken(2, userId);

  const updatedOrder = {
    id: 'order-patch-009',
    provider_id: 'prov-U',
    customer_id: 'customer-stu',
    total_price: 250.0,
    status: 'CONCLUIDO',
    created_at: new Date(),
    updated_at: new Date(),
    provider: { id: 'prov-U', business_name: 'Loja U' },
    customer: { id: 'customer-stu', full_name: 'Diego Cliente', email: 'diego@test.com', phone: null },
    items: [],
  };

  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return { id: 'prov-U', user_id: userId };
      return null;
    },
  };

  prisma.order = {
    findUnique: async () => ({
      id: 'order-patch-009',
      provider_id: 'prov-U',
      customer_id: 'customer-stu',
      status: 'ENVIADO',
    }),
    update: async ({ data }) => {
      assert.equal(data.status, 'CONCLUIDO');
      return updatedOrder;
    },
  };

  const res = await request(app)
    .patch('/api/v1/orders/order-patch-009/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'CONCLUIDO' });

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'CONCLUIDO');
  assert.equal(res.body.customer?.password_hash, undefined, 'Jamais deve expor password_hash');
});

test('PATCH /api/v1/orders/:id/status: aceita alias em inglês (SHIPPED → CONCLUIDO via DELIVERED)', async () => {
  const userId = 'user-provider-patch-9';
  const token = generateToken(2, userId);

  const updatedOrder = {
    id: 'order-patch-010',
    provider_id: 'prov-V',
    customer_id: 'customer-vwx',
    total_price: 180.0,
    status: 'CONCLUIDO',
    created_at: new Date(),
    updated_at: new Date(),
    provider: { id: 'prov-V', business_name: 'Loja V' },
    customer: { id: 'customer-vwx', full_name: 'Eva Cliente', email: 'eva@test.com', phone: null },
    items: [],
  };

  prisma.provider = {
    findUnique: async ({ where }) => {
      if (where.user_id === userId) return { id: 'prov-V', user_id: userId };
      return null;
    },
  };

  prisma.order = {
    findUnique: async () => ({
      id: 'order-patch-010',
      provider_id: 'prov-V',
      customer_id: 'customer-vwx',
      status: 'ENVIADO',
    }),
    update: async ({ data }) => {
      // O alias DELIVERED deve ser normalizado para CONCLUIDO
      assert.equal(data.status, 'CONCLUIDO');
      return updatedOrder;
    },
  };

  // Envia o alias em inglês "DELIVERED"
  const res = await request(app)
    .patch('/api/v1/orders/order-patch-010/status')
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'DELIVERED' });

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'CONCLUIDO');
});
