// Centraliza e valida as variáveis de ambiente essenciais no boot.
// Estratégia fail-fast: se uma configuração obrigatória estiver ausente, a
// aplicação NÃO sobe em um estado inseguro ou sem acesso ao banco.
require('dotenv').config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[CONFIG] ${name} não definido. Defina a variável ${name} no ambiente ` +
      '(arquivo .env em desenvolvimento; secrets manager em produção) antes de iniciar o servidor.'
    );
  }
  return value.trim();
}

function warnIfInvalidUrl(name, value) {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.host) {
      throw new Error('Invalid URL origin');
    }
  } catch {
    console.warn(`[CONFIG] Aviso: ${name} não parece ser uma URL válida.`);
  }
}

const JWT_SECRET = requireEnv('JWT_SECRET');
const DATABASE_URL = requireEnv('DATABASE_URL');
const FRONTEND_URL = requireEnv('FRONTEND_URL');

if (JWT_SECRET.length < 32) {
  console.warn(
    '[CONFIG] Aviso: JWT_SECRET tem menos de 32 caracteres. ' +
    'Recomenda-se um segredo aleatório e longo (ex.: `openssl rand -hex 32`).'
  );
}

if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  console.warn('[CONFIG] Aviso: DATABASE_URL não parece apontar para PostgreSQL.');
}

warnIfInvalidUrl('FRONTEND_URL', FRONTEND_URL);

module.exports = {
  JWT_SECRET,
  DATABASE_URL,
  FRONTEND_URL,
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
