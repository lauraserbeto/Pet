// Observabilidade de erros do backend (UX-0).
//
// O Sentry só é inicializado quando SENTRY_DSN existe — sem DSN a API sobe
// normalmente e nada é enviado (dev local e testes ficam limpos).
//
// Este módulo precisa ser carregado ANTES do express e dos demais pacotes:
// o SDK instrumenta os módulos no momento do require.
const Sentry = require("@sentry/node");

const env = require("./env");

/** Chaves cujo valor nunca deve sair da aplicação. */
const SENSITIVE_KEY =
  /(pass|senha|token|secret|authorization|cookie|document|cpf|cnpj|card|cvv|email|phone|full.?name|address)/i;

const REDACTED = "[Filtrado]";

/** Redige recursivamente valores de chaves sensíveis. */
function scrub(value, depth = 0) {
  if (value == null) return value;
  if (depth > 6) return REDACTED;
  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1));
  if (typeof value !== "object") return value;

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
  if (typeof data !== "string") return scrub(data);
  try {
    return JSON.stringify(scrub(JSON.parse(data)));
  } catch {
    return REDACTED;
  }
}

/** Remove a query string — tokens de reset de senha trafegam por ali. */
function stripQuery(url) {
  return typeof url === "string" ? url.split("?")[0] : url;
}

/**
 * Último filtro antes do envio: descarta usuário, corpo, URL, cookies,
 * headers e mensagens brutas. Mantém apenas o contexto técnico permitido.
 */
function beforeSend(event) {
  delete event.user;

  if (event.request) {
    event.request = { method: event.request.method };
  }
  delete event.extra;
  delete event.breadcrumbs;
  delete event.message;
  delete event.logentry;
  event.tags =
    typeof event.tags?.requestId === "string" &&
    /^[0-9a-f-]{36}$/i.test(event.tags.requestId)
      ? { requestId: event.tags.requestId }
      : {};
  const contexts = {};
  for (const key of ["runtime", "os"])
    if (event.contexts?.[key])
      contexts[key] = Object.fromEntries(
        ["name", "version"]
          .filter((field) => Object.hasOwn(event.contexts[key], field))
          .map((field) => [field, event.contexts[key][field]]),
      );
  if (event.contexts?.request)
    contexts.request = {
      method: event.contexts.request.method,
      route: event.contexts.request.route,
    };
  event.contexts = contexts;
  for (const value of event.exception?.values || []) {
    value.value = "Erro interno do servidor";
    if (value.mechanism) delete value.mechanism.data;
    for (const frame of value.stacktrace?.frames || []) delete frame.vars;
  }

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
        route: req?.route?.path || "unmatched",
      },
    },
  });
}

module.exports = {
  initSentry,
  captureError,
  __test__: { scrub, scrubData, stripQuery, beforeSend },
};
