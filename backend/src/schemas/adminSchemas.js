const { z } = require('zod');

// Janela de tempo das métricas do painel admin.
const metricsQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

module.exports = { metricsQuery };
