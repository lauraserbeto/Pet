const { z } = require('zod');

// Rating inteiro 1–5 (inclusivo).
const ratingSchema = z.coerce
  .number({ message: 'rating deve ser um número.' })
  .int('rating deve ser inteiro.')
  .min(1, 'rating mínimo é 1.')
  .max(5, 'rating máximo é 5.');

// Criação de review: exatamente um alvo (product_id XOR provider_id) e
// exatamente uma origem (order_id XOR appointment_id) — validado via superRefine.
const createReviewSchema = z
  .object({
    rating: ratingSchema,
    comment: z.string().max(2000, 'Comentário deve ter no máximo 2000 caracteres.').optional(),
    // Alvo
    product_id: z.string().uuid('product_id inválido.').optional(),
    provider_id: z.string().uuid('provider_id inválido.').optional(),
    // Origem
    order_id: z.string().uuid('order_id inválido.').optional(),
    appointment_id: z.string().uuid('appointment_id inválido.').optional(),
  })
  .superRefine((data, ctx) => {
    const hasProduct = !!data.product_id;
    const hasProvider = !!data.provider_id;
    if (hasProduct === hasProvider) {
      ctx.addIssue({
        path: ['product_id'],
        code: z.ZodIssueCode.custom,
        message: 'Informe exatamente um alvo: product_id ou provider_id.',
      });
    }

    const hasOrder = !!data.order_id;
    const hasAppointment = !!data.appointment_id;
    if (hasOrder === hasAppointment) {
      ctx.addIssue({
        path: ['order_id'],
        code: z.ZodIssueCode.custom,
        message: 'Informe exatamente uma origem: order_id ou appointment_id.',
      });
    }

    // Coerência alvo ↔ origem:
    // - Produto só pode ser avaliado via Order (compra).
    // - Provider (hotel/sitter) só pode ser avaliado via Appointment.
    if (hasProduct && hasAppointment) {
      ctx.addIssue({
        path: ['product_id'],
        code: z.ZodIssueCode.custom,
        message: 'Produto deve ser avaliado via order_id, não appointment_id.',
      });
    }
    if (hasProvider && hasOrder) {
      ctx.addIssue({
        path: ['provider_id'],
        code: z.ZodIssueCode.custom,
        message: 'Parceiro deve ser avaliado via appointment_id, não order_id.',
      });
    }
  });

// Query de listagem: exatamente um de product_id ou provider_id, com paginação.
const listReviewsQuerySchema = z
  .object({
    product_id: z.string().uuid('product_id inválido.').optional(),
    provider_id: z.string().uuid('provider_id inválido.').optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .superRefine((data, ctx) => {
    const hasProduct = !!data.product_id;
    const hasProvider = !!data.provider_id;
    if (hasProduct === hasProvider) {
      ctx.addIssue({
        path: ['product_id'],
        code: z.ZodIssueCode.custom,
        message: 'Informe exatamente um filtro: product_id ou provider_id.',
      });
    }
  });

module.exports = { createReviewSchema, listReviewsQuerySchema, ratingSchema };
