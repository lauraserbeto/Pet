const prisma = require("../../config/database");
const AppError = require("../../utils/AppError");
const {
  lockOrder,
  orderConcurrencyError,
} = require("../../utils/orderConcurrency");
const {
  ORDER_STATUS,
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
  isPaidOrderStatus,
  isPayableOrderStatus,
} = require("../../constants/orderStatus");

const ORDER_INCLUDE = {
  payment_attempt: true,
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
  if (typeof value === "object" && typeof value.toNumber === "function") {
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
    shipping_address: order.shipping_address ?? null,
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
  constructor({ database = prisma } = {}) {
    this.database = database;
  }
  async execute({ userId, userRole, orderId, paymentResult, database }) {
    if (userRole !== 5) {
      throw AppError.forbidden("Apenas clientes podem pagar pedidos");
    }

    const payment = normalizePaymentResult(paymentResult);
    if (payment.status !== PAYMENT_STATUS.APPROVED) {
      throw AppError.validation(
        "Apenas pagamentos aprovados podem confirmar pedidos.",
      );
    }
    if (
      ![PAYMENT_PROVIDER.SIMULATED, PAYMENT_PROVIDER.MERCADO_PAGO].includes(
        payment.provider,
      )
    )
      throw AppError.validation("Provedor de pagamento inválido.");
    if (!database) {
      try {
        return await this.database.$transaction(
          (tx) =>
            this.execute({
              userId,
              userRole,
              orderId,
              paymentResult: payment,
              database: tx,
            }),
          { timeout: 15000 },
        );
      } catch (error) {
        throw orderConcurrencyError(error);
      }
    }
    await lockOrder(database, orderId);
    const order = await database.order.findFirst({
      where: {
        id: orderId,
        customer_id: userId,
      },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw AppError.notFound("Pedido não encontrado");
    }

    if (
      payment.provider === PAYMENT_PROVIDER.SIMULATED &&
      order.payment_attempt
    ) {
      throw new AppError(
        "Este pedido possui tentativa no Mercado Pago. Retome o pagamento ou solicite conciliação.",
        409,
        "GATEWAY_PAYMENT_REQUIRED",
      );
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
        { order_id: order.id, status: order.status },
      );
    }

    const changed = await database.order.updateMany({
      where: { id: order.id, status: ORDER_STATUS.AWAITING_PAYMENT },
      data: { status: ORDER_STATUS.PAID, updated_at: new Date() },
    });
    if (changed.count !== 1)
      throw AppError.conflict("O estado do pedido mudou durante o pagamento.");
    return {
      order: formatOrder(
        await database.order.findFirst({
          where: { id: order.id, customer_id: userId },
          include: ORDER_INCLUDE,
        }),
      ),
      payment,
    };
  }
}

module.exports = new ConfirmOrderPaymentUseCase();
module.exports.ConfirmOrderPaymentUseCase = ConfirmOrderPaymentUseCase;
