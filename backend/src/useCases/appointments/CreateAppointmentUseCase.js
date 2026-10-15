const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { formatAppointment } = require('../../utils/appointmentFormatter');
const calculateAppointmentTotal = require('./CalculateAppointmentTotalUseCase');
const { normalizePaymentPolicy, isPrepaid } = require('../../constants/paymentPolicy');
const { APPOINTMENT_STATUS } = require('../../constants/appointmentStatus');

/**
 * Cria um agendamento (AGD-2).
 *
 * Fluxo:
 * 1. Valida que o serviço existe e busca o provider vinculado.
 * 2. Valida que o pet existe e pertence ao tutor autenticado (ownership).
 * 3. Calcula o total via CalculateAppointmentTotalUseCase.
 * 4. Define o status inicial pela payment_policy do parceiro:
 *    - PRESENCIAL → CONFIRMADO
 *    - PRE_PAGO  → AGUARDANDO_CONFIRMACAO
 * 5. Persiste e retorna o agendamento formatado.
 */
class CreateAppointmentUseCase {
  async execute({ userId, userRole, service_id, pet_id, start_time, end_time, notes }) {
    // Apenas tutores (role 5) podem criar agendamentos
    if (userRole !== undefined && userRole !== 5) {
      throw AppError.forbidden('Apenas tutores podem criar agendamentos.');
    }

    // 1. Busca o serviço + provider (com user para role_id e tarifas)
    const service = await prisma.service.findUnique({
      where: { id: service_id },
      include: {
        provider: {
          include: { user: { select: { role_id: true } } },
        },
      },
    });

    if (!service) {
      throw AppError.notFound(`Serviço com ID "${service_id}" não encontrado.`);
    }

    if (!service.is_active) {
      throw AppError.badRequest('Este serviço está desativado.');
    }

    const provider = service.provider;
    if (!provider) {
      throw AppError.badRequest('Serviço não vinculado a nenhum parceiro.');
    }

    // 2. Valida ownership do pet
    const pet = await prisma.pet.findUnique({
      where: { id: pet_id },
    });

    if (!pet) {
      throw AppError.notFound(`Pet com ID "${pet_id}" não encontrado.`);
    }

    if (pet.tutor_id !== userId) {
      throw AppError.forbidden('Este pet não pertence a você.');
    }

    // 3. Calcula total_price
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    const calculation = calculateAppointmentTotal.execute({
      provider,
      startTime: startDate,
      endTime: endDate,
    });

    // 4. Define status inicial pela payment_policy
    const policy = normalizePaymentPolicy(provider.payment_policy);
    const initialStatus = isPrepaid(policy)
      ? APPOINTMENT_STATUS.AWAITING_CONFIRMATION
      : APPOINTMENT_STATUS.CONFIRMED;

    // 5. Persiste
    const appointment = await prisma.appointment.create({
      data: {
        provider_id: provider.id,
        service_id: service.id,
        pet_id: pet.id,
        start_time: startDate,
        end_time: endDate,
        status: initialStatus,
        total_price: calculation.total,
        notes: notes || null,
      },
      include: {
        pet: { include: { tutor: true } },
        service: true,
        provider: true,
      },
    });

    return formatAppointment(appointment);
  }
}

module.exports = new CreateAppointmentUseCase();
module.exports.CreateAppointmentUseCase = CreateAppointmentUseCase;
