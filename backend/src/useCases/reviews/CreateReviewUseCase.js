const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { ORDER_STATUS } = require('../../constants/orderStatus');
const { APPOINTMENT_STATUS } = require('../../constants/appointmentStatus');

// Campos públicos do autor — nunca expor password_hash nem document.
const AUTHOR_SELECT = Object.freeze({
  id: true,
  full_name: true,
  avatar_url: true,
});

class CreateReviewUseCase {
  constructor({ db = prisma } = {}) {
    this.db = db;
  }

  async execute({ userId, rating, comment, product_id, provider_id, order_id, appointment_id }) {
    // ── 1. Verificar origem via Order ────────────────────────────────────────
    if (order_id) {
      const order = await this.db.order.findUnique({
        where: { id: order_id },
        include: { items: { select: { product_id: true } } },
      });

      if (!order) {
        throw AppError.notFound('Pedido não encontrado.');
      }
      if (order.customer_id !== userId) {
        throw AppError.forbidden('Você não pode avaliar um pedido de outro usuário.');
      }
      if (order.status !== ORDER_STATUS.COMPLETED) {
        throw AppError.validation(
          'Só é possível avaliar após o pedido ser concluído.',
          { current_status: order.status, required_status: ORDER_STATUS.COMPLETED }
        );
      }

      // Validação: o product_id informado deve ser um item do pedido
      const itemExists = Array.isArray(order.items) && order.items.some((item) => item.product_id === product_id);
      if (!itemExists) {
        throw AppError.validation('O produto informado não faz parte deste pedido.', {
          product_id,
          order_id,
        });
      }

      // Validação: unicidade por (order_id, product_id)
      const existing = await this.db.review.findUnique({
        where: {
          order_id_product_id: { order_id, product_id },
        },
      });
      if (existing) {
        throw AppError.conflict('Este produto já foi avaliado neste pedido.');
      }
    }

    // ── 2. Verificar origem via Appointment ──────────────────────────────────
    if (appointment_id) {
      const appointment = await this.db.appointment.findUnique({
        where: { id: appointment_id },
        include: { pet: { select: { tutor_id: true } } },
      });

      if (!appointment) {
        throw AppError.notFound('Agendamento não encontrado.');
      }
      // O tutor é dono do pet agendado
      if (appointment.pet.tutor_id !== userId) {
        throw AppError.forbidden('Você não pode avaliar um agendamento de outro usuário.');
      }
      if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
        throw AppError.validation(
          'Só é possível avaliar após o agendamento ser concluído.',
          { current_status: appointment.status, required_status: APPOINTMENT_STATUS.COMPLETED }
        );
      }

      // Validação Ponto 1: o provider_id informado deve ser o prestador do agendamento
      if (appointment.provider_id !== provider_id) {
        throw AppError.validation('O prestador informado não corresponde ao deste agendamento.', {
          provider_id,
          appointment_provider_id: appointment.provider_id,
        });
      }

      const existing = await this.db.review.findUnique({ where: { appointment_id } });
      if (existing) {
        throw AppError.conflict('Este agendamento já foi avaliado.');
      }
    }

    // ── 3. Gravar ─────────────────────────────────────────────────────────────
    try {
      const review = await this.db.review.create({
        data: {
          author_id: userId,
          rating,
          comment: comment ?? null,
          product_id: product_id ?? null,
          provider_id: provider_id ?? null,
          order_id: order_id ?? null,
          appointment_id: appointment_id ?? null,
        },
        include: {
          author: { select: AUTHOR_SELECT },
        },
      });

      return review;
    } catch (error) {
      if (error?.code === 'P2002') {
        const msg = order_id
          ? 'Este produto já foi avaliado neste pedido.'
          : 'Este agendamento já foi avaliado.';
        throw AppError.conflict(msg, {
          target: error?.meta?.target,
          order_id: order_id ?? undefined,
          product_id: product_id ?? undefined,
          appointment_id: appointment_id ?? undefined,
        });
      }
      throw error;
    }
  }
}

module.exports = new CreateReviewUseCase();
module.exports.CreateReviewUseCase = CreateReviewUseCase;
