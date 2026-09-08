const { z } = require('zod');
const { PROVIDER_STATUS_VALUES } = require('../constants/providerStatus');

const providerIdParamsSchema = z.object({
  id: z.string().uuid('id inválido'),
});

const updateProviderStatusSchema = z
  .object({
    status: z.enum(PROVIDER_STATUS_VALUES),
    rejection_reason: z.string().trim().max(500, 'Motivo deve ter no máximo 500 caracteres').nullable().optional(),
  })
  .strict();

module.exports = {
  providerIdParamsSchema,
  updateProviderStatusSchema,
};
