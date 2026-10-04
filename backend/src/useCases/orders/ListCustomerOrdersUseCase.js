const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { formatOrder } = require('../../utils/orderFormatter');

/**
 * Lista os pedidos realizados pelo tutor autenticado.
 * - Filtra por customer_id = userId
 * - Ordena por created_at desc
 * - Paginação via skip/take
 * - Retorna dados de itens e produtos sem vazar dados sensíveis
 */
class ListCustomerOrdersUseCase {
  async execute({ userId, page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const include = {
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
    };

    const where = { customer_id: userId };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders: orders.map(formatOrder),
      total,
      page,
      limit,
      totalPages,
    };
  }
}

module.exports = new ListCustomerOrdersUseCase();
