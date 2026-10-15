const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { formatAppointment } = require('../../utils/appointmentFormatter');
const appointmentRepository = require('../../repositories/AppointmentRepository');
const {
  normalizeAppointmentStatus,
  isValidAppointmentTransition,
  APPOINTMENT_STATUS,
} = require('../../constants/appointmentStatus');
const { isPrepaid, normalizePaymentPolicy } = require('../../constants/paymentPolicy');

// Roles
const PARTNER_ROLES = [3, 4]; // HOTEL, PET_SITTER
const TUTOR_ROLE = 5;

// Status que o parceiro pode aplicar
const PROVIDER_ALLOWED_STATUSES = new Set([
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.REJECTED,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.CANCELLED,
]);

// Status que o tutor pode aplicar
const TUTOR_ALLOWED_STATUSES = new Set([
  APPOINTMENT_STATUS.CANCELLED,
]);

/**
 * Atualiza o status de um agendamento (AGD-2).
 *
 * Regras:
 * 1. Normaliza e valida o status solicitado.
 * 2. Busca o agendamento (404 se não existir).
 * 3. Valida ownership e permissões por papel:
 *    - Parceiro: confirmar, recusar, concluir, cancelar.
 *    - Tutor: apenas cancelar.
 * 4. Valida a transição pela máquina de estados.
 * 5. Se recusa/cancelamento de PRE_PAGO: marca estorno simulado.
 * 6. Persiste e retorna formatado.
 */
class UpdateAppointmentStatusUseCase {
  async execute({ appointmentId, status, userId, userRole }) {
    // 1. Normaliza o status recebido
    const normalizedStatus = normalizeAppointmentStatus(status);
    if (!normalizedStatus) {
      throw AppError.validation(
        `Status inválido: "${status}". Valores aceitos: PENDENTE, AGUARDANDO_CONFIRMACAO, CONFIRMADO, CONCLUIDO, RECUSADO, CANCELADO.`
      );
    }

    // 2. Busca o agendamento
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw AppError.notFound(`Agendamento com ID "${appointmentId}" não encontrado.`);
    }

    // 3. Valida ownership e permissões por papel
    const isTutor = appointment.pet?.tutor_id === userId;
    let isProvider = false;

    if (PARTNER_ROLES.includes(userRole)) {
      const provider = await prisma.provider.findUnique({
        where: { user_id: userId },
      });
      isProvider = provider && provider.id === appointment.provider_id;
    }

    if (!isTutor && !isProvider) {
      throw AppError.forbidden('Você não tem permissão para alterar este agendamento.');
    }

    // Verifica se o papel pode aplicar este status
    if (isProvider && !PROVIDER_ALLOWED_STATUSES.has(normalizedStatus)) {
      throw AppError.forbidden(
        `Parceiros não podem definir o status "${normalizedStatus}".`
      );
    }

    if (isTutor && !isProvider && !TUTOR_ALLOWED_STATUSES.has(normalizedStatus)) {
      throw AppError.forbidden('Tutores só podem cancelar agendamentos.');
    }

    // 4. Valida a transição pela máquina de estados
    // Busca a payment_policy do provider para validação condicional
    const provider = await prisma.provider.findUnique({
      where: { id: appointment.provider_id },
    });
    const paymentPolicy = normalizePaymentPolicy(provider?.payment_policy);

    if (!isValidAppointmentTransition(appointment.status, normalizedStatus, paymentPolicy)) {
      throw AppError.validation(
        `Transição inválida: "${appointment.status}" → "${normalizedStatus}". ` +
          'Consulte as transições permitidas para este status.'
      );
    }

    // 5. Estorno simulado para PRE_PAGO recusado/cancelado
    const isTerminating = [APPOINTMENT_STATUS.REJECTED, APPOINTMENT_STATUS.CANCELLED].includes(normalizedStatus);
    const needsRefund = isTerminating && isPrepaid(paymentPolicy);

    const refund = needsRefund
      ? { status: 'ESTORNADO', simulated: true, amount: Number(appointment.total_price) }
      : undefined;

    // 6. Persiste
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: normalizedStatus,
        updated_at: new Date(),
      },
      include: {
        pet: { include: { tutor: true } },
        service: true,
        provider: true,
      },
    });

    const formatted = formatAppointment(updated);

    // Anexa info de estorno ao retorno (não persiste no banco por ora — PAG-2)
    if (refund) {
      formatted.refund = refund;
    }

    return formatted;
  }
}

module.exports = new UpdateAppointmentStatusUseCase();
module.exports.UpdateAppointmentStatusUseCase = UpdateAppointmentStatusUseCase;
