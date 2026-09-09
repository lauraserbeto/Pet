const { z } = require('zod');

// Query de paginação para a listagem pública de produtos.
// page >= 1; limit 1..100 (o cap protege contra queries não-limitadas — B6).
// Os defaults preservam o catálogo atual (pequeno) sem truncar a UX.
const listProductsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

const productIdParamsSchema = z.object({
  id: z.string().uuid('id inválido'),
});

module.exports = { listProductsQuery, productIdParamsSchema };
