import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { isApprovedProviderStatus, PROVIDER_STATUS } from "../../lib/constants/providerStatus";
import { rememberPostLoginRedirect, type PostLoginIntent } from "../../lib/postLoginRedirect";

// Lojista (2) e Hotel (3) só acessam áreas internas após aprovação do admin.
// O Pet Sitter (4) é exceção: entra pendente para completar o onboarding.
const ROLES_REQUIRING_APPROVAL = [2, 3];

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedRoles?: number[];
  unauthenticatedReturnTo?: string;
  unauthenticatedIntent?: PostLoginIntent;
  /**
   * Libera a rota para o parceiro REJEITADO. Usado só pela tela de correção de
   * cadastro (REC-2): sem isto, o guard mandaria para "/" justamente quem a
   * tela existe para atender, e o sitter recusado cairia no onboarding.
   */
  allowRejectedProvider?: boolean;
}

export const ProtectedRoute = ({
  children,
  adminOnly = false,
  allowedRoles,
  unauthenticatedReturnTo,
  unauthenticatedIntent,
  allowRejectedProvider = false,
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isRejectedAndAllowed =
    allowRejectedProvider && user?.provider_status === PROVIDER_STATUS.REJECTED;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      const returnTo =
        unauthenticatedReturnTo ?? `${location.pathname}${location.search}${location.hash}`;
      const redirect = { returnTo, intent: unauthenticatedIntent };

      rememberPostLoginRedirect(redirect);
      navigate("/login", { replace: true, state: redirect });
      return;
    }

    if (adminOnly && user.role_id !== 1) {
      navigate("/", { replace: true });
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role_id)) {
      navigate("/", { replace: true });
      return;
    }

    // Parceiro ainda não aprovado não acessa o dashboard. O backend já barra o
    // login desses perfis; isto é defesa em profundidade (sessão/token antigo).
    if (
      !isRejectedAndAllowed &&
      ROLES_REQUIRING_APPROVAL.includes(user.role_id) &&
      !isApprovedProviderStatus(user.provider_status)
    ) {
      navigate("/", { replace: true });
      return;
    }

    // Pet Sitter (role_id 4): enforce onboarding state machine
    if (user.role_id === 4 && !isRejectedAndAllowed) {
      const step = user.onboarding_step || "INCOMPLETE";
      const onSitterOnboarding = location.pathname === "/onboarding/sitter";
      const needsOnboarding = ["INCOMPLETE", "REJECTED", "IN_REVIEW"].includes(step);

      if (needsOnboarding && !onSitterOnboarding) {
        navigate("/onboarding/sitter", { replace: true });
        return;
      }
      if (step === "COMPLETED" && onSitterOnboarding) {
        navigate("/dashboard", { replace: true });
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    adminOnly,
    allowedRoles,
    navigate,
    location.pathname,
    location.search,
    location.hash,
    unauthenticatedReturnTo,
    unauthenticatedIntent,
    isRejectedAndAllowed,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (adminOnly && user.role_id !== 1) return null;
  if (allowedRoles && !allowedRoles.includes(user.role_id)) return null;
  if (
    !isRejectedAndAllowed &&
    ROLES_REQUIRING_APPROVAL.includes(user.role_id) &&
    !isApprovedProviderStatus(user.provider_status)
  )
    return null;

  return <>{children}</>;
};
