import { matchPath } from "react-router";
import type { AuthUser } from "../contexts/AuthContext";

export const DASHBOARD_ROLES: Record<
  "ANY" | "ADMIN" | "PARTNER" | "STORE" | "BOOKING",
  readonly number[]
> = {
  ANY: [1, 2, 3, 4],
  ADMIN: [1],
  PARTNER: [2, 3, 4],
  STORE: [2],
  BOOKING: [3, 4],
};

// Compartilhado por rotas, menu e retomada do login. A API mantém sua própria autorização.
export const DASHBOARD_ACCESS = {
  "/dashboard": DASHBOARD_ROLES.ANY,
  "/dashboard/conta": DASHBOARD_ROLES.ANY,
  "/dashboard/perfil": DASHBOARD_ROLES.PARTNER,
  "/dashboard/schedule": DASHBOARD_ROLES.BOOKING,
  "/dashboard/financeiro": DASHBOARD_ROLES.PARTNER,
  "/dashboard/orders": DASHBOARD_ROLES.STORE,
  "/dashboard/customers": DASHBOARD_ROLES.PARTNER,
  "/dashboard/products": DASHBOARD_ROLES.STORE,
  "/dashboard/servicos": DASHBOARD_ROLES.BOOKING,
  "/dashboard/settings": DASHBOARD_ROLES.ADMIN,
  "/dashboard/aprovacoes": DASHBOARD_ROLES.ADMIN,
  "/dashboard/usuarios": DASHBOARD_ROLES.ADMIN,
  "/dashboard/avaliacoes-sitters": DASHBOARD_ROLES.ADMIN,
};

const OTHER_PROTECTED_ROUTES: Record<string, readonly number[]> = {
  "/tutor/perfil": [5],
  "/tutor/pets": [5],
  "/tutor/agendamentos": [5],
  "/tutor/agendar/:providerId": [5],
  "/tutor/pedidos": [5],
  "/checkout": [5],
  "/checkout/payment": [5],
  "/checkout/success": [5],
  "/appointments": [5],
  "/onboarding/sitter": [4],
  "/parceiro/corrigir-cadastro": [2, 3, 4],
};

export function rolesForPath(pathname: string): readonly number[] | null {
  for (const [pattern, roles] of Object.entries({
    ...DASHBOARD_ACCESS,
    ...OTHER_PROTECTED_ROUTES,
  })) {
    if (matchPath({ path: pattern, end: true }, pathname)) return roles;
  }
  return null;
}

type AccessUser = Pick<AuthUser, "role_id" | "provider_status" | "onboarding_step">;

export function restrictedAccountDestination(user: AccessUser): string | null {
  if ([2, 3].includes(user.role_id) && user.provider_status !== "APROVADO")
    return user.provider_status === "REJEITADO" ? "/parceiro/corrigir-cadastro" : "/";
  if (
    user.role_id === 4 &&
    (user.onboarding_step !== "COMPLETED" || user.provider_status !== "APROVADO")
  )
    return "/onboarding/sitter";
  return null;
}

export function defaultAccountDestination(user: AccessUser): string {
  return [1, 2, 3, 4].includes(user.role_id) ? "/dashboard" : "/";
}

export function canResumePath(user: AccessUser, path: string): boolean {
  const pathname = new URL(path, "https://petplus.invalid").pathname;
  const roles = rolesForPath(pathname);
  if (roles)
    return (
      roles.includes(user.role_id) &&
      !(/^\/onboarding\/sitter\/?$/i.test(pathname) && !restrictedAccountDestination(user))
    );
  // Rotas protegidas desconhecidas e telas de autenticação não são destinos de retomada.
  return !/^\/(dashboard|tutor|checkout|parceiro|onboarding|login|register|recuperar-senha|redefinir-senha)(\/|$)/i.test(
    pathname
  );
}
