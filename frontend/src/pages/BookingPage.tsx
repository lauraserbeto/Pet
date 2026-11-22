import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { providerService } from "../lib/services/providerService";
import { petService } from "../lib/services/petService";
import { appointmentService } from "../lib/services/appointmentService";
import type { Service } from "../lib/services/serviceService";
import { bookingPreview, appointmentMoney } from "../lib/appointmentBooking";
import { ApiError } from "../lib/httpClient";
import { Button } from "../components/ui/button";
import { HamsterLoader } from "../components/ui/HamsterLoader";
import { AppointmentSummary } from "../components/AppointmentSummary";

const draftSchema = z.object({
  service: z.string(),
  pet: z.string(),
  start: z.string(),
  end: z.string(),
  notes: z.string(),
  uncertain: z.boolean(),
  createdId: z.string(),
});
const empty = {
  service: "",
  pet: "",
  start: "",
  end: "",
  notes: "",
  uncertain: false,
  createdId: "",
};
function readDraft(key: string) {
  try {
    const parsed = draftSchema.safeParse(JSON.parse(sessionStorage.getItem(key) || "null"));
    return parsed.success ? parsed.data : empty;
  } catch {
    return empty;
  }
}

export function BookingPage() {
  const { providerId } = useParams();
  const { user } = useAuth();
  if (!providerId || !user) return null;
  return <BookingForm key={`${user.id}:${providerId}`} providerId={providerId} userId={user.id} />;
}

