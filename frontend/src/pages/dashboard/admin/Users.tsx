import { useEffect, useState } from "react";
import { Search, Shield, Store, Bed, MapPin, User as UserIcon, AlertTriangle, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { userService, type AdminUser } from "../../../lib/services/userService";
import { HamsterLoader } from "../../../components/ui/HamsterLoader";
import { Card, CardContent } from "../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { formatDocument } from "../../../lib/utils/masks";
import { isApprovedProviderStatus } from "../../../lib/constants/providerStatus";

// Cobre os 5 papéis (o Approvals só mapeia 2/3/4).
const ROLES: Record<number, { name: string; icon: typeof Store; color: string }> = {
  1: { name: "Admin", icon: Shield, color: "text-slate-600" },
  2: { name: "Lojista", icon: Store, color: "text-blue-500" },
  3: { name: "Hotel", icon: Bed, color: "text-purple-500" },
  4: { name: "Pet Sitter", icon: MapPin, color: "text-[#F58B05]" },
  5: { name: "Tutor", icon: UserIcon, color: "text-emerald-600" },
};

function RoleBadge({ roleId }: { roleId: number }) {
  const role = ROLES[roleId];
  if (!role) {
    return <span className="text-sm text-slate-500">Desconhecido</span>;
  }
  const Icon = role.icon;
  return (
    <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-100 w-fit px-2.5 py-1 rounded-full">
      <Icon className={`h-4 w-4 mr-1 ${role.color}`} />
      {role.name}
    </div>
  );
}

/** Situação do usuário: para parceiro, o status de aprovação; senão, ativo/inativo. */
function StatusBadge({ user }: { user: AdminUser }) {
  const base = "text-xs font-medium px-2.5 py-1 rounded-full border w-fit inline-block";

  if (user.provider) {
    const status = user.provider.status;
    if (isApprovedProviderStatus(status)) {
      return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}>Aprovado</span>;
    }
    if (status === "REJEITADO") {
      return <span className={`${base} bg-red-50 text-red-700 border-red-200`}>Recusado</span>;
    }
    return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>Em análise</span>;
  }

  return user.is_active === false ? (
    <span className={`${base} bg-slate-100 text-slate-600 border-slate-200`}>Inativo</span>
  ) : (
    <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}>Ativo</span>
  );
}

export function Users() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const isAdmin = currentUser?.role_id === 1;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Evita uma requisição por tecla digitada.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await userService.listUsers({
          ...(roleFilter !== "all" ? { role_id: Number(roleFilter) } : {}),
          ...(debouncedSearch ? { q: debouncedSearch } : {}),
        });
        if (!cancelled) setUsers(data);
      } catch (err) {
        console.error("Erro ao carregar usuários:", err);
        if (!cancelled) toast.error("Erro ao carregar os usuários.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, roleFilter, debouncedSearch]);

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <HamsterLoader size="sm" message="Carregando..." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Acesso Negado</h2>
        <p className="text-slate-500 max-w-md">
          Apenas administradores do sistema podem visualizar a listagem de usuários.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Usuários</h2>
        <p className="text-slate-500 mt-1">
          Todos os cadastros da plataforma — tutores, parceiros e administradores.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os perfis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os perfis</SelectItem>
              <SelectItem value="1">Admin</SelectItem>
              <SelectItem value="2">Lojista</SelectItem>
              <SelectItem value="3">Hotel</SelectItem>
              <SelectItem value="4">Pet Sitter</SelectItem>
              <SelectItem value="5">Tutor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <HamsterLoader size="sm" message="Buscando usuários..." />
      ) : users.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UsersIcon className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum usuário encontrado</h3>
            <p className="text-slate-500">Não há usuários com os filtros atuais.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {users.length} {users.length === 1 ? "usuário" : "usuários"}
          </p>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Usuário</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Perfil</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Negócio / Documento</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Situação</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{u.full_name}</span>
                          <span className="text-sm text-slate-500">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge roleId={u.role_id} />
                      </td>
                      <td className="px-6 py-4">
                        {u.provider ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{u.provider.business_name}</span>
                            <span className="text-xs text-slate-500 font-mono">
                              {formatDocument(u.provider.document)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge user={u} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {new Date(u.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
