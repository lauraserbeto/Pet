import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Heart,
  Package,
  PawPrint,
  ShoppingCart,
  Store,
  Users as UsersIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../../../contexts/AuthContext";
import { useAdminMetrics } from "../../../lib/hooks/useAdminMetrics";
import { StatCard } from "../../../components/dashboard/StatCard";
import { HamsterLoader } from "../../../components/ui/HamsterLoader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

/**
 * Visão Geral da plataforma (admin).
 *
 * Só exibe métrica com dado real. Receita, ticket médio e agendamentos ficaram
 * de fora de propósito: sem checkout implementado, as tabelas `orders` e
 * `appointments` estão sempre vazias e os cards seriam zero permanente.
 */

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  lojista: "Lojista",
  hotel: "Hotel",
  pet_sitter: "Pet Sitter",
  tutor: "Tutor",
};

const ROLE_COLORS: Record<string, string> = {
  tutor: "#10B981",
  pet_sitter: "#F58B05",
  hotel: "#6366F1",
  lojista: "#3699D2",
  admin: "#64748B",
};

const FAVORITE_LABELS: Record<string, string> = {
  PRODUCT: "Produtos",
  HOTEL: "Hotéis",
  SITTER: "Pet Sitters",
};

const PARTNER_STATUS = [
  { key: "aprovados", label: "Aprovados", color: "#10B981" },
  { key: "pendentes", label: "Em análise", color: "#F59E0B" },
  { key: "recusados", label: "Recusados", color: "#EF4444" },
] as const;

const CATEGORY_COLORS = ["#3699D2", "#F58B05", "#10B981", "#6366F1", "#EC4899", "#64748B"];

