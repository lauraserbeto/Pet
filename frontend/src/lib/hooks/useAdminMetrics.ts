import { useQuery } from "@tanstack/react-query";
import { adminService } from "../services/adminService";

export const adminMetricsQueryKey = ["admin", "metrics"] as const;

/** Métricas da plataforma (somente admin). `enabled` evita chamar para outros papéis. */
export function useAdminMetrics(enabled: boolean, days = 30) {
  return useQuery({
    queryKey: [...adminMetricsQueryKey, days],
    queryFn: () => adminService.getMetrics(days),
    enabled,
    staleTime: 60_000,
  });
}
