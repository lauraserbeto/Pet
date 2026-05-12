import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
      return;
    }

    if (adminOnly && user.role_id !== 1) {
      navigate("/", { replace: true });
      return;
    }

    // Pet Sitter (role_id 4): enforce onboarding state machine
    if (user.role_id === 4) {
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
  }, [isLoading, isAuthenticated, user, adminOnly, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (adminOnly && user.role_id !== 1) return null;

  return <>{children}</>;
};
