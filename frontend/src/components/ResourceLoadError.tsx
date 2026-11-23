import { Link } from "react-router";
import { PawPrint, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

/**
 * Estado de falha de uma página de detalhe pública (E-31).
 *
 * Separa "não existe" (404 / link inválido: sem nova tentativa, que não mudaria
 * nada) de "não carregou" (rede, 5xx, limite: mensagem honesta e nova tentativa).
 */
type Props = {
  notFound: boolean;
  /** Ex.: "Hotel não encontrado". */
  notFoundTitle: string;
  /** Ex.: "Não foi possível carregar o hotel". */
  errorTitle: string;
  message?: string | null;
  onRetry: () => void;
  retrying?: boolean;
  backTo: string;
  backLabel: string;
};

export function ResourceLoadError({
  notFound,
  notFoundTitle,
  errorTitle,
  message,
  onRetry,
  retrying = false,
  backTo,
  backLabel,
}: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-12">
      <section
        role="alert"
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        <PawPrint className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
        <h1 className="text-xl font-bold text-slate-900">{notFound ? notFoundTitle : errorTitle}</h1>
        <p className="text-sm text-slate-600">
          {notFound
            ? "O link pode estar incorreto ou o cadastro não está mais disponível."
            : message || "Verifique sua conexão e tente novamente."}
        </p>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          {!notFound && (
            <Button onClick={onRetry} disabled={retrying}>
              <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" />
              Tentar novamente
            </Button>
          )}
          <Button asChild variant={notFound ? "default" : "outline"}>
            <Link to={backTo}>{backLabel}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
