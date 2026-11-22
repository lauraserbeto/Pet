import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { providerService } from "../services/providerService";

export function useProviderMetrics(days: number) {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: ["provider-metrics", user?.id, days],
    queryFn: () => providerService.getMetrics(days),
    enabled: !!token && !!user && [2, 3, 4].includes(user.role_id),
    staleTime: 0,
    refetchInterval: 60_000,
  });
}
