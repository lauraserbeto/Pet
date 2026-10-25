const { z } = require('zod');
const { PROVIDER_STATUS, PROVIDER_STATUS_VALUES } = require('../constants/providerStatus');
const { GALLERY_MAX_IMAGES, imageSchema, imageListSchema } = require('./imageSchemas');

const providerIdParamsSchema = z.object({
  id: z.string().uuid('id inválido'),
});

const updateProviderStatusSchema = z
  .object({
    status: z.enum(PROVIDER_STATUS_VALUES),
    rejection_reason: z
      .string()
      .trim()
      .min(1, 'Motivo da recusa não pode ser vazio')
      .max(500, 'Motivo deve ter no máximo 500 caracteres')
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.status === PROVIDER_STATUS.REJECTED && !data.rejection_reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rejection_reason'],
        message: 'rejection_reason é obrigatório ao rejeitar um parceiro',
      });
    }
  });

// --- Perfil público (vitrine) — PUT /providers/profile (E-03) ---
// Antes a rota gravava o corpo sem validar nada. Sem `.strict()`: o formulário
// reenvia campos que a rota não grava (ex.: business_name); chaves
// desconhecidas são descartadas e o use case só grava os campos abaixo.

const optionalText = (max) => z.string().max(max, `Máximo de ${max} caracteres.`).nullable().optional();
const tagListSchema = z.array(z.string().max(100, 'Item muito longo.')).max(30, 'Itens demais na lista.').optional();

// Horários e regras são JSON livre no banco; o teto de tamanho evita gravar
// megabytes nesses campos aproveitando o limite maior desta rota.
const boundedJson = (max) =>
  z
    .unknown()
    .refine(
      (value) => value === undefined || JSON.stringify(value).length <= max,
      `Conteúdo muito grande (máx. ${max} caracteres).`
    )
    .optional();

// A tarifa chega como número ou texto (o use case converte com parseFloat).
const rateSchema = z
  .union([z.number(), z.string().max(30)])
  .nullable()
  .optional()
  .refine((value) => value == null || Number.isFinite(Number(value)), 'Valor inválido.');

const updateProviderProfileSchema = z.object({
  description: optionalText(5_000),
  avatar_url: imageSchema({ label: 'Foto de perfil' }).or(z.literal('')).nullable().optional(),
  gallery_images: imageListSchema({
    max: GALLERY_MAX_IMAGES,
    label: 'Foto da galeria',
    listLabel: 'fotos na galeria',
  }).optional(),
  phone: optionalText(20),
  zip_code: optionalText(20),
  address_line: optionalText(255),
  city: optionalText(100),
  state: optionalText(2),
  allowed_animals: tagListSchema,
  amenities: tagListSchema,
  highlights: tagListSchema,
  sitter_roles: tagListSchema,
  daily_rate: rateSchema,
  hourly_rate: rateSchema,
  operating_hours: boundedJson(10_000),
  rules_policies: boundedJson(20_000),
});

module.exports = {
  providerIdParamsSchema,
  updateProviderStatusSchema,
  updateProviderProfileSchema,
};
