const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { formatAppointment } = require('../../utils/appointmentFormatter');
const appointmentRepository = require('../../repositories/AppointmentRepository');
const {
  normalizeAppointmentStatus,
  canTransition,
  APPOINTMENT_ACTOR,
  MANUAL_TARGET_STATUSES,
} = require('../../constants/appointmentStatus');

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
 * Estorno de agendamento pago (recusa ou cancelamento) é da PAG-2.
 */
class UpdateAppointmentStatusUseCase {
  constructor({ db = prisma, repository = appointmentRepository, now = () => new Date() } = {}) {
    this.db = db;
    this.repository = repository;
    this.now = now;
  }

  async execute({ appointmentId, status, userId, userRole }) {
    // 1. Normaliza o status recebido
    const targetStatus = normalizeAppointmentStatus(status);
    if (!targetStatus || !MANUAL_TARGET_STATUSES.includes(targetStatus)) {
      throw AppError.validation(
        `Status inválido: "${status}". Valores aceitos: ${MANUAL_TARGET_STATUSES.join(', ')}.`
      );
    }

    // 2. Busca o agendamento e identifica o ator
    const appointment = await this.repository.findById(appointmentId);
    if (!appointment) {
      throw AppError.notFound(`Agendamento com ID "${appointmentId}" não encontrado.`);
    }

    const actor = await this.#resolveActor(appointment, { userId, userRole });
    if (!actor) {
      throw AppError.forbidden('Você não tem permissão para alterar este agendamento.');
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
      if (decision.reason === 'FORBIDDEN_ACTOR') {
        throw AppError.forbidden(decision.message);
      }
      throw AppError.validation(decision.message, { reason: decision.reason });
    }

    // 4. Grava só se ninguém mudou o status desde a leitura
    const { count } = await this.db.appointment.updateMany({
      where: { id: appointmentId, status: appointment.status },
      data: { status: targetStatus, updated_at: new Date() },
    });

    if (count === 0) {
      throw AppError.conflict(
        'O status deste agendamento foi alterado por outra ação. Atualize a página e tente de novo.'
      );
    }

    const updated = await this.repository.findById(appointmentId);
    return formatAppointment(updated);
  }

  /** PROVIDER se o usuário é o parceiro do agendamento; TUTOR se é dono do pet. */
  async #resolveActor(appointment, { userId, userRole }) {
    if (PARTNER_ROLES.includes(userRole)) {
      const provider = await this.db.provider.findUnique({
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
