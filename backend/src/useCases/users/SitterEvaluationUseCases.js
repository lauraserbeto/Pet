const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { PROVIDER_STATUS } = require('../../constants/providerStatus');
const { PROVIDER_ROLES } = require('../providers/providerAccess');

/**
 * Candidatura e revisão do Pet Sitter (E-11 / AUD-15, DEC-D).
 *
 * Estados coerentes entre as três tabelas:
 *  - enviada:  SitterEvaluation PENDING · User.onboarding_step IN_REVIEW
 *  - aprovada: SitterEvaluation APPROVED · User COMPLETED · Provider APROVADO
 *  - recusada: SitterEvaluation REJECTED (com feedback) · User REJECTED ·
 *              Provider mantém o status (nunca APROVADO sem avaliação aprovada)
 *
 * Regras:
 *  - nova candidatura só sem nenhuma pendente/aprovada (primeira vez ou após
 *    recusa), uma de cada vez — lock na linha do usuário serializa envios;
 *  - revisão só de candidatura PENDING de Pet Sitter — lock na linha da
 *    avaliação; a segunda decisão concorrente recebe 409.
 */
const EVALUATION = Object.freeze({ PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED' });

class SubmitSitterEvaluationUseCase {
  constructor({ db = prisma } = {}) {
    this.db = db;
  }

  async execute({ userId, userRole, experienceDetails, environmentPhotos, quizAnswers }) {
    if (userRole !== PROVIDER_ROLES.PET_SITTER)
      throw AppError.forbidden('Apenas Pet Sitters podem enviar candidaturas.');

    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;

      const blocking = await tx.sitterEvaluation.findFirst({
        where: { user_id: userId, status: { in: [EVALUATION.PENDING, EVALUATION.APPROVED] } },
        select: { status: true },
      });
      if (blocking?.status === EVALUATION.PENDING)
        throw new AppError(
          'Sua candidatura já está em análise. Aguarde a revisão antes de enviar outra.',
          409,
          'EVALUATION_ALREADY_PENDING',
        );
      if (blocking?.status === EVALUATION.APPROVED)
        throw new AppError(
          'Sua candidatura já foi aprovada.',
          409,
          'EVALUATION_ALREADY_APPROVED',
        );

      const created = await tx.sitterEvaluation.create({
        data: {
          user_id: userId,
          experience_details:
            typeof experienceDetails === 'string'
              ? experienceDetails
              : JSON.stringify(experienceDetails),
          environment_photos: environmentPhotos,
          quiz_answers: quizAnswers,
          status: EVALUATION.PENDING,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { onboarding_step: 'IN_REVIEW' },
      });
      return created;
    });
  }
}

class ReviewSitterEvaluationUseCase {
  constructor({ db = prisma } = {}) {
    this.db = db;
  }

  async execute({ evaluationId, status, feedback }) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM sitter_evaluations WHERE id = ${evaluationId}::uuid FOR UPDATE`;

      const evaluation = await tx.sitterEvaluation.findUnique({
        where: { id: evaluationId },
        include: { user: { select: { role_id: true } } },
      });
      if (!evaluation) throw AppError.notFound('Avaliação não encontrada');

      if (evaluation.user?.role_id !== PROVIDER_ROLES.PET_SITTER)
        throw AppError.validation('A candidatura precisa pertencer a um Pet Sitter.');

      if (evaluation.status !== EVALUATION.PENDING)
        throw new AppError(
          `Esta candidatura já foi revisada (${evaluation.status}).`,
          409,
          'EVALUATION_ALREADY_REVIEWED',
          { status: evaluation.status },
        );

      const updated = await tx.sitterEvaluation.update({
        where: { id: evaluationId },
        data: { status, feedback: feedback || null },
      });

      await tx.user.update({
        where: { id: evaluation.user_id },
        data: { onboarding_step: status === EVALUATION.APPROVED ? 'COMPLETED' : 'REJECTED' },
      });

      // DEC-D: a aprovação do sitter acontece aqui, pela avaliação.
      if (status === EVALUATION.APPROVED) {
        await tx.provider.updateMany({
          where: { user_id: evaluation.user_id },
          data: { status: PROVIDER_STATUS.APPROVED, rejection_reason: null },
        });
      }

      return updated;
    });
  }
}

module.exports = { SubmitSitterEvaluationUseCase, ReviewSitterEvaluationUseCase, EVALUATION };
