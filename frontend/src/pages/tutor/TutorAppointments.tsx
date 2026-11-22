import { useState } from "react";
import { Button } from "../../components/ui/button";
import { HamsterLoader } from "../../components/ui/HamsterLoader";
import { AppointmentSummary } from "../../components/AppointmentSummary";
import { useAppointments } from "../../lib/hooks/useAppointments";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";

export function TutorAppointments() {
  const [tab, setTab] = useState("all");
  const query = useAppointments();
  const items = (query.data || []).filter((item) => {
    if (tab === "all") return true;
    const hotel = ["BOARDING", "DAYCARE"].includes(item.service?.category || "");
    return tab === "hotels" ? hotel : ["SITTING", "WALKING"].includes(item.service?.category || "");
  });
  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Atualizar
        </Button>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        {/* Abas no padrão de ui/tabs, como nas telas do Admin (G13). */}
        <TabsList aria-label="Tipo de agendamento">
          {[
            ["all", "Todos"],
            ["hotels", "Hotéis"],
            ["sitters", "Pet Sitters"],
          ].map(([value, label]) => (
            <TabsTrigger value={value} key={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab}>
          {query.isPending ? (
            <HamsterLoader message="Carregando agendamentos..." />
          ) : query.isError ? (
            <div role="alert" className="space-y-3">
              <p>Não foi possível atualizar seus agendamentos.</p>
              <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-slate-500">
              Nenhum agendamento encontrado nesta categoria.
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <AppointmentSummary
                  key={item.id}
                  appointment={item}
                  onUpdated={() => void query.invalidate()}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