/** "2026-07-24" → "24/07". Fatiar a string evita o deslocamento de fuso do `new Date`. */
function formatDay(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

const TOOLTIP_STYLE = {
  borderRadius: "8px",
  border: "none",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
} as const;

export function AdminOverview() {
  const { user } = useAuth();
  const isAdmin = user?.role_id === 1;
  const [days, setDays] = useState("30");

  const { data, isLoading, isError, error } = useAdminMetrics(isAdmin, Number(days));

  const growthData = useMemo(
    () => (data?.growth ?? []).map((d) => ({ ...d, label: formatDay(d.date) })),
    [data]
  );

  const roleData = useMemo(
    () =>
      Object.entries(data?.users.by_role ?? {})
        .map(([key, value]) => ({
          name: ROLE_LABELS[key] ?? key,
          value,
          color: ROLE_COLORS[key] ?? "#94A3B8",
        }))
        .sort((a, b) => b.value - a.value),
    [data]
  );

  const partnerStatusData = useMemo(
    () =>
      PARTNER_STATUS.map((s) => ({
        name: s.label,
        value: data?.partners[s.key] ?? 0,
        color: s.color,
      })),
    [data]
  );

  const categoryData = useMemo(
    () =>
      Object.entries(data?.catalog.by_category ?? {})
        .map(([name, value], i) => ({ name, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
        .sort((a, b) => b.value - a.value),
    [data]
  );

  const favoriteEntries = Object.entries(data?.engagement.favorites_by_type ?? {});

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Acesso Negado</h2>
        <p className="max-w-md text-slate-500">
          Apenas administradores do sistema podem ver as métricas da plataforma.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <HamsterLoader size="sm" message="Carregando métricas..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-amber-400" />
          <h3 className="mb-1 text-lg font-bold text-slate-900">Não foi possível carregar as métricas</h3>
          <p className="text-slate-500">
            {error instanceof Error ? error.message : "Tente novamente em alguns instantes."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const pendingTotal = data.moderation.partners_pending + data.moderation.sitter_evaluations_pending;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 pb-8 duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900">
            Visão Geral da Plataforma
          </h2>
          <p className="mt-1 text-slate-500">
            {pendingTotal > 0
              ? `Olá, ${user?.full_name?.split(" ")[0] ?? "admin"}! Você tem ${pendingTotal} ${pendingTotal === 1 ? "item" : "itens"} aguardando análise.`
              : `Olá, ${user?.full_name?.split(" ")[0] ?? "admin"}! Nenhuma pendência de moderação hoje.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 md:inline">{today}</span>
          <div className="w-40">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-full" aria-label="Período das métricas">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Fila de trabalho — o que depende do admin */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StatCard
          title="Parceiros aguardando aprovação"
          value={data.moderation.partners_pending}
          icon={ClipboardCheck}
          tone={data.moderation.partners_pending > 0 ? "warning" : "neutral"}
          hint={data.moderation.partners_pending > 0 ? "Analisar cadastros" : "Nada na fila"}
          to="/dashboard/aprovacoes"
        />
        <StatCard
          title="Avaliações de pet sitter pendentes"
          value={data.moderation.sitter_evaluations_pending}
          icon={Heart}
          tone={data.moderation.sitter_evaluations_pending > 0 ? "warning" : "neutral"}
          hint={data.moderation.sitter_evaluations_pending > 0 ? "Revisar avaliações" : "Nada na fila"}
          to="/dashboard/avaliacoes-sitters"
        />
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Usuários cadastrados"
          value={data.users.total}
          icon={UsersIcon}
          tone="action"
          hint={`+${data.users.new_in_range} no período`}
        />
        <StatCard
          title="Parceiros aprovados"
          value={data.partners.aprovados}
          icon={Store}
          hint={`${data.partners.total} cadastros no total`}
        />
        <StatCard
          title="Produtos ativos"
          value={data.catalog.products_active}
          icon={Package}
          hint={
            data.catalog.out_of_stock > 0
              ? `${data.catalog.out_of_stock} sem estoque`
              : "Todos com estoque"
          }
        />
        <StatCard title="Pets cadastrados" value={data.engagement.pets} icon={PawPrint} />
      </section>

      {/* Crescimento + distribuição por perfil */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Novos usuários</CardTitle>
            <CardDescription>
              Cadastros por dia nos últimos {data.range_days} dias — {data.users.new_in_range} no total.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3699D2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3699D2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    dy={10}
                    minTickGap={16}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => [value, "Novos usuários"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3699D2"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorGrowth)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Usuários por perfil</CardTitle>
            <CardDescription>Composição da base.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {roleData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="block text-2xl font-bold text-slate-900">{data.users.total}</span>
                <span className="text-xs text-slate-500">usuários</span>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {roleData.map((item) => (
                <li key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-600">{item.name}</span>
                  </span>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Parceiros, catálogo e engajamento */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Parceiros por situação</CardTitle>
            <CardDescription>{data.partners.total} cadastros no total.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={partnerStatusData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip cursor={{ fill: "#F1F5F9" }} contentStyle={TOOLTIP_STYLE} formatter={(value) => [value, "Parceiros"]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {partnerStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Catálogo por categoria</CardTitle>
            <CardDescription>
              {data.catalog.products_total} produtos cadastrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Nenhum produto cadastrado ainda.</p>
            ) : (
              <ul className="space-y-3">
                {categoryData.map((item) => (
                  <li key={item.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">{item.name}</span>
                      <span className="font-bold text-slate-900">{item.value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(item.value / data.catalog.products_total) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Engajamento</CardTitle>
            <CardDescription>Uso da plataforma pelos tutores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <PawPrint className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Pets cadastrados
              </span>
              <span className="text-xl font-bold text-slate-900">{data.engagement.pets}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <ShoppingCart className="h-4 w-4 text-[#3699D2]" aria-hidden="true" />
                Carrinhos com itens
              </span>
              <span className="text-xl font-bold text-slate-900">{data.engagement.active_carts}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Heart className="h-4 w-4 text-[#F58B05]" aria-hidden="true" />
                Favoritos
              </span>
              {favoriteEntries.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">Nenhum favorito ainda.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {favoriteEntries.map(([type, count]) => (
                    <li key={type} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{FAVORITE_LABELS[type] ?? type}</span>
                      <span className="font-bold text-slate-900">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
