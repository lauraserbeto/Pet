import { useEffect, useState } from "react";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { HamsterLoader } from "../../components/ui/HamsterLoader";
import { AppointmentSummary } from "../../components/AppointmentSummary";
import { PartnerAppointmentActions } from "../../components/PartnerAppointmentActions";
import { usePartnerAppointments } from "../../lib/hooks/usePartnerAppointments";
import { appointmentsOnDay, partnerStatusLabel, scheduleDays } from "../../lib/partnerSchedule";
import { APPOINTMENT_LABELS } from "../../lib/appointmentBooking";
import type { AppointmentStatus } from "../../lib/services/appointmentService";

export function Schedule() {
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [view, setView] = useState<"day" | "week">("day");
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
  const [now, setNow] = useState(Date.now);
  const query = usePartnerAppointments();
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const days = scheduleDays(date, view);
  const items = (query.data || []).filter((item) => status === "all" || item.status === status);
  const hasItems = days.some((day) => appointmentsOnDay(items, day).length > 0);
  const period =
    view === "day"
      ? format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
      : `${format(days[0], "dd/MM/yyyy")} a ${format(days[6], "dd/MM/yyyy")}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <section className="min-w-0 space-y-5" aria-label="Agenda do parceiro">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-600">Solicitações e atendimentos dos seus serviços.</p>
          <p className="text-xs text-slate-500">Horários no seu fuso: {timezone}.</p>
        </div>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Atualizar agenda
        </Button>
      </header>
      <div className="space-y-4 rounded-xl border bg-white p-4">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Navegação do período"
        >
          <Button
            variant="outline"
            size="icon"
            aria-label={view === "day" ? "Dia anterior" : "Semana anterior"}
            onClick={() => setDate((current) => addDays(current, view === "day" ? -1 : -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={view === "day" ? "Próximo dia" : "Próxima semana"}
            onClick={() => setDate((current) => addDays(current, view === "day" ? 1 : 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setDate(startOfDay(new Date()))}>
            Hoje
          </Button>
          <span className="min-w-0 text-sm font-semibold" aria-live="polite">
            {period}
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="block min-w-0 space-y-1 text-sm">
            Data da agenda
            <input
              type="date"
              value={format(date, "yyyy-MM-dd")}
              onChange={(event) => {
                const next = parseISO(event.target.value);
                if (Number.isFinite(next.getTime())) setDate(startOfDay(next));
              }}
              className="block max-w-full rounded-md border p-2"
            />
          </label>
          <div
            className="flex gap-1 rounded-lg bg-slate-100 p-1"
            role="group"
            aria-label="Visualização da agenda"
          >
            {(["day", "week"] as const).map((value) => (
              <Button
                key={value}
                variant={view === value ? "default" : "ghost"}
                aria-pressed={view === value}
                onClick={() => setView(value)}
              >
                {value === "day" ? "Dia" : "Semana"}
              </Button>
            ))}
          </div>
          <label className="block min-w-0 space-y-1 text-sm">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="block max-w-full rounded-md border bg-white p-2"
            >
              <option value="all">Todos</option>
              {Object.entries(APPOINTMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {query.isPending ? (
        <HamsterLoader message="Carregando agenda..." />
      ) : (
        <>
          {query.isError && (
            <div role="alert" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
              <p>
                {query.data
                  ? "Não foi possível atualizar a agenda. Os dados abaixo podem estar desatualizados."
                  : "Não foi possível carregar a agenda."}
              </p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}
          {!query.isError && !hasItems && (
            <p role="status" className="rounded-lg border bg-white p-8 text-center text-slate-600">
              Nenhum agendamento {status === "all" ? "" : "com este status "}neste{" "}
              {view === "day" ? "dia" : "período"}.
            </p>
          )}
          {hasItems && (
            <div className="space-y-6" aria-busy={query.isFetching}>
              {days.map((day) => {
                const dayItems = appointmentsOnDay(items, day);
                // Usa todos os horários reais, inclusive madrugada e hospedagens que atravessam dias.
                const slots = [
                  ...new Set(
                    dayItems.map((item) =>
                      Math.max(new Date(item.start_time).getTime(), day.getTime())
                    )
                  ),
                ];
                return (
                  <section
                    key={day.toISOString()}
                    aria-label={format(day, "dd/MM/yyyy")}
                    className="space-y-3"
                  >
                    <h2 className="font-semibold capitalize text-slate-800">
                      {format(day, "EEEE, dd/MM/yyyy", { locale: ptBR })}
                    </h2>
                    {!dayItems.length ? (
                      <p className="text-sm text-slate-500">Nenhum agendamento neste dia.</p>
                    ) : (
                      slots.map((slot) => (
                        <div
                          key={slot}
                          className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] gap-2 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-4"
                        >
                          <time
                            dateTime={new Date(slot).toISOString()}
                            className="pt-5 text-sm font-semibold text-slate-600"
                          >
                            {format(slot, "HH:mm")}
                          </time>
                          <div className="min-w-0 space-y-3 border-l border-slate-200 pl-2 sm:pl-4">
                            {dayItems
                              .filter(
                                (item) =>
                                  Math.max(new Date(item.start_time).getTime(), day.getTime()) ===
                                  slot
                              )
                              .map((item) => (
                                <AppointmentSummary
                                  key={item.id}
                                  appointment={item}
                                  statusLabel={partnerStatusLabel(item)}
                                  actions={
                                    <PartnerAppointmentActions appointment={item} now={now} />
                                  }
                                >
                                  <div className="space-y-1 break-words text-sm text-slate-600">
                                    {new Date(item.start_time) < day && (
                                      <p className="font-medium">
                                        Atendimento iniciado em dia anterior.
                                      </p>
                                    )}
                                    {item.pet?.tutor && <p>Tutor: {item.pet.tutor.full_name}</p>}
                                    {item.pet?.tutor?.phone && (
                                      <p>Telefone: {item.pet.tutor.phone}</p>
                                    )}
                                    {item.notes && (
                                      <p className="whitespace-pre-wrap">
                                        Observações: {item.notes}
                                      </p>
                                    )}
                                  </div>
                                </AppointmentSummary>
                              ))}
                          </div>
                        </div>
                      ))
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
