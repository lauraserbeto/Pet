import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addressService,
  type Address,
  type AddressInput,
} from "../services/addressService";
import { useAuth } from "../../contexts/AuthContext";

export const addressesQueryKey = ["addresses"] as const;

export function useAddresses() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: addressesQueryKey,
    queryFn: () => addressService.list(),
    enabled: Boolean(token),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: addressesQueryKey });

  const createMutation = useMutation({
    mutationFn: (payload: AddressInput) => addressService.create(payload),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AddressInput> }) =>
      addressService.update(id, payload),
    onSuccess: () => invalidate(),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => addressService.setDefault(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: addressesQueryKey });
      const previous = queryClient.getQueryData<Address[]>(addressesQueryKey);
      if (previous) {
        const next = previous.map((a) => ({ ...a, is_default: a.id === id }));
        queryClient.setQueryData<Address[]>(addressesQueryKey, next);
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(addressesQueryKey, context.previous);
      }
    },
    onSettled: () => invalidate(),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => addressService.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: addressesQueryKey });
      const previous = queryClient.getQueryData<Address[]>(addressesQueryKey);
      if (previous) {
        queryClient.setQueryData<Address[]>(
          addressesQueryKey,
          previous.filter((a) => a.id !== id)
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(addressesQueryKey, context.previous);
      }
    },
    onSettled: () => invalidate(),
  });

  return {
    addresses: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    createAddress: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateAddress: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    setDefault: setDefaultMutation.mutateAsync,
    isSettingDefault: setDefaultMutation.isPending,

    removeAddress: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}
