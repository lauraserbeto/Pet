const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const {
  PROVIDER_STATUS,
  canAdminTransitionProvider,
  hasApprovedSitterEvaluation,
} = require('../../constants/providerStatus');
const { PROVIDER_ROLES } = require('./providerAccess');

/**
 * Moderação do parceiro pelo admin (E-11 / AUD-15, DEC-D).
 *
 * - Lock da linha do parceiro: duas decisões simultâneas (aprovar e recusar,
 *   ou dois cliques) são serializadas; a segunda vê o estado já alterado e
 *   revalida a transição. Se recusar primeiro, uma aprovação posterior ainda
 *   é permitida por REJEITADO → APROVADO; a ordem inversa recebe 422.
 * - Só transições de ADMIN_PROVIDER_TRANSITIONS são aceitas.
 * - Pet Sitter só é aprovado com avaliação aprovada; o caminho normal é a
 *   revisão da candidatura (UserController.reviewEvaluation).
 *
 * Devolve o parceiro atualizado e o e-mail do titular (para o aviso de recusa,
 * enviado pelo controller depois do commit).
 */
class UpdateProviderStatusUseCase {
  constructor({ db = prisma } = {}) {
    this.db = db;
  }

  async execute({ providerId, status, rejectionReason }) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM providers WHERE id = ${providerId}::uuid FOR UPDATE`;

      const existing = await tx.provider.findUnique({
        where: { id: providerId },
        include: {
          user: {
            select: {
              email: true,
              role_id: true,
              sitter_evaluations: { select: { status: true } },
            },
          },
        },
      });

      if (!existing) throw AppError.notFound('Parceiro não encontrado');

      if (!canAdminTransitionProvider(existing.status, status)) {
        throw new AppError(
          existing.status === status
            ? `O parceiro já está com o status ${status}.`
            : `Transição de status inválida: ${existing.status} → ${status}.`,
          422,
          'INVALID_PROVIDER_TRANSITION',
          { from: existing.status, to: status },
        );
      }

      if (
        status === PROVIDER_STATUS.APPROVED &&
        existing.user?.role_id === PROVIDER_ROLES.PET_SITTER &&
        !hasApprovedSitterEvaluation(existing.user?.sitter_evaluations)
      ) {
        throw new AppError(
          'Pet Sitter é aprovado pela avaliação da candidatura. Revise a candidatura em "Avaliar sitters".',
          422,
          'SITTER_APPROVAL_REQUIRES_EVALUATION',
        );
      }

      const updated = await tx.provider.update({
        where: { id: providerId },
        data: {
          status,
          rejection_reason: status === PROVIDER_STATUS.REJECTED ? rejectionReason : null,
        },
      });

      return { updated, email: existing.user?.email || null };
    });
  }
}

module.exports = { UpdateProviderStatusUseCase };
