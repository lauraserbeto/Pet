const prisma = require("../../config/database");
const AppError = require("../../utils/AppError");
const { formatAppointment } = require("../../utils/appointmentFormatter");
const appointmentRepository = require("../../repositories/AppointmentRepository");
const {
  normalizeAppointmentStatus,
  canTransition,
  APPOINTMENT_ACTOR,
  MANUAL_TARGET_STATUSES,
  APPOINTMENT_STATUS: S,
  PAYMENT_POLICY,
} = require("../../constants/appointmentStatus");

// Roles
const PARTNER_ROLES = [3, 4]; // HOTEL, PET_SITTER

/**
 * Atualiza o status de um agendamento (AGD-2; regras vigentes pela DEC-A, E-04).
 *
 * Regras:
 * 1. Só CONFIRMADO, RECUSADO, CONCLUIDO e CANCELADO podem ser pedidos aqui;
 *    AGUARDANDO_CONFIRMACAO vem só do pagamento (PAG-2).
 * 2. Busca o agendamento (404) e identifica quem pede: o parceiro dono ou o
 *    tutor do pet (403 para os demais).
 * 3. `canTransition` decide com a política GRAVADA no agendamento: ator errado
 *    → 403; transição, pagamento pendente ou horário inválidos → 422.
 * 4. Grava só se o status ainda for o lido; se outra requisição mudou antes → 409.
 *
 * PAG-2: status e estorno persistido são gravados na mesma transação.
 */
class UpdateAppointmentStatusUseCase {
  constructor({
    db = prisma,
    repository = appointmentRepository,
    now = () => new Date(),
  } = {}) {
    this.db = db;
    this.repository = repository;
    this.now = now;
  }

  async execute({ appointmentId, status, userId, userRole }) {
    // 1. Normaliza o status recebido
    const targetStatus = normalizeAppointmentStatus(status);
    if (!targetStatus || !MANUAL_TARGET_STATUSES.includes(targetStatus)) {
      throw AppError.validation(
        `Status inválido: "${status}". Valores aceitos: ${MANUAL_TARGET_STATUSES.join(", ")}.`,
      );
    }

    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM appointments WHERE id = ${appointmentId}::uuid FOR UPDATE`;
      const appointment = await this.repository.findById(appointmentId, tx);
      if (!appointment) {
        throw AppError.notFound(
          `Agendamento com ID "${appointmentId}" não encontrado.`,
        );
      }

      const actor = await this.#resolveActor(
        appointment,
        { userId, userRole },
        tx,
      );
      if (!actor) {
        throw AppError.forbidden(
          "Você não tem permissão para alterar este agendamento.",
        );
      }

      // Repetir uma saída já aplicada não gera novo estorno.
      if (
        appointment.status === targetStatus &&
        ((targetStatus === S.CANCELLED &&
          [APPOINTMENT_ACTOR.TUTOR, APPOINTMENT_ACTOR.PROVIDER].includes(
            actor,
          )) ||
          (targetStatus === S.REJECTED && actor === APPOINTMENT_ACTOR.PROVIDER))
      ) {
        return formatAppointment(appointment);
      }
      const prepaid = appointment.payment_policy === PAYMENT_POLICY.PREPAID;
      const alreadyPaidState = [S.AWAITING_CONFIRMATION, S.CONFIRMED].includes(
        appointment.status,
      );
      if (
        prepaid &&
        alreadyPaidState &&
        appointment.payment?.status !== "APPROVED"
      ) {
        throw AppError.conflict(
          "Pagamento do agendamento inconsistente. É necessária conciliação.",
        );
      }
      // 3. Regra da transição
      const decision = canTransition({
        from: appointment.status,
        to: targetStatus,
        actor,
        policy: appointment.payment_policy,
        now: this.now(),
        startTime: appointment.start_time,
      });

      if (!decision.allowed) {
        if (decision.reason === "FORBIDDEN_ACTOR") {
          throw AppError.forbidden(decision.message);
        }
        throw AppError.validation(decision.message, {
          reason: decision.reason,
        });
      }

      // 4. Grava só se ninguém mudou o status desde a leitura
      const { count } = await tx.appointment.updateMany({
        where: { id: appointmentId, status: appointment.status },
        data: { status: targetStatus, updated_at: new Date() },
      });

      if (count === 0) {
        throw AppError.conflict(
          "O status deste agendamento foi alterado por outra ação. Atualize a página e tente de novo.",
        );
      }

      if (
        prepaid &&
        appointment.payment?.status === "APPROVED" &&
        [S.REJECTED, S.CANCELLED].includes(targetStatus)
      ) {
        const refund = await tx.appointmentPayment.updateMany({
          where: { appointment_id: appointmentId, status: "APPROVED" },
          data: { status: "REFUNDED", refunded_at: this.now() },
        });
        if (refund.count !== 1)
          throw AppError.conflict(
            "O pagamento foi alterado por outra operação.",
          );
      }
      const updated = await this.repository.findById(appointmentId, tx);
      return formatAppointment(updated);
    });
  }

  /** PROVIDER se o usuário é o parceiro do agendamento; TUTOR se é dono do pet. */
  async #resolveActor(appointment, { userId, userRole }, tx) {
    if (PARTNER_ROLES.includes(userRole)) {
      const provider = await tx.provider.findUnique({
        where: { user_id: userId },
        select: { id: true },
      });
      if (provider && provider.id === appointment.provider_id) {
        return APPOINTMENT_ACTOR.PROVIDER;
      }
    }

    if (appointment.pet?.tutor_id === userId) {
      return APPOINTMENT_ACTOR.TUTOR;
    }

    return null;
  }
}

module.exports = new UpdateAppointmentStatusUseCase();
module.exports.UpdateAppointmentStatusUseCase = UpdateAppointmentStatusUseCase;
