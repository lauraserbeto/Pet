const { z } = require('zod');

const SERVICE_CATEGORIES = Object.freeze([
  'BOARDING',
  'DAYCARE',
  'SITTING',
  'WALKING',
]);

function normalizePrice(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return value;

  const raw = value.trim().replace(/^R\$\s*/i, '');
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;

  return normalized === '' ? value : Number(normalized);
}

const serviceDataSchema = z.object({
  name: z.string().trim().min(1, 'Nome do serviço é obrigatório').max(150),
  category: z.enum(SERVICE_CATEGORIES, 'Categoria de serviço inválida'),
  description: z.string().trim().max(5000).nullable().optional(),
  price: z.preprocess(
    normalizePrice,
    z.number().finite('Preço inválido').positive('O preço deve ser maior que zero'),
  ),
  duration_minutes: z.coerce
    .number()
    .int('A duração deve ser um número inteiro')
    .min(1, 'A duração deve ser maior que zero')
    .max(1440, 'A duração máxima é de 1440 minutos')
    .nullable()
    .optional(),
});

const createServiceSchema = serviceDataSchema;
const updateServiceSchema = serviceDataSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

const serviceIdParamsSchema = z.object({
  id: z.string().uuid('id inválido'),
});

module.exports = {
  SERVICE_CATEGORIES,
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamsSchema,
};
