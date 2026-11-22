import { Link } from "react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

/**
 * Estado único de "acesso negado" dentro do painel. Extraído de
 * admin/Users.tsx para que toda rota restrita por perfil responda igual,
 * com um caminho de volta, em vez de cair na home ou em texto solto.
 */
export function AccessDenied({
  message = "Esta área não está disponível para o seu perfil.",
  backTo = "/dashboard",
  backLabel = "Voltar para Visão Geral",
}: {
  message?: string;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4"
    >
      <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
        <AlertTriangle size={32} aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Acesso Negado</h2>
      <p className="text-slate-500 max-w-md">{message}</p>
      <Button asChild variant="outline">
        <Link to={backTo}>{backLabel}</Link>
      </Button>
    </div>
  );
}
