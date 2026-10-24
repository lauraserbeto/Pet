const { z } = require('zod');
const {
  MANUAL_TARGET_STATUSES,
  normalizeAppointmentStatus,
} = require('../constants/appointmentStatus');

// --- Criação de agendamento ---

// ISO 8601 com fuso explícito (Z ou ±hh:mm): sem fuso, o horário é ambíguo.
const appointmentDateTime = (field) =>
  z.string().datetime({
    offset: true,
    message: `${field} deve ser uma data ISO 8601 válida, com fuso (ex.: 2026-11-10T14:00:00-03:00)`,
  });

const createAppointmentSchema = z.object({
  service_id: z.string().uuid('service_id deve ser um UUID válido'),
  pet_id: z.string().uuid('pet_id deve ser um UUID válido'),
  start_time: appointmentDateTime('start_time'),
  end_time: appointmentDateTime('end_time'),
  notes: z.string().max(2000, 'Notas devem ter no máximo 2000 caracteres').optional(),
});

// --- Atualização de status ---

// Só os status que tutor e parceiro podem pedir (DEC-A). PENDENTE e
// AGUARDANDO_CONFIRMACAO não chegam por aqui → 422. Aceita os sinônimos antigos.
const updateAppointmentStatusSchema = z.object({
  status: z.preprocess(
    (value) => normalizeAppointmentStatus(value) ?? value,
    z.enum(MANUAL_TARGET_STATUSES, `Status inválido. Valores aceitos: ${MANUAL_TARGET_STATUSES.join(', ')}.`)
  ),
});

// --- Params ---

const appointmentIdParamsSchema = z.object({
  id: z.string().uuid('ID do agendamento deve ser um UUID válido'),
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentIdParamsSchema,
};
