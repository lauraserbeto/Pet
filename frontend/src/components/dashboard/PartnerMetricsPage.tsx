import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useProviderMetrics } from "../../lib/hooks/useProviderMetrics";
import { HamsterLoader } from "../ui/HamsterLoader";
import { Button } from "../ui/button";
import { CommerceMetricsPanel } from "./CommerceMetricsPanel";

export function PartnerMetricsPage({ financial = false }: { financial?: boolean }) {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const query = useProviderMetrics(days);
  if (!user || ![2, 3, 4].includes(user.role_id))
    return <p role="alert">Área exclusiva de parceiros.</p>;
  return (
    <div className="space-y-6 pb-8 min-w-0">
      {/* Cabeçalho no padrão do AdminOverview (G14): título, subtítulo e ações agrupadas. */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {financial ? "Financeiro" : "Visão Geral"}
          </h1>
          <p className="mt-1 text-slate-500">
            {query.data?.provider.business_name || "Seu negócio"}
            {query.data?.generated_at && (
              <span role="status">
                {" · atualizado às "}
                {new Date(query.data.generated_at).toLocaleTimeString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <nav className="flex flex-wrap gap-2" aria-label="Atalhos do negócio">
            <Button asChild variant="outline">
              <Link to={user.role_id === 2 ? "/dashboard/orders" : "/dashboard/schedule"}>
                {user.role_id === 2 ? "Ver pedidos" : "Abrir agenda"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={financial ? "/dashboard" : "/dashboard/financeiro"}>
                {financial ? "Voltar à visão geral" : "Ver financeiro"}
              </Link>
            </Button>
          </nav>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Atualizar métricas
          </Button>
          {/* Select nativo (acessível e coberto pelos testes) com a aparência do ui/select. */}
          <select
            aria-label="Período das métricas"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="h-10 w-40 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-700)] focus-visible:ring-offset-2"
          >
            {[7, 30, 90].map((value) => (
              <option key={value} value={value}>
                Últimos {value} dias
              </option>
            ))}
          </select>
        </div>
      </header>
      {query.isPending ? (
        <HamsterLoader size="sm" message="Carregando métricas..." />
      ) : query.isError || !query.data ? (
        <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-white p-5">
          <h2 className="font-semibold">Não foi possível carregar as métricas</h2>
          <p>{query.error?.message || "Confira sua conexão e tente novamente."}</p>
          <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
        </div>
      ) : (
        <CommerceMetricsPanel
          data={query.data.commerce}
          role={user.role_id}
          financial={financial}
        />
      )}
    </div>
  );
}
