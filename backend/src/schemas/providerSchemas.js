const { z } = require('zod');
const { PROVIDER_STATUS, PROVIDER_STATUS_VALUES } = require('../constants/providerStatus');

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

module.exports = {
  providerIdParamsSchema,
  updateProviderStatusSchema,
};
