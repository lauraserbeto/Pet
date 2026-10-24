// Serializador de Appointment para respostas da API (AGD-2).
//
// - Converte Prisma.Decimal → Number para total_price, price, daily_rate, hourly_rate
// - Remove campos sensíveis do Provider (document, document_type, rejection_reason)
// - Tutor do pet sai só com id, full_name, phone e email (AUD-17, antecipado no E-04)
// - Remove password_hash do user do provider, se incluído
// - Expõe a payment_policy gravada no agendamento (DEC-A)
// - Preserva campo `refund` quando presente (estorno da PAG-2)

const { toPublicProvider } = require('./publicProvider');

/** Converte Decimal/string para número; null fica null. */
function asNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}

/** Remove password_hash de um objeto de usuário. */
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

/** Campos do tutor visíveis no agendamento (mesmos do APPOINTMENT_TUTOR_SELECT). */
const APPOINTMENT_TUTOR_FIELDS = ['id', 'full_name', 'phone', 'email'];

/** Reduz o tutor aos campos de contato; ignora o que mais vier carregado. */
function toAppointmentTutor(user) {
  if (!user) return null;
  return Object.fromEntries(
    APPOINTMENT_TUTOR_FIELDS.filter((field) => field in user).map((field) => [field, user[field]])
  );
}

/**
 * Formata um agendamento completo para resposta da API.
 * @param {object} appointment - Appointment do Prisma com includes
 * @returns {object} Appointment seguro para resposta
 */
function formatAppointment(appointment) {
  if (!appointment) return null;

  const result = {
    id: appointment.id,
    provider_id: appointment.provider_id,
    service_id: appointment.service_id,
    pet_id: appointment.pet_id,
    start_time: appointment.start_time,
    end_time: appointment.end_time,
    status: appointment.status,
    payment_policy: appointment.payment_policy ?? null,
    total_price: asNumber(appointment.total_price),
    notes: appointment.notes ?? null,
    created_at: appointment.created_at,
    updated_at: appointment.updated_at,
  };

  // Pet + tutor (só dados de contato)
  if (appointment.pet) {
    result.pet = { ...appointment.pet };
    if (result.pet.tutor) {
      result.pet.tutor = toAppointmentTutor(result.pet.tutor);
    }
  }

  // Serviço — converte price
  if (appointment.service) {
    result.service = {
      ...appointment.service,
      price: asNumber(appointment.service.price),
    };
  }

  // Provider — remove campos sensíveis
  if (appointment.provider) {
    const publicProvider = toPublicProvider(appointment.provider);
    result.provider = {
      ...publicProvider,
      daily_rate: asNumber(publicProvider.daily_rate),
      hourly_rate: asNumber(publicProvider.hourly_rate),
    };
    // Se o provider inclui user, sanitiza
    if (result.provider.user) {
      result.provider.user = sanitizeUser(result.provider.user);
    }
  }

  // Estorno (PAG-2) — preserva quando presente
  if (appointment.refund !== undefined) {
    result.refund = appointment.refund;
  }

  return result;
}

/**
 * Formata uma lista de agendamentos.
 */
function formatAppointments(appointments) {
  return Array.isArray(appointments) ? appointments.map(formatAppointment) : [];
}

module.exports = {
  asNumber,
  sanitizeUser,
  toAppointmentTutor,
  formatAppointment,
  formatAppointments,
};
