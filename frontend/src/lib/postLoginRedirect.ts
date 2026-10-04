export type PostLoginIntent = "checkout";

export interface PostLoginRedirect {
  returnTo: string;
  intent?: PostLoginIntent;
}

const STORAGE_KEY = "petplus_post_login_redirect";

export function isSafeInternalPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("://") &&
    !path.includes("\\")
  );
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

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function getPostLoginRedirect(routeState?: unknown): PostLoginRedirect | null {
  const fromRoute = normalizeRedirect(routeState);
  if (fromRoute) return fromRoute;

  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return normalizeRedirect(JSON.parse(stored));
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearPostLoginRedirect() {
  sessionStorage.removeItem(STORAGE_KEY);
}
