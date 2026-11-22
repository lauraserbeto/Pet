import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { petService, type PetInput } from "../services/petService";
import { useAuth } from "../../contexts/AuthContext";

export const petsQueryKey = ["pets"] as const;

export function usePets() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: petsQueryKey,
    queryFn: () => petService.list(),
    enabled: Boolean(token),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: petsQueryKey });

  const createMutation = useMutation({
    mutationFn: (payload: PetInput) => petService.create(payload),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PetInput> }) =>
      petService.update(id, payload),
    onSuccess: () => invalidate(),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => petService.remove(id),
    // A API pode recusar por vínculo ativo. Manter o cartão até confirmar.
    onSuccess: () => invalidate(),
  });

  return {
    pets: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    createPet: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updatePet: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    removePet: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}
