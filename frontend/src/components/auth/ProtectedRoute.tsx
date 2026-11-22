import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { AccessDenied } from "../dashboard/AccessDenied";
import { HamsterLoader } from "../ui/HamsterLoader";
import { PROVIDER_STATUS } from "../../lib/constants/providerStatus";
import { restrictedAccountDestination } from "../../lib/routeAccess";
import { rememberPostLoginRedirect, type PostLoginIntent } from "../../lib/postLoginRedirect";

// Lojista (2) e Hotel (3) só acessam áreas internas após aprovação do admin.
// O Pet Sitter (4) é exceção: entra pendente para completar o onboarding.
const ROLES_REQUIRING_APPROVAL = [2, 3];

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedRoles?: readonly number[];
  unauthenticatedReturnTo?: string;
  unauthenticatedIntent?: PostLoginIntent;
  /**
   * Libera a rota para o parceiro REJEITADO. Usado só pela tela de correção de
   * cadastro (REC-2): sem isto, o guard mandaria para "/" justamente quem a
   * tela existe para atender, e o sitter recusado cairia no onboarding.
   */
  allowRejectedProvider?: boolean;
  /**
   * Perfil fora de `allowedRoles`: "redirect" (padrão) navega para
   * `deniedRedirectTo`; "inline" mostra AccessDenied no lugar da tela — usado
   * nas rotas internas do painel, onde a pessoa já está no layout dele.
   */
  deniedView?: "redirect" | "inline";
  deniedRedirectTo?: string;
  deniedMessage?: string;
}

const PENDING_TOAST_ID = "provider-pending-access";

export const ProtectedRoute = ({
  children,
  adminOnly = false,
  allowedRoles,
  unauthenticatedReturnTo,
  unauthenticatedIntent,
  allowRejectedProvider = false,
  deniedView = "redirect",
  deniedRedirectTo = "/",
  deniedMessage,
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isRejectedAndAllowed =
    allowRejectedProvider && user?.provider_status === PROVIDER_STATUS.REJECTED;
  const onSitterOnboarding = /^\/onboarding\/sitter\/?$/i.test(location.pathname);
  const restriction = user && !isRejectedAndAllowed ? restrictedAccountDestination(user) : null;
  const accountRedirect =
    restriction === "/onboarding/sitter" && onSitterOnboarding
      ? null
      : restriction ||
        (user?.role_id === 4 && onSitterOnboarding && !isRejectedAndAllowed ? "/dashboard" : null);

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
      if (deniedView === "redirect") navigate(deniedRedirectTo, { replace: true });
      return;
    }

    if (accountRedirect) {
      if (accountRedirect === "/" && ROLES_REQUIRING_APPROVAL.includes(user.role_id)) {
        toast.info("Seu cadastro de parceiro ainda está em análise.", {
          id: PENDING_TOAST_ID,
          description: "O painel será liberado após a aprovação da equipe Pet+.",
        });
      }
      navigate(accountRedirect, { replace: true });
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    adminOnly,
    allowedRoles,
    deniedView,
    deniedRedirectTo,
    navigate,
    location.pathname,
    location.search,
    location.hash,
    unauthenticatedReturnTo,
    unauthenticatedIntent,
    isRejectedAndAllowed,
    accountRedirect,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HamsterLoader size="sm" message="Verificando sua sessão..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (adminOnly && user.role_id !== 1) return null;
  if (allowedRoles && !allowedRoles.includes(user.role_id))
    return deniedView === "inline" ? <AccessDenied message={deniedMessage} /> : null;
  if (accountRedirect) return null;

  return <>{children}</>;
};
