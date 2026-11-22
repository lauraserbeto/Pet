import type { AuthUser } from "../contexts/AuthContext";
import {
  canResumePath,
  defaultAccountDestination,
  restrictedAccountDestination,
  rolesForPath,
} from "./routeAccess";

export type PostLoginIntent = "checkout";

export interface PostLoginRedirect {
  returnTo: string;
  intent?: PostLoginIntent;
}

const STORAGE_KEY = "petplus_post_login_redirect";

export function isSafeInternalPath(path: unknown): path is string {
  if (!(
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("://") &&
    !path.includes("\\") &&
    !Array.from(path).some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)
  ))
    return false;
  try {
    const url = new URL(path, "https://petplus.invalid");
    return url.origin === "https://petplus.invalid" && !/%(?:2f|5c|0[ad])/i.test(url.pathname);
  } catch {
    return false;
  }
}

function isPostLoginIntent(intent: unknown): intent is PostLoginIntent {
  return intent === "checkout";
}

function normalizeRedirect(value: unknown): PostLoginRedirect | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as { returnTo?: unknown; intent?: unknown };
  if (!isSafeInternalPath(candidate.returnTo)) return null;

  return {
    returnTo: candidate.returnTo,
    ...(isPostLoginIntent(candidate.intent) ? { intent: candidate.intent } : {}),
  };
}

export function rememberPostLoginRedirect(redirect: PostLoginRedirect) {
  const normalized = normalizeRedirect(redirect);
  if (!normalized) return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* Estado da rota ainda pode preservar o destino. */
  }
}

export function getPostLoginRedirect(routeState?: unknown): PostLoginRedirect | null {
  const fromRoute = normalizeRedirect(routeState);
  if (fromRoute) return fromRoute;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const normalized = normalizeRedirect(JSON.parse(stored));
    if (!normalized) clearPostLoginRedirect();
    return normalized;
  } catch {
    clearPostLoginRedirect();
    return null;
  }
}

export function clearPostLoginRedirect() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Login não depende do storage opcional. */
  }
}

export function resolvePostLoginDestination(
  user: AuthUser,
  redirect: PostLoginRedirect | null
): string {
  const restricted = restrictedAccountDestination(user);
  if (restricted) return restricted;
  if (redirect && isSafeInternalPath(redirect.returnTo) && canResumePath(user, redirect.returnTo)) {
    const url = new URL(redirect.returnTo, "https://petplus.invalid");
    return `${url.pathname}${url.search}${url.hash}`;
  }
  return defaultAccountDestination(user);
}

export function rememberProtectedLocation(location: {
  pathname: string;
  search: string;
  hash: string;
}): void {
  if (rolesForPath(location.pathname))
    rememberPostLoginRedirect({
      returnTo: `${location.pathname}${location.search}${location.hash}`,
    });
}
