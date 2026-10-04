const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const {
  ORDER_STATUS,
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
  isPaidOrderStatus,
  isPayableOrderStatus,
} = require('../../constants/orderStatus');

const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          image_url: true,
          sku: true,
        },
      },
    },
  },
  provider: {
    select: {
      id: true,
      business_name: true,
    },
  },
};

function asNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}

function formatOrder(order) {
  return {
    id: order.id,
    provider_id: order.provider_id,
    customer_id: order.customer_id,
    total_price: asNumber(order.total_price),
    status: order.status,
    created_at: order.created_at,
    updated_at: order.updated_at,
    provider: order.provider,
    items: (order.items || []).map((item) => {
      const unitPrice = asNumber(item.unit_price);
      return {
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: Number((unitPrice * item.quantity).toFixed(2)),
        product: item.product,
      };
    }),
  };
}

function normalizePaymentResult(paymentResult = {}) {
  return {
    provider: paymentResult.provider || PAYMENT_PROVIDER.SIMULATED,
    status: paymentResult.status || PAYMENT_STATUS.APPROVED,
    external_id: paymentResult.external_id || null,
  };
}

class ConfirmOrderPaymentUseCase {
  async execute({ userId, userRole, orderId, paymentResult }) {
    if (userRole && userRole !== 5) {
      throw AppError.forbidden('Apenas clientes podem pagar pedidos');
    }

    const payment = normalizePaymentResult(paymentResult);
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customer_id: userId,
      },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw AppError.notFound('Pedido não encontrado');
    }

    if (isPaidOrderStatus(order.status)) {
      return {
        order: formatOrder(order),
        payment,
      };
    }

    if (!isPayableOrderStatus(order.status)) {
      throw AppError.conflict(
        `Pedido não pode ser pago no status atual (${order.status})`,
        { order_id: order.id, status: order.status }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: ORDER_STATUS.PAID,
        updated_at: new Date(),
      },
      include: ORDER_INCLUDE,
    });

    return {
      order: formatOrder(updatedOrder),
      payment,
    };
  }
}

module.exports = new ConfirmOrderPaymentUseCase();
module.exports.ConfirmOrderPaymentUseCase = ConfirmOrderPaymentUseCase;
