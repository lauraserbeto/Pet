const { z } = require('zod');

const TARGET_TYPES = ['PRODUCT', 'HOTEL', 'SITTER'];

const targetTypeSchema = z.enum(TARGET_TYPES, {
  errorMap: () => ({ message: 'target_type inválido (PRODUCT, HOTEL ou SITTER)' }),
});

const addFavoriteSchema = z
  .object({
    target_type: targetTypeSchema,
    target_id: z.string().uuid('target_id inválido'),
  })
  .strict();

const listFavoritesQuerySchema = z.object({
  type: targetTypeSchema.optional(),
});

const removeFavoriteParamsSchema = z.object({
  type: targetTypeSchema,
  targetId: z.string().uuid('targetId inválido'),
});

module.exports = {
  TARGET_TYPES,
  addFavoriteSchema,
  listFavoritesQuerySchema,
  removeFavoriteParamsSchema,
};
