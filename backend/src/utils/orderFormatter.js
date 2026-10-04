/**
 * Centraliza a formatação segura de pedidos (Order) para respostas da API.
 * - Converte Prisma.Decimal → Number para total_price, unit_price, product.price
 * - Calcula line_total por item
 * - Sanitiza o cliente: expõe apenas id, full_name, email, phone (nunca password_hash)
 * - Inclui dados essenciais do produto: id, name, image_url, sku, price
 */

function asNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}

/**
 * Formata um item de pedido de forma segura.
 * @param {object} item - OrderItem incluindo product
 */
function formatOrderItem(item) {
  const unitPrice = asNumber(item.unit_price);
  const product = item.product
    ? {
        id: item.product.id,
        name: item.product.name,
        image_url: item.product.image_url ?? null,
        sku: item.product.sku ?? null,
        price: asNumber(item.product.price),
      }
    : null;

  return {
    id: item.id,
    order_id: item.order_id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: unitPrice,
    line_total: Number((unitPrice * item.quantity).toFixed(2)),
    product,
  };
}

/**
 * Sanitiza os dados do cliente: nunca expõe password_hash.
 * @param {object|null} customer - User do Prisma
 */
function sanitizeCustomer(customer) {
  if (!customer) return null;
  return {
    id: customer.id,
    full_name: customer.full_name,
    email: customer.email,
    phone: customer.phone ?? null,
  };
}

/**
 * Formata um pedido completo para resposta da API.
 * @param {object} order - Order do Prisma com includes de items, product, customer, provider
 */
function formatOrder(order) {
  return {
    id: order.id,
    provider_id: order.provider_id,
    customer_id: order.customer_id,
    total_price: asNumber(order.total_price),
    status: order.status,
    created_at: order.created_at,
    updated_at: order.updated_at,
    provider: order.provider ?? null,
    customer: sanitizeCustomer(order.customer),
    items: (order.items || []).map(formatOrderItem),
  };
}

module.exports = {
  asNumber,
  formatOrder,
  formatOrderItem,
  sanitizeCustomer,
};
