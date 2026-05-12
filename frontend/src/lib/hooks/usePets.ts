import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { petService, type Pet, type PetInput } from "../services/petService";
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: petsQueryKey });
      const previous = queryClient.getQueryData<Pet[]>(petsQueryKey);
      if (previous) {
        queryClient.setQueryData<Pet[]>(
          petsQueryKey,
          previous.filter((p) => p.id !== id)
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(petsQueryKey, context.previous);
      }
    },
    onSettled: () => invalidate(),
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
