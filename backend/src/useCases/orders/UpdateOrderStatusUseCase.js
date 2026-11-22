const prisma = require("../../config/database");
const AppError = require("../../utils/AppError");
const { formatOrder } = require("../../utils/orderFormatter");
const {
  lockOrder,
  orderConcurrencyError,
} = require("../../utils/orderConcurrency");
const {
  ORDER_STATUS,
  normalizeOrderStatus,
  isValidOrderTransition,
} = require("../../constants/orderStatus");

const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          image_url: true,
          sku: true,
          price: true,
        },
      },
    },
  },
  provider: { select: { id: true, business_name: true } },
  customer: { select: { id: true, full_name: true, email: true, phone: true } },
  payment_attempt: true,
};
class UpdateOrderStatusUseCase {
  constructor({ database = prisma } = {}) {
    this.database = database;
  }
  async execute({ orderId, status, userId, userRole }) {
    if (userRole !== 2)
      throw AppError.forbidden("Apenas lojistas podem atualizar pedidos.");
    const target = normalizeOrderStatus(status);
    if (!target) throw AppError.validation(`Status inválido: "${status}".`);
    const order = await this.database.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw AppError.notFound("Pedido não encontrado.");
    const provider = await this.database.provider.findUnique({
      where: { user_id: userId },
    });
    if (!provider || provider.id !== order.provider_id)
      throw AppError.forbidden(
        "Você não tem permissão para atualizar este pedido",
      );
    if (target === ORDER_STATUS.PAID)
      throw AppError.forbidden(
        "O pagamento deve ser confirmado pelo fluxo de pagamento, não pelo lojista.",
      );
    try {
      return await this.database.$transaction(
        async (tx) => {
          await lockOrder(tx, orderId);
          const current = await tx.order.findUnique({
            where: { id: orderId },
            include: ORDER_INCLUDE,
          });
          if (!current || current.provider_id !== provider.id)
            throw AppError.conflict("O pedido mudou. Atualize os dados.");
          // Repetir cancelamento nunca repõe novamente, inclusive em registros legados.
          if (
            target === ORDER_STATUS.CANCELLED &&
            current.status === ORDER_STATUS.CANCELLED
          )
            return formatOrder(current);
          if (!isValidOrderTransition(current.status, target))
            throw AppError.validation(
              `Transição inválida: "${current.status}" → "${target}".`,
            );
          if (target === ORDER_STATUS.CANCELLED && current.payment_attempt) {
            throw new AppError(
              "Este pedido possui tentativa de pagamento no Mercado Pago. O cancelamento exige conciliação do pagamento antes de liberar o estoque.",
              409,
              "PAYMENT_RECONCILIATION_REQUIRED",
            );
          }
          const changed = await tx.order.updateMany({
            where: {
              id: orderId,
              provider_id: provider.id,
              status: current.status,
            },
            data: { status: target, updated_at: new Date() },
          });
          if (changed.count !== 1)
            throw AppError.conflict(
              "O estado do pedido mudou durante a atualização.",
            );
          if (target === ORDER_STATUS.CANCELLED) {
            const quantities = new Map();
            for (const item of current.items) {
              if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0)
                throw AppError.conflict(
                  "Os itens do pedido precisam de conciliação antes do cancelamento.",
                );
              quantities.set(
                item.product_id,
                (quantities.get(item.product_id) || 0) + item.quantity,
              );
            }
            for (const [id, quantity] of [...quantities].sort(([a], [b]) =>
              a.localeCompare(b),
            )) {
              await tx.product.update({
                where: { id },
                data: { stock_quantity: { increment: quantity } },
              });
            }
          }
          return formatOrder(
            await tx.order.findUnique({
              where: { id: orderId },
              include: ORDER_INCLUDE,
            }),
          );
        },
        { timeout: 15000 },
      );
    } catch (error) {
      throw orderConcurrencyError(error);
    }
  }
}
module.exports = new UpdateOrderStatusUseCase();
module.exports.UpdateOrderStatusUseCase = UpdateOrderStatusUseCase;
