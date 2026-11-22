const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { formatOrder } = require('../../utils/orderFormatter');
const { dayKey, metricsWindow, paidOrdersWhere } = require('../../utils/commerceMetrics');
const { ORDER_STATUS } = require('../../constants/orderStatus');

/**
 * Lista os pedidos recebidos pelo parceiro autenticado.
 * - Resolve o provider pelo user_id (relação 1-para-1 User ↔ Provider)
 * - Retorna 403 se o usuário não tiver perfil de parceiro
 * - Filtra por provider_id = provider.id
 * - Ordena por created_at desc com paginação
 * - Inclui dados seguros do cliente e dados dos produtos/itens
 */
class ListProviderOrdersUseCase {
  async execute({ userId, page = 1, limit = 20, q = '', includeSummary = false }) {
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
    if (q) {
      const needle = q.replace(/[\\%_]/g, '\\$&');
      // UUID só aceita igualdade no Prisma; prefixos também podem ser buscados.
      const ids = await prisma.$queryRaw`
        SELECT id FROM orders WHERE provider_id = ${provider.id}::uuid
        AND id::text ILIKE ${'%' + needle + '%'}
      `;
      where.OR = [
        { id: { in: ids.map(row => row.id) } },
        { customer: { full_name: { contains: needle, mode: 'insensitive' } } },
        { customer: { email: { contains: needle, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
        include,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    let summary;
    if (includeSummary) {
      const base = { provider_id: provider.id };
      const now = new Date();
      const window = metricsWindow(Number(dayKey(now).slice(8)), now);
      const [allOrders, pendingOrders, revenue] = await Promise.all([
        q ? prisma.order.count({ where: base }) : Promise.resolve(total),
        prisma.order.count({ where: { ...base, status: { in: [
          ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.PAID,
          ORDER_STATUS.PREPARING, ORDER_STATUS.SHIPPED,
        ] } } }),
        prisma.order.aggregate({ where: paidOrdersWhere({ ...base,
          created_at: { gte: window.since, lte: now },
        }), _sum: { total_price: true } }),
      ]);
      summary = { totalOrders: allOrders, pendingOrders,
        monthlyRevenue: Number(revenue._sum.total_price || 0),
        timeZone: window.time_zone, since: window.since, until: now };
    }

    return {
      orders: orders.map(formatOrder),
      total,
      page,
      limit,
      totalPages,
      ...(summary ? { summary } : {}),
    };
  }
}

module.exports = new ListProviderOrdersUseCase();
