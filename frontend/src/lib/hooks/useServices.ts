import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  serviceService,
  type Service,
  type ServiceInput,
} from "../services/serviceService";
import { useAuth } from "../../contexts/AuthContext";

export const servicesQueryKey = ["provider-services"] as const;

/**
 * Serviços do parceiro logado (SRV-F1).
 *
 * A listagem e a criação são o escopo da parte 1; `update` e `remove` ficam
 * prontos aqui para a SRV-F2 consumir sem mexer nesta camada.
 */
export function useServices() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<Service[]>({
    queryKey: servicesQueryKey,
    queryFn: () => serviceService.list(),
    enabled: Boolean(token),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: servicesQueryKey });

  const createMutation = useMutation({
    mutationFn: (payload: ServiceInput) => serviceService.create(payload),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ServiceInput> }) =>
      serviceService.update(id, payload),
    onSuccess: () => invalidate(),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => serviceService.remove(id),
    onSuccess: () => invalidate(),
  });

  return {
    services: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createService: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateService: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    removeService: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}
