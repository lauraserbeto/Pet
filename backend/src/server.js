// Bootstrap do servidor HTTP. A configuração do Express fica em app.js
// (separada para permitir testes de integração com supertest sem abrir porta).
const app = require('./app');
const env = require('./config/env');

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📚 Acesso local do Swagger: http://localhost:${PORT}/api-docs`);
});
