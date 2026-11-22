import { httpClient } from "../httpClient";
import type { PaymentPolicy } from "../constants/paymentPolicy";

export type AppointmentStatus =
  "PENDENTE" | "AGUARDANDO_CONFIRMACAO" | "CONFIRMADO" | "CONCLUIDO" | "RECUSADO" | "CANCELADO";
export type PartnerAppointmentStatus = "CONFIRMADO" | "RECUSADO" | "CONCLUIDO" | "CANCELADO";
export interface Appointment {
  id: string;
  provider_id: string;
  service_id: string;
  pet_id: string;
  status: AppointmentStatus;
  start_time: string;
  end_time: string;
  total_price: number;
  payment_policy: PaymentPolicy;
  pet?: {
    id: string;
    name: string;
    tutor?: { id: string; full_name: string; phone?: string | null; email?: string | null };
  };
  notes?: string | null;
  service?: { name: string; category: string; billing_unit?: string };
  provider?: { business_name: string; user?: { role_id: number } };
  payment: null | {
    id: string;
    status: "APPROVED" | "REFUNDED";
    amount: number;
    paid_at: string;
    refunded_at: string | null;
    simulated: true;
  };
}
export interface AppointmentInput {
  service_id: string;
  pet_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
}
export const appointmentService = {
  create: (input: AppointmentInput) => httpClient.post<Appointment>("/appointments", input),
  mine: () => httpClient.get<Appointment[]>("/appointments/my"),
  provider: () => httpClient.get<Appointment[]>("/appointments/provider"),
  updateStatus: (id: string, status: PartnerAppointmentStatus) =>
    httpClient.patch<Appointment>(`/appointments/${id}/status`, { status }),
  get: (id: string) => httpClient.get<Appointment>(`/appointments/${id}`),
  pay: (id: string) => httpClient.post<Appointment>(`/appointments/${id}/pay`, {}),
  cancel: (id: string) =>
    httpClient.patch<Appointment>(`/appointments/${id}/status`, { status: "CANCELADO" }),
};
