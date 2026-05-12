const { z } = require('zod');

const MAX_QTY_PER_ITEM = 99;
const MAX_DISTINCT_SKUS = 50;
const CART_EXPIRY_DAYS = 30;

const addItemSchema = z
  .object({
    product_id: z.string().uuid('product_id inválido'),
    quantity: z
      .number()
      .int('Quantidade deve ser inteira')
      .min(1, 'Quantidade mínima 1')
      .max(MAX_QTY_PER_ITEM, `Quantidade máxima ${MAX_QTY_PER_ITEM}`)
      .optional()
      .default(1),
  })
  .strict();

const updateItemSchema = z
  .object({
    quantity: z
      .number()
      .int('Quantidade deve ser inteira')
      .min(0, 'Quantidade não pode ser negativa')
      .max(MAX_QTY_PER_ITEM, `Quantidade máxima ${MAX_QTY_PER_ITEM}`),
  })
  .strict();

const mergeCartSchema = z
  .object({
    items: z
      .array(
        z.object({
          product_id: z.string().uuid('product_id inválido'),
          quantity: z
            .number()
            .int()
            .min(1)
            .max(MAX_QTY_PER_ITEM),
        })
      )
      .max(MAX_DISTINCT_SKUS, `Máximo ${MAX_DISTINCT_SKUS} itens distintos`),
  })
  .strict();

const cartItemIdParamsSchema = z.object({
  itemId: z.string().uuid('itemId inválido'),
});

module.exports = {
  MAX_QTY_PER_ITEM,
  MAX_DISTINCT_SKUS,
  CART_EXPIRY_DAYS,
  addItemSchema,
  updateItemSchema,
  mergeCartSchema,
  cartItemIdParamsSchema,
};
