const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { formatOrder } = require('../../utils/orderFormatter');
const {
  normalizeOrderStatus,
  isValidOrderTransition,
} = require('../../constants/orderStatus');

/**
 * Atualiza o status de um pedido com validação de:
 * 1. Status válido (normalização + verificação de existência)
 * 2. Existência do pedido
 * 3. Ownership: apenas o parceiro dono do pedido pode transicioná-lo (403 caso contrário)
 * 4. Transição válida pela máquina de estados (422 se inválida)
 */
class UpdateOrderStatusUseCase {
  async execute({ orderId, status, userId }) {
    // 1. Normaliza e valida o novo status
    const normalizedTargetStatus = normalizeOrderStatus(status);
    if (!normalizedTargetStatus) {
      throw AppError.validation(
        `Status inválido: "${status}". Valores aceitos: AGUARDANDO_PAGAMENTO, PAGO, PREPARANDO, ENVIADO, CONCLUIDO, CANCELADO`
      );
    }

    // 2. Busca o pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw AppError.notFound(`Pedido com ID "${orderId}" não encontrado`);
    }

    // 3. Verifica ownership: resolve o provider do usuário autenticado
    const provider = await prisma.provider.findUnique({
      where: { user_id: userId },
    });

    if (!provider || provider.id !== order.provider_id) {
      throw AppError.forbidden('Você não tem permissão para atualizar este pedido');
    }

    // 4. Valida a transição de status pela máquina de estados
    if (!isValidOrderTransition(order.status, normalizedTargetStatus)) {
      throw AppError.validation(
        `Transição inválida: "${order.status}" → "${normalizedTargetStatus}". ` +
          'Consulte as transições permitidas para este status.'
      );
    }

    // 5. Persiste a atualização
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: normalizedTargetStatus,
        updated_at: new Date(),
      },
      include: {
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
        provider: {
          select: {
            id: true,
            business_name: true,
          },
        },
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return formatOrder(updatedOrder);
  }
}

module.exports = new UpdateOrderStatusUseCase();
