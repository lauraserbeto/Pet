import type { BillingUnit } from "./services/serviceService";
import type { AppointmentStatus } from "./services/appointmentService";

export const APPOINTMENT_LABELS: Record<AppointmentStatus, string> = {
  PENDENTE: "Pendente",
  AGUARDANDO_CONFIRMACAO: "Pago · aguardando confirmação",
  CONFIRMADO: "Confirmado",
  CONCLUIDO: "Concluído",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
};
export const appointmentMoney = (amount: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
// Sem segundos: mesmo formato curto dos pedidos (auditoria visual G13).
export const appointmentDate = (date: string) =>
  new Date(date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function bookingPreview(
  price: number,
  unit: BillingUnit,
  start: string,
  end: string,
  now = Date.now()
) {
  const from = new Date(start),
    to = new Date(end);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()))
    throw new Error("Informe o início e o fim.");
  if (from.getTime() <= now) throw new Error("O início deve estar no futuro.");
  if (to <= from) throw new Error("O fim deve ser posterior ao início.");
  if (!Number.isFinite(price) || price <= 0) throw new Error("Serviço sem preço válido.");
  const businessDay = (date: Date) => {
    const value = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    return Date.parse(value + "T00:00:00Z");
  };
  const quantity =
    unit === "DIARIA"
      ? Math.max(1, Math.round((businessDay(to) - businessDay(from)) / 86400000))
      : Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 3600000));
  if (quantity > (unit === "DIARIA" ? 30 : 12))
    throw new Error(unit === "DIARIA" ? "O limite é de 30 diárias." : "O limite é de 12 horas.");
  return {
    quantity,
    total: Math.round(price * quantity * 100) / 100,
    start: from.toISOString(),
    end: to.toISOString(),
  };
}
