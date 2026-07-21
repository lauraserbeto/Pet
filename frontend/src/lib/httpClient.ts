import { API_URL } from "./api";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

const TOKEN_KEY = "petplus_token";

// Timeout padrão de requisição. Sem isso, uma API pendurada deixa o usuário
// preso num spinner infinito (ver critério F9 — Resiliência de Rede).
const DEFAULT_TIMEOUT_MS = 20000;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Sobrescreve o timeout padrão (ms). */
  timeoutMs?: number;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    /* sem corpo */
  }

  // Shape novo: { error: { code, message, details } }
  if (payload?.error && typeof payload.error === "object") {
    return new ApiError(
      response.status,
      payload.error.code ?? "UNKNOWN",
      payload.error.message ?? response.statusText,
      payload.error.details
    );
  }

  // Shape legado: { error: "string" } ou { message: "string" }
  const message =
    (typeof payload?.error === "string" && payload.error) ||
    payload?.message ||
    response.statusText ||
    "Erro na requisição";

  return new ApiError(response.status, "LEGACY", message);
}

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    body,
    auth = true,
    query,
    headers: extraHeaders,
    timeoutMs,
    signal: externalSignal,
    ...init
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Timeout de requisição + suporte a cancelamento externo (ex.: troca de rota
  // no TanStack Query). O AbortController próprio garante que a requisição não
  // fique pendente indefinidamente.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS);
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const name = (err as { name?: string })?.name;
    // Aborto por cancelamento externo (rota trocada) → propaga p/ o chamador ignorar.
    if (name === "AbortError" && externalSignal?.aborted) {
      throw err;
    }
    // Aborto pelo nosso timeout.
    if (name === "AbortError") {
      throw new ApiError(0, "TIMEOUT", "Tempo de resposta esgotado. Verifique sua conexão e tente novamente.");
    }
    // Falha de rede (offline, DNS, servidor indisponível).
    throw new ApiError(0, "NETWORK", "Falha de conexão com o servidor. Verifique sua internet e tente novamente.");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 && auth) {
    onUnauthorized?.();
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const httpClient = {
  get: <T = unknown>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T = unknown>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
