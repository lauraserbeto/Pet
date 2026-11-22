import { Star } from "lucide-react";
import type { RatingSummary } from "../../lib/services/reviewService";

export function Stars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating.toLocaleString("pt-BR")} de 5 estrelas`}
      className="inline-flex shrink-0 gap-0.5"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <span key={index} aria-hidden="true" className="relative inline-block h-4 w-4">
          <Star className="absolute h-4 w-4 text-slate-300" />
          <span
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${Math.max(0, Math.min(1, rating - index)) * 100}%` }}
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
          </span>
        </span>
      ))}
    </span>
  );
}

export function RatingBadge({ rating_avg: average, rating_count: count }: RatingSummary) {
  if (count === 0) return <span className="text-sm text-slate-500">Ainda sem avaliações</span>;
  if (
    typeof count !== "number" ||
    !Number.isSafeInteger(count) ||
    count < 1 ||
    typeof average !== "number" ||
    !Number.isFinite(average) ||
    average < 1 ||
    average > 5
  )
    return <span className="text-sm text-slate-500">Avaliações indisponíveis</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm text-slate-700">
      <Stars rating={average} />
      <strong>{average.toFixed(1).replace(".", ",")}</strong>
      <span>
        ({count} {count === 1 ? "avaliação" : "avaliações"})
      </span>
    </span>
  );
}
