import type { ReactNode } from "react";
import type { Appointment } from "../lib/services/appointmentService";
import { APPOINTMENT_LABELS, appointmentDate, appointmentMoney } from "../lib/appointmentBooking";
import { AppointmentActions } from "./AppointmentActions";
import { ReviewComposer } from "./reviews/ReviewComposer";

// Mesma linguagem dos selos de pedido (orderService.getOrderStatusBadge):
// fundo 50, texto 700, borda 200 — históricos do Tutor com um só padrão (G13).
const statusColors: Record<string, string> = {
  PENDENTE: "bg-amber-50 text-amber-800 border-amber-200",
  AGUARDANDO_CONFIRMACAO: "bg-blue-50 text-blue-700 border-blue-200",
  CONFIRMADO: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CONCLUIDO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RECUSADO: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELADO: "bg-slate-100 text-slate-700 border-slate-200",
};

function paymentLabel(item: Appointment) {
  if (item.payment?.status === "REFUNDED")
    return `Estornado (simulado): ${appointmentMoney(item.payment.amount)}`;
  if (item.payment?.status === "APPROVED") return "Pago (simulado)";
  if (item.payment_policy === "PRESENCIAL") return "Presencial";
  if (item.status === "PENDENTE") return "Aguardando pagamento";
  if (["CANCELADO", "RECUSADO"].includes(item.status)) return "Não pago online";
  return "Pagamento não registrado";
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt>
    <dd className="mt-0.5 text-sm font-medium text-slate-800">{children}</dd>
  </div>
);

export function AppointmentSummary({
  appointment: item,
  onUpdated,
  actions,
  children,
  statusLabel,
}: {
  appointment: Appointment;
  onUpdated?: (value: Appointment) => void;
  actions?: ReactNode;
  children?: ReactNode;
  statusLabel?: string;
}) {
  const isTutorView = actions === undefined;
  return (
    <article
      aria-label={item.service?.name || "Agendamento"}
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {item.provider?.business_name || "Parceiro"}
          </p>
          <h2 className="break-words text-base font-bold text-slate-900">
            {item.service?.name} · {item.pet?.name}
          </h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[item.status] || statusColors.CANCELADO}`}
        >
          {statusLabel || APPOINTMENT_LABELS[item.status]}
        </span>
      </header>
      <div className="space-y-4 px-5 py-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Início">{appointmentDate(item.start_time)}</Field>
          <Field label="Fim">{appointmentDate(item.end_time)}</Field>
          <Field label="Total">
            <span className="font-bold text-slate-900">{appointmentMoney(item.total_price)}</span>
          </Field>
          <Field label="Pagamento">{paymentLabel(item)}</Field>
        </dl>
        {isTutorView && item.status === "PENDENTE" && item.payment_policy === "PRESENCIAL" && (
          <p className="text-sm text-slate-600">
            Solicitação enviada. Aguarde a confirmação do parceiro.
          </p>
        )}
        {children}
      </div>
      <div className="space-y-3 border-t border-slate-100 px-5 py-4 empty:hidden">
        {actions ?? <AppointmentActions appointment={item} onUpdated={onUpdated} />}
        {isTutorView && (
          <ReviewComposer
            completed={item.status === "CONCLUIDO"}
            label={item.service?.name || "atendimento"}
            origin={{ provider_id: item.provider_id, appointment_id: item.id }}
          />
        )}
      </div>
    </article>
  );
}
