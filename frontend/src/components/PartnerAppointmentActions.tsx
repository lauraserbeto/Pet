import { useRef, useState } from "react";
import type { Appointment, PartnerAppointmentStatus } from "../lib/services/appointmentService";
import { partnerCanTransition } from "../lib/partnerSchedule";
import { appointmentMoney } from "../lib/appointmentBooking";
import { useUpdateAppointmentStatus } from "../lib/hooks/usePartnerAppointments";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { HamsterLoader } from "./ui/HamsterLoader";

const actions: { status: PartnerAppointmentStatus; label: string; confirm: string }[] = [
  { status: "CONFIRMADO", label: "Confirmar", confirm: "Confirmar atendimento" },
  { status: "RECUSADO", label: "Recusar", confirm: "Recusar solicitação" },
  { status: "CONCLUIDO", label: "Concluir", confirm: "Concluir atendimento" },
  { status: "CANCELADO", label: "Cancelar", confirm: "Cancelar atendimento" },
];

export function PartnerAppointmentActions({
  appointment,
  now,
}: {
  appointment: Appointment;
  now: number;
}) {
  const [selection, setSelection] = useState<{
    status: PartnerAppointmentStatus;
    appointment: Appointment;
  } | null>(null);
  const mutation = useUpdateAppointmentStatus();
  const trigger = useRef<HTMLButtonElement | null>(null);
  const running = useRef(false);
  const currentAction = actions.find((item) => item.status === selection?.status);
  const exits = selection?.status === "RECUSADO" || selection?.status === "CANCELADO";
  const submit = async () => {
    if (!selection || running.current) return;
    running.current = true;
    try {
      await mutation.mutateAsync(selection);
      setSelection(null);
    } catch {
      /* A mutation apresenta o erro e mantém o diálogo para conferência. */
    } finally {
      running.current = false;
    }
  };
  const available = actions.filter((action) =>
    partnerCanTransition(appointment, action.status, now)
  );
  return (
    <>
      {appointment.status === "CONFIRMADO" && now < new Date(appointment.start_time).getTime() && (
        <p className="text-sm text-slate-600">
          A conclusão será liberada a partir do horário de início.
        </p>
      )}
      {appointment.payment_policy === "PRE_PAGO" &&
        ["AGUARDANDO_CONFIRMACAO", "CONFIRMADO"].includes(appointment.status) &&
        appointment.payment?.status !== "APPROVED" && (
          <p role="alert" className="text-sm text-amber-800">
            Pagamento inconsistente. É necessária conciliação antes de alterar o agendamento.
          </p>
        )}
      <div className="flex flex-wrap gap-2">
        {available.map((action) => (
          <Button
            key={action.status}
            variant={
              action.status === "RECUSADO" || action.status === "CANCELADO" ? "outline" : "default"
            }
            disabled={mutation.isPending}
            aria-haspopup="dialog"
            onClick={(event) => {
              trigger.current = event.currentTarget;
              mutation.reset();
              setSelection({ status: action.status, appointment });
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <Dialog
        open={!!selection}
        onOpenChange={(open) => {
          if (!open && !running.current) setSelection(null);
        }}
      >
        <DialogContent
          className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <DialogTitle>{currentAction?.confirm}</DialogTitle>
          <DialogDescription>
            {selection?.appointment.pet?.name} · {selection?.appointment.service?.name}.
            {exits
              ? " Esta solicitação será encerrada."
              : selection?.status === "CONCLUIDO"
                ? " Registre a conclusão somente se o atendimento foi realizado."
                : " O tutor verá a confirmação no histórico."}
            {exits &&
              selection?.appointment.payment?.status === "APPROVED" &&
              ` Será registrado o estorno integral simulado de ${appointmentMoney(selection.appointment.payment.amount)}. Nenhum valor real será movimentado.`}
          </DialogDescription>
          {mutation.isPending && <HamsterLoader size="sm" message="Atualizando agendamento..." />}
          {mutation.isError && (
            <p role="alert" className="text-sm text-red-700">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Não foi possível atualizar o agendamento."}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setSelection(null)}
            >
              Voltar
            </Button>
            <Button disabled={mutation.isPending} onClick={() => void submit()}>
              {mutation.isPending ? "Processando..." : currentAction?.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
