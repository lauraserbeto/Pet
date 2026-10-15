const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { formatAppointments, formatAppointment } = require('../../utils/appointmentFormatter');
const appointmentRepository = require('../../repositories/AppointmentRepository');

// Roles que são parceiros (hotel / pet sitter)
const PARTNER_ROLES = [3, 4];
const TUTOR_ROLE = 5;

/**
 * Lista agendamentos (AGD-2).
 *
 * O recorte depende do papel do usuário autenticado:
 * - Tutor (role 5)  → agendamentos cujo pet pertence ao tutor.
 * - Parceiro (3/4)  → agendamentos onde provider_id = provider do usuário.
 *
 * Ownership é enforced: cada lado só vê seus dados.
 */
class ListAppointmentsUseCase {
  /**
   * Lista os agendamentos do tutor autenticado.
   */
  async listForTutor(userId) {
    const appointments = await appointmentRepository.findByCustomerId(userId);
    return formatAppointments(appointments);
  }

  /**
   * Lista os agendamentos (agenda) do parceiro autenticado.
   */
  async listForProvider(userId) {
    const provider = await prisma.provider.findUnique({
      where: { user_id: userId },
    });

    if (!provider) {
      throw AppError.forbidden('Acesso restrito a parceiros cadastrados.');
    }

    const appointments = await appointmentRepository.findByProviderId(provider.id);
    return formatAppointments(appointments);
  }

  /**
   * Busca um agendamento por ID, validando ownership.
   * O userId deve ser tutor do pet OU provider do agendamento.
   */
  async findById(appointmentId, userId, userRole) {
    const appointment = await appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw AppError.notFound(`Agendamento com ID "${appointmentId}" não encontrado.`);
    }

    // Verifica ownership
    const isTutor = appointment.pet?.tutor_id === userId;
    let isProvider = false;

    if (PARTNER_ROLES.includes(userRole)) {
      const provider = await prisma.provider.findUnique({
        where: { user_id: userId },
      });
      isProvider = provider && provider.id === appointment.provider_id;
    }

    if (!isTutor && !isProvider) {
      throw AppError.forbidden('Você não tem permissão para visualizar este agendamento.');
    }

    return formatAppointment(appointment);
  }
}

module.exports = new ListAppointmentsUseCase();
module.exports.ListAppointmentsUseCase = ListAppointmentsUseCase;
