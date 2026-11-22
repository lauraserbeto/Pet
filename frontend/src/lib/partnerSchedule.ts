import { addDays, startOfDay, startOfWeek } from "date-fns";
import type { Appointment, PartnerAppointmentStatus } from "./services/appointmentService";

export function scheduleDays(date: Date, view: "day" | "week") {
  const start = view === "week" ? startOfWeek(date, { weekStartsOn: 1 }) : startOfDay(date);
  return Array.from({ length: view === "week" ? 7 : 1 }, (_, index) => addDays(start, index));
}

// Intervalos semiabertos: terminar à meia-noite não ocupa o dia seguinte.
export function appointmentsOnDay(items: Appointment[], day: Date) {
  const from = startOfDay(day).getTime(),
    to = addDays(startOfDay(day), 1).getTime();
  return items
    .filter(
      (item) => new Date(item.start_time).getTime() < to && new Date(item.end_time).getTime() > from
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime() ||
        a.id.localeCompare(b.id)
    );
}

export function partnerCanTransition(
  item: Appointment,
  target: PartnerAppointmentStatus,
  now: number
) {
  const start = new Date(item.start_time).getTime();
  if (!Number.isFinite(start)) return false;
  if (
    item.payment_policy === "PRE_PAGO" &&
    ["AGUARDANDO_CONFIRMACAO", "CONFIRMADO"].includes(item.status) &&
    item.payment?.status !== "APPROVED"
  )
    return false;
  if (target === "CONFIRMADO" || target === "RECUSADO")
    return (
      (item.status === "PENDENTE" && item.payment_policy === "PRESENCIAL") ||
      (item.status === "AGUARDANDO_CONFIRMACAO" && item.payment_policy === "PRE_PAGO")
    );
  if (target === "CANCELADO") return item.status === "CONFIRMADO" && now < start;
  return item.status === "CONFIRMADO" && now >= start;
}

export function partnerStatusLabel(item: Appointment) {
  if (item.status !== "PENDENTE") return undefined;
  return item.payment_policy === "PRE_PAGO"
    ? "Aguardando pagamento do tutor"
    : item.payment_policy === "PRESENCIAL"
      ? "Aguardando sua confirmação"
      : "Política de pagamento não informada";
}

export function appointmentSnapshot(item: Appointment) {
  return JSON.stringify([
    item.status,
    item.total_price,
    item.start_time,
    item.end_time,
    item.service_id,
    item.pet_id,
    item.payment_policy,
    item.payment?.status,
    item.payment?.amount,
  ]);
}
