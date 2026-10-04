const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { formatOrder } = require('../../utils/orderFormatter');

/**
 * Lista os pedidos recebidos pelo parceiro autenticado.
 * - Resolve o provider pelo user_id (relação 1-para-1 User ↔ Provider)
 * - Retorna 403 se o usuário não tiver perfil de parceiro
 * - Filtra por provider_id = provider.id
 * - Ordena por created_at desc com paginação
 * - Inclui dados seguros do cliente e dados dos produtos/itens
 */
class ListProviderOrdersUseCase {
  async execute({ userId, page = 1, limit = 20 }) {
    // Resolve o parceiro vinculado ao usuário autenticado
    const provider = await prisma.provider.findUnique({
      where: { user_id: userId },
    });

    if (!provider) {
      throw AppError.forbidden('Acesso restrito a parceiros cadastrados');
    }

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
      customer: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
        },
      },
    };

    const where = { provider_id: provider.id };

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

module.exports = new ListProviderOrdersUseCase();
