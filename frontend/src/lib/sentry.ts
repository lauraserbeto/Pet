import * as Sentry from "@sentry/react";
import type { ErrorEvent, EventHint, Breadcrumb } from "@sentry/react";

/**
 * Observabilidade de erros do front (UX-0).
 *
 * O Sentry só é inicializado quando `VITE_SENTRY_DSN` existe — sem DSN a
 * aplicação roda normalmente e nada é enviado (dev local e CI ficam limpos).
 *
 * Nenhum dado sensível sai daqui: `sendDefaultPii: false` desliga o envio
 * automático de IP/headers, o `beforeSend` remove o usuário e redige campos
 * sensíveis, e os breadcrumbs perdem a query string das URLs.
 */

const DSN = import.meta.env.VITE_SENTRY_DSN;

/** Chaves cujo valor nunca deve ser enviado (senha, token, CPF/CNPJ, cartão). */
const SENSITIVE_KEY =
  /(pass|senha|token|secret|authorization|cookie|document|cpf|cnpj|card|cvv)/i;

const REDACTED = "[Filtrado]";

/** Redige recursivamente valores de chaves sensíveis. */
function scrub(value: unknown, depth = 0): unknown {
  if (value == null || depth > 6) return value;
  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1));
  if (typeof value !== "object") return value;

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrub(item, depth + 1);
  }
  return result;
}

/**
 * O corpo da requisição chega do SDK como string JSON crua, não como objeto —
 * `scrub` sozinho passaria direto por ela. Aqui a string é desserializada,
 * redigida e re-serializada; corpo não-JSON é descartado inteiro, porque não
 * há como redigi-lo com segurança.
 */
function scrubData(data: unknown): unknown {
  if (typeof data !== "string") return scrub(data);
  try {
    return JSON.stringify(scrub(JSON.parse(data)));
  } catch {
    return REDACTED;
  }
}

/** Remove a query string — tokens de reset de senha trafegam por ali. */
function stripQuery(url?: string): string | undefined {
  return url?.split("?")[0];
}

function beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  // Sem identificação de usuário: o requestId do backend já basta para suporte.
  delete event.user;

  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    event.request.url = stripQuery(event.request.url);
    event.request.data = scrubData(event.request.data);
  }

  event.extra = scrub(event.extra) as ErrorEvent["extra"];
  event.contexts = scrub(event.contexts) as ErrorEvent["contexts"];

  return event;
}

function beforeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (breadcrumb.data?.url) {
    breadcrumb.data.url = stripQuery(String(breadcrumb.data.url));
  }
  return breadcrumb;
}

export function initSentry(): void {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    beforeSend,
    beforeBreadcrumb,
  });
}

/** Exportado apenas para teste. */
export const __test__ = { scrub, scrubData, stripQuery, beforeSend, beforeBreadcrumb };
