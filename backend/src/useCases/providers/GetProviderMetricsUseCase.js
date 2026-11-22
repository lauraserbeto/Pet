const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { CommerceMetricsRepository } = require('../../repositories/CommerceMetricsRepository');

class GetProviderMetricsUseCase {
  constructor({ db = prisma } = {}) { this.db = db; }
  async execute({ userId, userRole, days, now = new Date() }) {
    if (![2, 3, 4].includes(userRole)) throw AppError.forbidden('Métricas disponíveis apenas para parceiros.');
    return this.db.$transaction(async tx => {
      const provider = await tx.provider.findUnique({ where: { user_id: userId }, select: { id: true, business_name: true, status: true } });
      if (!provider || provider.status !== 'APROVADO') throw AppError.forbidden('Métricas disponíveis apenas para parceiros aprovados.');
      const commerce = await new CommerceMetricsRepository(tx).summary({ providerId: provider.id, days, now });
      return { generated_at: now, provider: { id: provider.id, business_name: provider.business_name }, commerce };
    }, { isolationLevel: 'RepeatableRead', timeout: 15000 });
  }
}
module.exports = new GetProviderMetricsUseCase();
module.exports.GetProviderMetricsUseCase = GetProviderMetricsUseCase;
