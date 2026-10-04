// Centraliza e valida as variáveis de ambiente essenciais no boot.
// Estratégia fail-fast: se uma configuração obrigatória estiver ausente, a
// aplicação NÃO sobe em um estado inseguro ou sem acesso ao banco.
require("dotenv").config();

const NODE_ENV = process.env.NODE_ENV || "development";

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[CONFIG] ${name} não definido. Defina a variável ${name} no ambiente ` +
        "(arquivo .env em desenvolvimento; secrets manager em produção) antes de iniciar o servidor.",
    );
  }
  return value.trim();
}

function requireEnvInProduction(name) {
  const value = process.env[name];
  if (value && value.trim().length > 0) {
    return value.trim();
  }

  if (NODE_ENV === "production") {
    throw new Error(
      `[CONFIG] ${name} não definido. Defina a variável ${name} no ambiente ` +
        "(arquivo .env em desenvolvimento; secrets manager em produção) antes de iniciar o servidor.",
    );
  }

  if (process.env.LOG_LEVEL !== "silent") {
    console.warn(
      `[CONFIG] Aviso: ${name} não definido. Recursos dependentes ficarão indisponíveis.`,
    );
  }
  return null;
}

function warnIfInvalidUrl(name, value) {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.host) {
      throw new Error("Invalid URL origin");
    }
  } catch {
    console.warn(`[CONFIG] Aviso: ${name} não parece ser uma URL válida.`);
  }
}

function extractEmailAddress(value) {
  const displayNameMatch = value.match(/<([^<>]+)>/);
  return (displayNameMatch ? displayNameMatch[1] : value).trim();
}

const JWT_SECRET = requireEnv("JWT_SECRET");
const DATABASE_URL = requireEnv("DATABASE_URL");
const FRONTEND_URL = requireEnv("FRONTEND_URL");
const RESEND_API_KEY = requireEnvInProduction("RESEND_API_KEY");
const EMAIL_FROM = requireEnvInProduction("EMAIL_FROM");
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO?.trim() || null;

if (JWT_SECRET.length < 32) {
  console.warn(
    "[CONFIG] Aviso: JWT_SECRET tem menos de 32 caracteres. " +
      "Recomenda-se um segredo aleatório e longo (ex.: `openssl rand -hex 32`).",
  );
}

if (
  !DATABASE_URL.startsWith("postgresql://") &&
  !DATABASE_URL.startsWith("postgres://")
) {
  console.warn(
    "[CONFIG] Aviso: DATABASE_URL não parece apontar para PostgreSQL.",
  );
}

warnIfInvalidUrl("FRONTEND_URL", FRONTEND_URL);

if (
  EMAIL_FROM &&
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(extractEmailAddress(EMAIL_FROM))
) {
  console.warn("[CONFIG] Aviso: EMAIL_FROM não parece ser um e-mail válido.");
}

if (EMAIL_REPLY_TO && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMAIL_REPLY_TO)) {
  console.warn(
    "[CONFIG] Aviso: EMAIL_REPLY_TO não parece ser um e-mail válido.",
  );
}

module.exports = {
  JWT_SECRET,
  DATABASE_URL,
  FRONTEND_URL,
  RESEND_API_KEY,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  PORT: process.env.PORT || 3000,
  NODE_ENV,
  // Opcional: sem DSN o Sentry fica desabilitado e a API roda normalmente.
  SENTRY_DSN: process.env.SENTRY_DSN || null,
};
