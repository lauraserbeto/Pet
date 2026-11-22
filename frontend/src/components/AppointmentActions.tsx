import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { appointmentService, type Appointment } from "../lib/services/appointmentService";
import { appointmentMoney } from "../lib/appointmentBooking";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";

export function AppointmentActions({
  appointment,
  onUpdated,
}: {
  appointment: Appointment;
  onUpdated?: (value: Appointment) => void;
}) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [action, setAction] = useState<"pay" | "cancel" | null>(null);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState("");
  const future = new Date(appointment.start_time).getTime() > Date.now();
  const canPay =
    future &&
    appointment.status === "PENDENTE" &&
    appointment.payment_policy === "PRE_PAGO" &&
    !appointment.payment;
  const canCancel =
    future && ["PENDENTE", "AGUARDANDO_CONFIRMACAO", "CONFIRMADO"].includes(appointment.status);
  const run = async () => {
    if (!action || running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const latest = await appointmentService.get(appointment.id);
      if (latest.status !== appointment.status || latest.total_price !== appointment.total_price) {
        onUpdated?.(latest);
        throw new Error(
          "O agendamento foi atualizado. Confira os dados antes de confirmar novamente."
        );
      }
      const result = await appointmentService[action](appointment.id);
      onUpdated?.(result);
      setAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a operação.");
    } finally {
      void client.invalidateQueries({ queryKey: ["appointments", user?.id] });
      running.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canPay && (
          <Button
            onClick={() => {
              setError("");
              setAction("pay");
            }}
          >
            Pagar agendamento
          </Button>
        )}
        {canCancel && (
          <Button
            variant="outline"
            onClick={() => {
              setError("");
              setAction("cancel");
            }}
          >
            Cancelar agendamento
          </Button>
        )}
      </div>
      <Dialog
        open={!!action}
        onOpenChange={(open) => {
          if (!open && !busy) setAction(null);
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
          <DialogTitle>
            {action === "pay" ? "Confirmar pagamento" : "Cancelar agendamento?"}
          </DialogTitle>
          <DialogDescription>
            {action === "pay"
              ? `Total: ${appointmentMoney(appointment.total_price)}. Pagamento simulado — nenhum valor real será cobrado.`
              : appointment.payment?.status === "APPROVED"
                ? `Será registrado o estorno integral simulado de ${appointmentMoney(appointment.payment.amount)}.`
                : "A solicitação será cancelada. Nenhum valor foi pago online."}
          </DialogDescription>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setAction(null)}>
              Voltar
            </Button>
            <Button disabled={busy} onClick={() => void run()}>
              {busy
                ? "Processando..."
                : action === "pay"
                  ? "Confirmar pagamento simulado"
                  : "Confirmar cancelamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
