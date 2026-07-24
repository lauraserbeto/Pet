// Bootstrap do servidor HTTP. A configuração do Express fica em app.js
// (separada para permitir testes de integração com supertest sem abrir porta).
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`✅ Servidor rodando na porta ${PORT}`);
  logger.info(`📚 Swagger em http://localhost:${PORT}/api-docs`);
});
