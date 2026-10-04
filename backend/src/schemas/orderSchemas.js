const { z } = require('zod');

const orderIdParamsSchema = z.object({
  orderId: z.string().uuid('orderId inválido'),
});

/**
 * Schema de query para listagem de pedidos.
 * Suporta paginação com coerção de string → número (query strings chegam como string).
 */
const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Página mínima: 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limite mínimo: 1').max(100, 'Limite máximo: 100').default(20),
});

/**
 * Schema de body para PATCH /orders/:id/status.
 */
const updateOrderStatusSchema = z.object({
  status: z.string().trim().min(1, 'Status é obrigatório'),
});

module.exports = {
  orderIdParamsSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
};
