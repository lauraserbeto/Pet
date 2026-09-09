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

