import { AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * DemoBanner
 * Aviso padrão do Pet+ para telas que exibem dados fictícios (mock).
 * Deixa explícito ao usuário que os números não são reais, evitando que
 * a demonstração seja lida como dado de produção. — UX-0
 */

interface DemoBannerProps {
  /**
   * Texto do aviso. O padrão cobre telas 100% mock; telas parcialmente
   * integradas devem passar um texto mais preciso.
   */
  message?: string;
  /** Classes extras para o container (ex.: espaçamento específico da tela). */
  className?: string;
}

export function DemoBanner({
  message = "Esta tela ainda está utilizando dados fictícios para fins de apresentação de layout e ainda não foi integrada ao backend.",
  className,
}: DemoBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm",
        className
      )}
    >
      <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-amber-800 font-[family-name:var(--font-display)]">
          Ambiente de Demonstração
        </h4>
        <p className="text-xs text-amber-600 mt-0.5 font-medium">{message}</p>
      </div>
    </div>
  );
}
