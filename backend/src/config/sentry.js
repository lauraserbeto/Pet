// Observabilidade de erros do backend (UX-0).
//
// O Sentry só é inicializado quando SENTRY_DSN existe — sem DSN a API sobe
// normalmente e nada é enviado (dev local e testes ficam limpos).
//
// Este módulo precisa ser carregado ANTES do express e dos demais pacotes:
// o SDK instrumenta os módulos no momento do require.
const Sentry = require('@sentry/node');

const env = require('./env');

/** Chaves cujo valor nunca deve sair da aplicação. */
const SENSITIVE_KEY =
  /(pass|senha|token|secret|authorization|cookie|document|cpf|cnpj|card|cvv)/i;

const REDACTED = '[Filtrado]';

/** Redige recursivamente valores de chaves sensíveis. */
function scrub(value, depth = 0) {
  if (value == null || depth > 6) return value;
  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1));
  if (typeof value !== 'object') return value;

  const result = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrub(item, depth + 1);
  }
  return result;
}

/**
 * O corpo da requisição chega do SDK como string JSON crua, não como objeto —
 * `scrub` sozinho passaria direto por ela. Aqui a string é desserializada,
 * redigida e re-serializada; corpo não-JSON (form-data, texto) é descartado
 * inteiro, porque não há como redigi-lo com segurança.
 */
function scrubData(data) {
  if (typeof data !== 'string') return scrub(data);
  try {
    return JSON.stringify(scrub(JSON.parse(data)));
  } catch {
    return REDACTED;
  }
}

/** Remove a query string — tokens de reset de senha trafegam por ali. */
function stripQuery(url) {
  return typeof url === 'string' ? url.split('?')[0] : url;
}

/**
 * Último filtro antes do envio: fora usuário, cookies e headers (o header
 * Authorization carrega o JWT), e o corpo da requisição vai redigido.
 */
function beforeSend(event) {
  delete event.user;

  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    event.request.url = stripQuery(event.request.url);
    event.request.query_string = undefined;
    event.request.data = scrubData(event.request.data);
  }

  event.extra = scrub(event.extra);
  event.contexts = scrub(event.contexts);

  return event;
}

function initSentry() {
  if (!env.SENTRY_DSN) return false;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    sendDefaultPii: false,
    beforeSend,
  });

  return true;
}

/**
 * Reporta um erro inesperado, anexando só metadados não sensíveis da
 * requisição (método, rota e o correlation id que o cliente também recebe).
 */
function captureError(err, req) {
  Sentry.captureException(err, {
    tags: { requestId: req?.id },
    contexts: {
      request: {
        method: req?.method,
        route: req?.route?.path || stripQuery(req?.originalUrl),
      },
    },
  });
}

module.exports = { initSentry, captureError, __test__: { scrub, scrubData, stripQuery, beforeSend } };
