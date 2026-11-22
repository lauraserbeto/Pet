import { Link } from "react-router";
import { Settings as SettingsIcon, ClipboardCheck, DollarSign, ShieldAlert } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

/**
 * CFG-1: não existe endpoint de configurações da plataforma. A versão
 * anterior exibia formulários que apenas disparavam toasts de sucesso
 * (inclusive "logout forçado de todos"), sem gravar nada. Esta tela descreve
 * o comportamento real e aponta onde cada regra é operada hoje.
 */
const sections = [
  {
    icon: ClipboardCheck,
    title: "Aprovação de parceiros",
    status: "Análise manual",
    description:
      "Todo novo Lojista, Hotel ou Pet Sitter passa por análise da equipe antes de acessar o painel. Não há aprovação automática.",
    action: { label: "Abrir aprovações", to: "/dashboard/aprovacoes" },
  },
  {
    icon: DollarSign,
    title: "Taxas e repasses",
    status: "Não disponível",
    description:
      "Nesta versão a plataforma não retém comissão nem faz divisão ou repasse de pagamentos. Pagamentos de agendamento são simulados.",
  },
  {
    icon: ShieldAlert,
    title: "Segurança das contas",
    status: "Não disponível",
    description:
      "Autenticação em duas etapas e encerramento global de sessões ainda não foram implementados. Cada pessoa encerra a própria sessão em “Sair da conta”.",
  },
];

export function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)] flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-[var(--color-primary-700)]" aria-hidden="true" />
          Configurações da Plataforma
        </h2>
        <p className="text-slate-500">
          Regras em vigor nesta versão. Ainda não há configurações editáveis pelo painel.
        </p>
      </div>

      <div className="grid gap-4">
        {sections.map(({ icon: Icon, title, status, description, action }) => (
          <Card key={title} className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-start gap-3 space-y-0">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <Badge variant="outline">{status}</Badge>
                </div>
                <CardDescription>{description}</CardDescription>
              </div>
            </CardHeader>
            {action && (
              <CardContent className="pt-0 pl-[4.75rem]">
                <Button asChild variant="outline" size="sm">
                  <Link to={action.to}>{action.label}</Link>
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
