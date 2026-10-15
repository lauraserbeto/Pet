const { z } = require('zod');

// --- Criação de agendamento ---

const createAppointmentSchema = z.object({
  service_id: z.string().uuid('service_id deve ser um UUID válido'),
  pet_id: z.string().uuid('pet_id deve ser um UUID válido'),
  start_time: z.string().datetime({ message: 'start_time deve ser uma data ISO 8601 válida' }),
  end_time: z.string().datetime({ message: 'end_time deve ser uma data ISO 8601 válida' }),
  notes: z.string().max(2000, 'Notas devem ter no máximo 2000 caracteres').optional(),
});

// --- Atualização de status ---

const updateAppointmentStatusSchema = z.object({
  status: z.string().trim().min(1, 'Status é obrigatório'),
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
