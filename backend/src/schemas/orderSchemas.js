const { z } = require('zod');

const orderIdParamsSchema = z.object({
  orderId: z.string().uuid('orderId inválido'),
});

module.exports = {
  orderIdParamsSchema,
};
