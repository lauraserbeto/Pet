import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService, type ChangePasswordDTO, type UpdateProfileDTO } from "../services/userService";
import { useAuth, type AuthUser } from "../../contexts/AuthContext";

export const profileQueryKey = ["me"] as const;

export function useProfile() {
  const { token, setUser } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => userService.getMe(),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfileDTO) => userService.updateMe(payload),
    onSuccess: (updatedUser: AuthUser) => {
      queryClient.setQueryData(profileQueryKey, updatedUser);
      setUser(updatedUser);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordDTO) => userService.changePassword(payload),
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateProfile: updateMutation.mutateAsync,
    isUpdatingProfile: updateMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
  };
}
