import { useQuery } from "@tanstack/react-query";
import { adminService } from "../services/adminService";
import { useAuth } from "../../contexts/AuthContext";

export const adminMetricsQueryKey = ["admin", "metrics"] as const;

/** Métricas da plataforma (somente admin). `enabled` evita chamar para outros papéis. */
export function useAdminMetrics(enabled: boolean, days = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...adminMetricsQueryKey, user?.id, days],
    queryFn: () => adminService.getMetrics(days),
    enabled,
    staleTime: 0,
  });
}
