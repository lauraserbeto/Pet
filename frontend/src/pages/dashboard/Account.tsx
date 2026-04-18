import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { authService } from "../../lib/services/authService";
import { providerService } from "../../lib/services/providerService";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  FileText,
  User,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface AccountInfo {
  full_name: string;
  email: string;
  document: string;
  role_label: string;
  status: string;
}

const ROLE_LABELS: Record<number, string> = {
  1: "Administrador",
  2: "PetShop / Lojista",
  3: "Hotel para Pets",
  4: "Pet Sitter",
};

export function Account() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await providerService.fetchMe();
        const roleId: number = data.user?.role_id ?? 0;
        setAccount({
          full_name: data.user?.full_name || "—",
          email: data.user?.email || "—",
          document: data.document || "Não informado",
          role_label: ROLE_LABELS[roleId] || "Usuário",
          status: data.status || "ACTIVE",
        });
      } catch {
        // fallback to localStorage
        try {
          const raw = localStorage.getItem("petplus_user");
          if (raw) {
            const user = JSON.parse(raw);
            setAccount({
              full_name: user.full_name || "—",
              email: user.email || "—",
              document: "Não disponível",
              role_label: ROLE_LABELS[user.role_id] || "Usuário",
              status: "ACTIVE",
            });
          }
        } catch {
          toast.error("Erro ao carregar dados da conta.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      authService.logout();
      navigate("/login");
    } catch {
      toast.error("Erro ao encerrar sessão.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 font-[family-name:var(--font-sans)]">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] tracking-tight">
          Minha Conta
        </h2>
        <p className="text-slate-500 mt-1.5">
          Dados cadastrais e informações de acesso da sua conta.
        </p>
      </div>

      {/* Identity Card */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-5">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="text-[var(--color-primary-500)]" size={20} />
            Identificação
          </CardTitle>
          <CardDescription>
            Informações cadastrais do responsável pela conta. Para alterações, entre em contato com o suporte.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          {/* Name */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm">
              <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                Nome do Responsável
              </p>
              <p className="text-base font-semibold text-slate-800 truncate">
                {account?.full_name}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm">
              <Mail size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                E-mail de Acesso
              </p>
              <p className="text-base font-semibold text-slate-800 truncate">
                {account?.email}
              </p>
            </div>
          </div>

          {/* Document */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm">
              <FileText size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                Documento (CPF / CNPJ)
              </p>
              <p className="text-base font-semibold text-slate-800 truncate">
                {account?.document}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role / Status Card */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Tipo de Parceiro
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">{account?.role_label}</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                account?.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {account?.status === "ACTIVE" ? "Ativo" : "Pendente"}
            </span>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <button
              onClick={() => navigate("/dashboard/perfil")}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--color-primary-50)] border border-[var(--color-primary-100)] hover:bg-[var(--color-primary-100)] transition-colors group"
            >
              <div className="text-left">
                <p className="text-sm font-bold text-[var(--color-primary-700)]">
                  Editar Perfil Público
                </p>
                <p className="text-xs text-[var(--color-primary-600)] mt-0.5">
                  Logo, descrição, horários, serviços e galeria.
                </p>
              </div>
              <ChevronRight
                size={20}
                className="text-[var(--color-primary-500)] group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Logout Card */}
      <Card className="border-red-100 shadow-sm rounded-2xl overflow-hidden bg-red-50/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-800">Encerrar Sessão</h4>
              <p className="text-sm text-slate-500 mt-0.5">
                Você será desconectado e redirecionado para a tela de login.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="border-red-300 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all rounded-xl h-11 px-6 font-bold shrink-0 shadow-sm"
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              {isLoggingOut ? "Saindo..." : "Sair da conta"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
