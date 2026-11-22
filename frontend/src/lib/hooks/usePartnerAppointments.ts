import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import {
  appointmentService,
  type Appointment,
  type PartnerAppointmentStatus,
} from "../services/appointmentService";
import { appointmentSnapshot, partnerCanTransition } from "../partnerSchedule";

export function usePartnerAppointments() {
  const { user, token } = useAuth();
  const query = useQuery({
    queryKey: ["appointments", user?.id, "provider"],
    queryFn: appointmentService.provider,
    enabled: !!token && !!user && [3, 4].includes(user.role_id),
    refetchInterval: 15000,
  });
  return query;
}

export function useUpdateAppointmentStatus() {
  const { user } = useAuth();
  const client = useQueryClient();
  const prefix = ["appointments", user?.id];
  return useMutation({
    mutationFn: async ({
      appointment,
      status,
    }: {
      appointment: Appointment;
      status: PartnerAppointmentStatus;
    }) => {
      const latest = await appointmentService.get(appointment.id);
      if (appointmentSnapshot(latest) !== appointmentSnapshot(appointment))
        throw new Error(
          "O agendamento mudou. Feche esta confirmação e confira os dados atualizados antes de tentar novamente."
        );
      if (!partnerCanTransition(latest, status, Date.now()))
        throw new Error(
          "Esta ação não está mais disponível para o status, pagamento ou horário atual. Atualize a agenda."
        );
      return appointmentService.updateStatus(appointment.id, status);
    },
    onSuccess: (item) => {
      client.setQueryData([...prefix, "provider"], (previous: Appointment[] | undefined) =>
        previous?.map((value) => (value.id === item.id ? item : value))
      );
      client.setQueryData([...prefix, item.id], item);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: prefix });
    },
  });
}
