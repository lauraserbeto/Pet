const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { formatAppointment } = require('../../utils/appointmentFormatter');
const { APPOINTMENT_INCLUDE } = require('../../repositories/AppointmentRepository');
const calculateAppointmentTotal = require('./CalculateAppointmentTotalUseCase');
const { normalizePaymentPolicy } = require('../../constants/paymentPolicy');
const {
  INITIAL_APPOINTMENT_STATUS,
  ACTIVE_APPOINTMENT_STATUSES,
} = require('../../constants/appointmentStatus');
const {
  PROVIDER_ROLES,
  OPERATIONAL_PROVIDER_SELECT,
  assertOperationalProvider,
} = require('../providers/providerAccess');

const TUTOR_ROLE = 5;

// Limites de período por agendamento (P3 do plano da Fase 1). Ajuste aqui.
const MAX_HOTEL_DAILY_RATES = 30;
const MAX_SITTER_HOURS = 12;

/**
 * Cria um agendamento (AGD-2; regras vigentes pela DEC-A/DEC-B, E-04).
 *
 * Fluxo:
 * 1. Só tutor cria. O serviço precisa estar ativo e ser de um hotel ou Pet
 *    Sitter operacional (aprovado, conta ativa, sitter com avaliação aprovada).
 * 2. O pet precisa pertencer ao tutor.
 * 3. Início no futuro, fim depois do início e período dentro do limite.
 * 4. Total = preço do serviço × diárias (hotel) ou horas (sitter).
 * 5. Conflito (P2): o mesmo pet, ou o mesmo Pet Sitter, com agendamento ativo
 *    no período → 409. Hotel não é bloqueado: hospeda vários pets ao mesmo tempo.
 * 6. Nasce PENDENTE, com a payment_policy do parceiro gravada no agendamento.
 *
 * A checagem de conflito e a gravação rodam na mesma transação, com lock na
 * linha do pet (e do sitter): duas reservas simultâneas não passam juntas.
 */
class CreateAppointmentUseCase {
  constructor({ db = prisma, calculateTotal = calculateAppointmentTotal, now = () => new Date() } = {}) {
    this.db = db;
    this.calculateTotal = calculateTotal;
    this.now = now;
  }

  async execute({ userId, userRole, service_id, pet_id, start_time, end_time, notes }) {
    if (userRole !== TUTOR_ROLE) {
      throw AppError.forbidden('Apenas tutores podem criar agendamentos.');
    }

    // 1. Serviço + parceiro (com o necessário para checar se opera)
    const service = await this.db.service.findUnique({
      where: { id: service_id },
      include: {
        provider: {
          select: { id: true, payment_policy: true, ...OPERATIONAL_PROVIDER_SELECT },
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

    const providerRole = provider.user?.role_id;
    if (providerRole !== PROVIDER_ROLES.HOTEL && providerRole !== PROVIDER_ROLES.PET_SITTER) {
      throw AppError.badRequest('Apenas serviços de hotéis e pet sitters podem ser agendados.');
    }

    assertOperationalProvider(provider, {
      message: 'Este parceiro não está recebendo agendamentos no momento.',
    });

    // 2. Ownership do pet
    const pet = await this.db.pet.findUnique({
      where: { id: pet_id },
      select: { id: true, tutor_id: true },
    });

    if (!pet) {
      throw AppError.notFound(`Pet com ID "${pet_id}" não encontrado.`);
    }

    if (pet.tutor_id !== userId) {
      throw AppError.forbidden('Este pet não pertence a você.');
    }

    // 3. Datas
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw AppError.validation('Datas de início e fim inválidas.');
    }
    if (startDate <= this.now()) {
      throw AppError.validation('O início do agendamento precisa estar no futuro.');
    }
    if (endDate <= startDate) {
      throw AppError.validation('A data de fim deve ser posterior à de início.');
    }

    // 4. Preço (DEC-B) e limite de período (P3)
    const calculation = this.calculateTotal.execute({
      service,
      provider,
      startTime: startDate,
      endTime: endDate,
    });

    if (calculation.unit === 'DIARIA' && calculation.quantity > MAX_HOTEL_DAILY_RATES) {
      throw AppError.validation(
        `Hospedagem limitada a ${MAX_HOTEL_DAILY_RATES} diárias por agendamento.`
      );
    }
    if (calculation.unit === 'HORA' && calculation.quantity > MAX_SITTER_HOURS) {
      throw AppError.validation(
        `Atendimento de pet sitter limitado a ${MAX_SITTER_HOURS} horas por agendamento.`
      );
    }

    const isSitter = providerRole === PROVIDER_ROLES.PET_SITTER;

    // 5 e 6. Conflito + gravação, serializados por pet (e por sitter)
    const appointment = await this.db.$transaction(async (tx) => {
      // Ordem fixa (pet antes do parceiro) para não haver deadlock.
      await tx.$queryRaw`SELECT id FROM pets WHERE id = ${pet.id}::uuid FOR UPDATE`;
      if (isSitter) {
        await tx.$queryRaw`SELECT id FROM providers WHERE id = ${provider.id}::uuid FOR UPDATE`;
      }

      const conflictScopes = [{ pet_id: pet.id }];
      if (isSitter) conflictScopes.push({ provider_id: provider.id });

      const conflict = await tx.appointment.findFirst({
        where: {
          status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
          start_time: { lt: endDate },
          end_time: { gt: startDate },
          OR: conflictScopes,
        },
        select: { pet_id: true },
      });

      if (conflict) {
        throw new AppError(
          conflict.pet_id === pet.id
            ? 'Este pet já tem um agendamento ativo nesse período.'
            : 'Este pet sitter já tem um atendimento nesse período.',
          409,
          'SCHEDULE_CONFLICT'
        );
      }

      return tx.appointment.create({
        data: {
          provider_id: provider.id,
          service_id: service.id,
          pet_id: pet.id,
          start_time: startDate,
          end_time: endDate,
          status: INITIAL_APPOINTMENT_STATUS,
          payment_policy: normalizePaymentPolicy(provider.payment_policy),
          total_price: calculation.total,
          notes: notes || null,
        },
        include: APPOINTMENT_INCLUDE,
      });
    });

    return {
      ...formatAppointment(appointment),
      pricing: {
        unit: calculation.unit,
        quantity: calculation.quantity,
        unit_price: calculation.unitPrice,
      },
    };
  }
}

module.exports = new CreateAppointmentUseCase();
module.exports.CreateAppointmentUseCase = CreateAppointmentUseCase;
module.exports.MAX_HOTEL_DAILY_RATES = MAX_HOTEL_DAILY_RATES;
module.exports.MAX_SITTER_HOURS = MAX_SITTER_HOURS;
