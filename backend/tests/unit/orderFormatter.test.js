const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatOrder } = require('../../src/utils/orderFormatter');

const baseOrder = {
  id: 'order-1',
  provider_id: 'provider-1',
  customer_id: 'customer-1',
  total_price: '89.90',
  status: 'PAGO',
  created_at: new Date('2026-10-20T14:00:00Z'),
  updated_at: new Date('2026-10-20T14:00:00Z'),
  items: [],
};

test('formatOrder expõe a cópia do endereço de entrega (E-05)', () => {
  const shipping_address = {
    cep: '01001-000',
    rua: 'Praça da Sé',
    numero: '100',
    complemento: null,
    bairro: 'Sé',
    cidade: 'São Paulo',
    estado: 'SP',
  };

  const formatted = formatOrder({ ...baseOrder, shipping_address });

  assert.deepEqual(formatted.shipping_address, shipping_address);
  assert.equal(formatted.total_price, 89.9);
});

test('pedido anterior ao E-05 sai com shipping_address null', () => {
  assert.equal(formatOrder(baseOrder).shipping_address, null);
  assert.equal(formatOrder({ ...baseOrder, shipping_address: null }).shipping_address, null);
});
