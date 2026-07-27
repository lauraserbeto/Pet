import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "../ui/card";

/**
 * Card de indicador reutilizável.
 *
 * Antes cada tela desenhava o seu (Overview, Finance e Orders tinham três
 * estilos diferentes). Com `to`, o card vira um atalho acionável — usado nas
 * filas de moderação do painel admin.
 */

type Tone = "neutral" | "action" | "warning";

const TONES: Record<Tone, { border: string; iconBg: string; iconText: string }> = {
  neutral: {
    border: "border-l-slate-300",
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
  },
  action: {
    border: "border-l-[var(--color-primary-500)]",
    iconBg: "bg-[var(--color-primary-50)]",
    iconText: "text-[var(--color-primary-600)]",
  },
  warning: {
    border: "border-l-amber-400",
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
  },
};

type Props = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  tone?: Tone;
  /** Quando presente, o card inteiro vira link. */
  to?: string;
};

export function StatCard({ title, value, icon: Icon, hint, tone = "neutral", to }: Props) {
  const t = TONES[tone];

  const body = (
    <Card className={`border-l-4 ${t.border} h-full transition-shadow ${to ? "hover:shadow-md" : ""}`}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
          </div>
          <span className={`shrink-0 rounded-xl p-2.5 ${t.iconBg} ${t.iconText}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        {hint && (
          <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
            {hint}
            {to && <ArrowRight className="h-3 w-3" aria-hidden="true" />}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return to ? (
    <Link to={to} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)]">
      {body}
    </Link>
  ) : (
    body
  );
}