function BookingForm({ providerId, userId }: { providerId: string; userId: string }) {
  const key = `petplus_booking:${userId}:${providerId}`;
  const [draft, setDraft] = useState(() => readDraft(key));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);
  const client = useQueryClient();
  const provider = useQuery({
    queryKey: ["booking-provider", providerId],
    queryFn: () => providerService.fetchProviderDetails(providerId),
  });
  const pets = useQuery({ queryKey: ["booking-pets", userId], queryFn: petService.list });
  const result = useQuery({
    queryKey: ["appointments", userId, draft.createdId],
    queryFn: () => appointmentService.get(draft.createdId),
    enabled: !!draft.createdId,
    refetchInterval: 15000,
  });
  const persist = (value: typeof draft) => {
    setDraft(value);
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* O estado em memória continua disponível. */
    }
  };
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(draft));
    } catch {
      /* Storage indisponível. */
    }
  }, [key, draft]);
  const services: Service[] = (provider.data?.services || []).filter(
    (item: Service) => item.is_active
  );
  const selected = services.find((item) => item.id === draft.service);
  let preview: ReturnType<typeof bookingPreview> | undefined;
  let validation = "";
  if (selected && draft.start && draft.end) {
    try {
      if (!["DIARIA", "HORA"].includes(selected.billing_unit))
        throw new Error("Unidade de cobrança não informada.");
      preview = bookingPreview(
        Number(selected.price),
        selected.billing_unit,
        draft.start,
        draft.end
      );
    } catch (err) {
      validation = (err as Error).message;
    }
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (running.current || draft.uncertain || draft.createdId) return;
    if (!preview || !pets.data?.some((item) => item.id === draft.pet)) {
      setError(validation || "Selecione um serviço, um pet e um período válido.");
      return;
    }
    running.current = true;
    setBusy(true);
    setError("");
    // Persistir antes do POST impede repetição automática após timeout ou reload.
    persist({ ...draft, uncertain: true });
    try {
      const created = await appointmentService.create({
        service_id: draft.service,
        pet_id: draft.pet,
        start_time: preview.start,
        end_time: preview.end,
        notes: draft.notes || undefined,
      });
      client.setQueryData(["appointments", userId, created.id], created);
      persist({ ...draft, uncertain: false, createdId: created.id });
      void client.invalidateQueries({ queryKey: ["appointments", userId] });
    } catch (err) {
      const uncertain = !(err instanceof ApiError) || err.status === 0 || err.status >= 500;
      persist({ ...draft, uncertain });
      setError(err instanceof Error ? err.message : "Não foi possível enviar a solicitação.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const field = (name: "service" | "pet" | "start" | "end" | "notes", value: string) =>
    setDraft((current) => ({ ...current, [name]: value }));
  const reconcile = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const list = await appointmentService.mine();
      const matches = list.filter(
        (item) =>
          item.service_id === draft.service &&
          item.pet_id === draft.pet &&
          new Date(item.start_time).getTime() === new Date(draft.start).getTime() &&
          new Date(item.end_time).getTime() === new Date(draft.end).getTime()
      );
      const found =
        matches.find((item) => !["CANCELADO", "RECUSADO"].includes(item.status)) || matches[0];
      if (found) {
        client.setQueryData(["appointments", userId, found.id], found);
        persist({ ...draft, uncertain: false, createdId: found.id });
      } else {
        persist({ ...draft, uncertain: false });
        setError("Não encontramos a solicitação. Confira os dados antes de reenviar.");
      }
    } catch {
      setError("Ainda não foi possível conferir o envio. Tente verificar novamente.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  if (draft.createdId)
    return (
      <section className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        <h1 className="text-2xl font-bold">Sua solicitação</h1>
        {result.isPending ? (
          <HamsterLoader message="Carregando agendamento..." />
        ) : result.isError ? (
          <div role="alert">
            <p>Não foi possível consultar a solicitação.</p>
            <Button onClick={() => void result.refetch()}>Tentar novamente</Button>
          </div>
        ) : (
          <AppointmentSummary
            appointment={result.data}
            onUpdated={(value) => client.setQueryData(["appointments", userId, value.id], value)}
          />
        )}
        <Button asChild variant="outline">
          <Link to="/tutor/agendamentos">Meus Agendamentos</Link>
        </Button>
        <Button variant="ghost" onClick={() => persist(empty)}>
          Nova solicitação
        </Button>
      </section>
    );
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Solicitar agendamento</h1>
      {provider.isPending || pets.isPending ? (
        <HamsterLoader message="Carregando serviços e pets..." />
      ) : provider.isError || pets.isError ? (
        <div role="alert" className="space-y-3">
          <p>Não foi possível carregar os dados da reserva.</p>
          <Button
            onClick={() => {
              void provider.refetch();
              void pets.refetch();
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <h2 className="break-words text-lg font-semibold">{provider.data.business_name}</h2>
          {!services.length ? (
            <p>Nenhum serviço disponível para agendamento.</p>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <fieldset
                disabled={busy || draft.uncertain}
                className="min-w-0 space-y-4 disabled:opacity-70"
              >
                <label className="block space-y-1">
                  Serviço
                  <select
                    required
                    value={draft.service}
                    onChange={(event) => field("service", event.target.value)}
                    className="block w-full rounded-lg border bg-white p-3"
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {appointmentMoney(Number(item.price))}{" "}
                        {item.billing_unit === "DIARIA" ? "por diária" : "por hora"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  Pet
                  <select
                    required
                    value={draft.pet}
                    onChange={(event) => field("pet", event.target.value)}
                    className="block w-full rounded-lg border bg-white p-3"
                  >
                    <option value="">Selecione seu pet</option>
                    {pets.data.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!pets.data.length && <p>Você ainda não possui pets cadastrados.</p>}
                <Link
                  className="inline-block text-sm text-sky-700 underline"
                  to="/tutor/pets"
                  state={{ bookingReturnTo: `/tutor/agendar/${providerId}` }}
                >
                  Cadastrar pet
                </Link>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="min-w-0 space-y-1">
                    Início (horário local)
                    <input
                      required
                      type="datetime-local"
                      value={draft.start}
                      onChange={(event) => field("start", event.target.value)}
                      className="block min-w-0 w-full max-w-full rounded-lg border p-3"
                    />
                  </label>
                  <label className="min-w-0 space-y-1">
                    Fim (horário local)
                    <input
                      required
                      type="datetime-local"
                      value={draft.end}
                      onChange={(event) => field("end", event.target.value)}
                      className="block min-w-0 w-full max-w-full rounded-lg border p-3"
                    />
                  </label>
                </div>
                <label className="block space-y-1">
                  Observações (opcional)
                  <textarea
                    maxLength={2000}
                    value={draft.notes}
                    onChange={(event) => field("notes", event.target.value)}
                    className="block w-full rounded-lg border p-3"
                  />
                </label>
              </fieldset>
              {validation && (
                <p role="alert" className="text-red-700">
                  {validation}
                </p>
              )}
              {preview && (
                <p className="font-semibold">
                  Prévia: {appointmentMoney(preview.total)} · {preview.quantity}{" "}
                  {selected?.billing_unit === "DIARIA" ? "diária(s)" : "hora(s)"}
                </p>
              )}
              <p className="text-sm text-slate-600">
                {provider.data.payment_policy === "PRE_PAGO"
                  ? "Pagamento antecipado simulado antes da confirmação do parceiro."
                  : provider.data.payment_policy === "PRESENCIAL"
                    ? "Pagamento presencial. A solicitação depende da confirmação do parceiro."
                    : "A política de pagamento será informada na solicitação."}
              </p>
              {error && (
                <p role="alert" className="text-red-700">
                  {error}
                </p>
              )}
              {draft.uncertain && (
                <div role="alert" className="space-y-2 text-amber-900">
                  <p>
                    O envio pode ter sido concluído. Confira Meus Agendamentos antes de solicitar
                    novamente.
                  </p>
                  <Button
                    type="button"
                    disabled={busy}
                    variant="outline"
                    onClick={() => void reconcile()}
                  >
                    Verificar solicitação
                  </Button>
                  <Link className="block underline" to="/tutor/agendamentos">
                    Conferir Meus Agendamentos
                  </Link>
                </div>
              )}
              <Button
                disabled={busy || !preview || !draft.pet || draft.uncertain || !pets.data.length}
                type="submit"
              >
                {busy ? "Enviando..." : "Enviar solicitação"}
              </Button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
