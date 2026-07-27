import { useQuery } from "@tanstack/react-query";
import { providerService } from "../services/providerService";

export const completenessQueryKey = ["completeness"] as const;

/**
 * Completude do perfil público do parceiro (usado no banner do dashboard).
 *
 * Fica no React Query para que o valor possa ser invalidado após salvar o
 * perfil — antes era buscado uma única vez na montagem do DashboardLayout, que
 * não desmonta ao navegar, deixando o banner congelado no estado do login.
 */
export function useCompleteness(enabled: boolean) {
  return useQuery({
    queryKey: completenessQueryKey,
    queryFn: () => providerService.fetchCompleteness(),
    enabled,
    staleTime: 30_000,
  });
}
