import { lazy, Suspense } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { HamsterLoader } from "../../components/ui/HamsterLoader";

/**
 * Índice de /dashboard: escolhe o painel pelo perfil.
 *
 * O admin administra a plataforma, não um negócio — antes ele caía no mesmo
 * Overview do parceiro (receita, agendamentos, ticket médio). Com `lazy`, cada
 * perfil baixa só o chunk do seu painel.
 */

const AdminOverview = lazy(() =>
  import("./admin/AdminOverview").then((m) => ({ default: m.AdminOverview }))
);
const Overview = lazy(() => import("./Overview").then((m) => ({ default: m.Overview })));

function Loading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <HamsterLoader size="sm" message="Carregando..." />
    </div>
  );
}

export function DashboardHome() {
  const { user, isLoading } = useAuth();

  // Sem o perfil ainda não dá para escolher — evita piscar o painel errado.
  if (isLoading) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      {user?.role_id === 1 ? <AdminOverview /> : <Overview />}
    </Suspense>
  );
}
