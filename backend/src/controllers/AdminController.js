const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const { metricsQuery } = require('../schemas/adminSchemas');
const { bucketProviderStatus, groupByDay, toCountMap } = require('../utils/adminMetrics');
const { metricsWindow } = require('../utils/commerceMetrics');
const { CommerceMetricsRepository } = require('../repositories/CommerceMetricsRepository');

// Papéis (tabela `roles`, ver prisma/seed.js)
const ROLE_NAMES = { 1: 'admin', 2: 'lojista', 3: 'hotel', 4: 'pet_sitter', 5: 'tutor' };
const PARTNER_ROLE_IDS = [2, 3, 4];

class AdminController {
  /**
   * Métricas da plataforma para a Visão Geral do admin.
   *
   * Contagens existentes e comércio real. O cálculo comercial é compartilhado
   * com o parceiro; não representa dinheiro de produção nem saldo para saque.
   */
  async getMetrics(req, res, next) {
    try {
      const { days } = metricsQuery.parse(req.query);

      const now = new Date();
      const { since } = metricsWindow(days, now);

      const [
        usersTotal,
        usersByRole,
        newUsersInRange,
        newUserDates,
        providersByStatus,
        partnersByRole,
        pendingEvaluations,
        productsTotal,
        productsActive,
        productsOutOfStock,
        productsByCategory,
        petsTotal,
        favoritesByType,
        activeCarts,
        commerce,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({ by: ['role_id'], _count: { _all: true } }),
        prisma.user.count({ where: { created_at: { gte: since, lte: now } } }),
        prisma.user.findMany({
          where: { created_at: { gte: since, lte: now } },
          select: { created_at: true },
        }),
        prisma.provider.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.user.groupBy({
          by: ['role_id'],
          where: { role_id: { in: PARTNER_ROLE_IDS }, provider: { isNot: null } },
          _count: { _all: true },
        }),
        prisma.sitterEvaluation.count({ where: { status: 'PENDING' } }),
        prisma.product.count(),
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.product.count({ where: { stock_quantity: 0 } }),
        prisma.product.groupBy({ by: ['category'], _count: { _all: true } }),
        prisma.pet.count({ where: { archived_at: null } }),
        prisma.favorite.groupBy({ by: ['target_type'], _count: { _all: true } }),
        prisma.cart.count({ where: { items: { some: {} } } }),
        prisma.$transaction(tx => new CommerceMetricsRepository(tx).summary({ days, now }), { isolationLevel: 'RepeatableRead', timeout: 15000 }),
      ]);

      // Normaliza os status livres de Provider em 3 baldes.
      const partnerStatus = { pendentes: 0, aprovados: 0, recusados: 0 };
      providersByStatus.forEach((row) => {
        partnerStatus[bucketProviderStatus(row.status)] += row._count._all;
      });
      const partnersTotal = Object.values(partnerStatus).reduce((a, b) => a + b, 0);

      return res.status(200).json({
        generated_at: now.toISOString(),
        range_days: days,
        commerce,
        users: {
          total: usersTotal,
          new_in_range: newUsersInRange,
          by_role: toCountMap(usersByRole, 'role_id', (id) => ROLE_NAMES[id] || `role_${id}`),
        },
        partners: {
          total: partnersTotal,
          ...partnerStatus,
          by_type: toCountMap(partnersByRole, 'role_id', (id) => ROLE_NAMES[id] || `role_${id}`),
        },
        moderation: {
          partners_pending: partnerStatus.pendentes,
          sitter_evaluations_pending: pendingEvaluations,
        },
        catalog: {
          products_total: productsTotal,
          products_active: productsActive,
          out_of_stock: productsOutOfStock,
          by_category: toCountMap(productsByCategory, 'category'),
        },
        engagement: {
          pets: petsTotal,
          favorites_by_type: toCountMap(favoritesByType, 'target_type'),
          active_carts: activeCarts,
        },
        growth: groupByDay(
          newUserDates.map((u) => u.created_at),
          days, now
        ),
      });
    } catch (error) {
      if (error?.name === 'ZodError') {
        return next(AppError.validation('Parâmetros de métricas inválidos (days entre 1 e 365).'));
      }
      return next(error);
    }
  }
}

module.exports = new AdminController();
