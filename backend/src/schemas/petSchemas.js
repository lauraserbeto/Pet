const { z } = require('zod');

const SPECIES_VALUES = ['DOG', 'CAT', 'OTHER'];

const petBaseSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  species: z.enum(SPECIES_VALUES, {
    errorMap: () => ({ message: 'Espécie inválida (DOG, CAT ou OTHER)' }),
  }),
  breed: z.string().trim().max(100).optional().or(z.literal('')),
  weight_kg: z
    .number()
    .positive('Peso deve ser maior que zero')
    .max(200, 'Peso máximo 200 kg')
    .optional()
    .nullable(),
  birth_date: z
    .string()
    .datetime({ message: 'Data inválida (use ISO 8601)' })
    .refine((iso) => new Date(iso) <= new Date(), 'Data de nascimento não pode ser futura')
    .optional()
    .nullable(),
  medical_notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

const createPetSchema = petBaseSchema.strict();
const updatePetSchema = petBaseSchema.partial().strict();

const petIdParamsSchema = z.object({
  id: z.string().uuid('ID de pet inválido'),
});

module.exports = {
  SPECIES_VALUES,
  createPetSchema,
  updatePetSchema,
  petIdParamsSchema,
};
