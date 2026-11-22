const prisma = require("../../config/database");
const repository = require("../../repositories/AppointmentRepository");
const { formatAppointment } = require("../../utils/appointmentFormatter");
const AppError = require("../../utils/AppError");
const {
  APPOINTMENT_STATUS: S,
  PAYMENT_POLICY,
} = require("../../constants/appointmentStatus");

class PayAppointmentUseCase {
  constructor({
    db = prisma,
    appointments = repository,
    now = () => new Date(),
  } = {}) {
    this.db = db;
    this.appointments = appointments;
    this.now = now;
  }

  async execute({ appointmentId, userId, userRole }) {
    if (userRole !== 5)
      throw AppError.forbidden("Somente tutores podem pagar agendamentos.");
    return this.db.$transaction(async (tx) => {
      // Mesmo lock usado por cancelamento/recusa: um pagamento não ultrapassa uma saída terminal.
      await tx.$queryRaw`SELECT id FROM appointments WHERE id = ${appointmentId}::uuid FOR UPDATE`;
      const appointment = await this.appointments.findById(appointmentId, tx);
      if (!appointment) throw AppError.notFound("Agendamento não encontrado.");
      if (appointment.pet?.tutor_id !== userId)
        throw AppError.forbidden("Este agendamento não pertence a você.");
      if (appointment.payment_policy !== PAYMENT_POLICY.PREPAID) {
        throw AppError.validation(
          "Agendamento presencial não possui pagamento online.",
        );
      }
      if (
        appointment.payment?.status === "APPROVED" &&
        [S.AWAITING_CONFIRMATION, S.CONFIRMED, S.COMPLETED].includes(
          appointment.status,
        )
      ) {
        return formatAppointment(appointment);
      }
      if (appointment.status !== S.PENDING || appointment.payment) {
        throw AppError.conflict(
          "Este agendamento não está disponível para pagamento.",
        );
      }
      const now = this.now();
      if (now >= new Date(appointment.start_time))
        throw AppError.validation("O horário de início já passou.");
      if (
        !Number.isFinite(Number(appointment.total_price)) ||
        Number(appointment.total_price) <= 0
      ) {
        throw AppError.conflict("Valor do agendamento inválido.");
      }
      await tx.appointmentPayment.create({
        data: {
          appointment_id: appointmentId,
          amount: appointment.total_price,
          status: "APPROVED",
          paid_at: now,
        },
      });
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: S.AWAITING_CONFIRMATION, updated_at: now },
      });
      return formatAppointment(
        await this.appointments.findById(appointmentId, tx),
      );
    });
  }
}

module.exports = new PayAppointmentUseCase();
module.exports.PayAppointmentUseCase = PayAppointmentUseCase;
