// Centraliza e valida as variáveis de ambiente essenciais no boot.
// Estratégia fail-fast: se um segredo obrigatório estiver ausente, a aplicação
// NÃO sobe — evitando rodar em estado inseguro com um segredo previsível.
// (Substitui o antigo fallback hardcoded `|| 'secret_pet_plus'`.)
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.trim().length === 0) {
  throw new Error(
    '[CONFIG] JWT_SECRET não definido. Defina a variável JWT_SECRET no ambiente ' +
    '(arquivo .env em desenvolvimento; secrets manager em produção) antes de iniciar o servidor.'
  );
}

// Não bloqueia o boot, mas alerta sobre segredos fracos (defesa em profundidade).
if (JWT_SECRET.length < 32) {
  console.warn(
    '[CONFIG] Aviso: JWT_SECRET tem menos de 32 caracteres. ' +
    'Recomenda-se um segredo aleatório e longo (ex.: `openssl rand -hex 32`).'
  );
}

module.exports = {
  JWT_SECRET,
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
