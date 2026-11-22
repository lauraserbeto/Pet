import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { appointmentService } from "../services/appointmentService";

export function useAppointments() {
  const { user, token } = useAuth();
  const client = useQueryClient();
  const key = ["appointments", user?.id] as const;
  const query = useQuery({
    queryKey: [...key, "mine"],
    queryFn: appointmentService.mine,
    enabled: !!token && user?.role_id === 5,
    refetchInterval: 15000,
  });
  return { ...query, invalidate: () => client.invalidateQueries({ queryKey: key }) };
}
