import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { reviewService, type ReviewTarget } from "../../lib/services/reviewService";
import { RatingBadge, Stars } from "./RatingBadge";
import { Button } from "../ui/button";
import { HamsterLoader } from "../ui/HamsterLoader";
import { useAuth } from "../../contexts/AuthContext";

export function ReviewsPanel({ target }: { target: ReviewTarget }) {
  return <ReviewPages key={JSON.stringify(target)} target={target} />;
}
function ReviewPages({ target }: { target: ReviewTarget }) {
  const [page, setPage] = useState(1);
  const summary = useQuery({
    queryKey: ["reviews", target, "summary"],
    queryFn: () => reviewService.summary(target),
  });
  const list = useQuery({
    queryKey: ["reviews", target, "list", page],
    queryFn: () => reviewService.list(target, page),
  });
  const { user } = useAuth();
  const historyPath = target.product_id ? "/tutor/pedidos" : "/tutor/agendamentos";
  // O resumo já diz "Ainda sem avaliações"; a lista vazia não repete o aviso.
  const summarySaysEmpty = summary.isSuccess && summary.data.rating_count === 0;
  const singlePage = page === 1 && Boolean(list.data) && list.data!.pages <= 1;
  return (
    <section
      aria-label="Avaliações de clientes"
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
    >
      <h2 className="text-xl font-bold text-slate-900">Avaliações de clientes</h2>
      <p className="text-sm text-slate-600">
        Após concluir uma compra ou atendimento, avalie pelo histórico de{" "}
        {/* Visitante vai para o login; a rota do histórico é protegida (G18). */}
        <Link
          to={user ? historyPath : "/login"}
          state={user ? undefined : { returnTo: historyPath }}
          className="font-medium text-[var(--color-primary-700)] underline underline-offset-2"
        >
          {target.product_id ? "Meus Pedidos" : "Meus Agendamentos"}
        </Link>
        {!user && " (entre na sua conta)"}.
      </p>
      {summary.isPending ? (
        <p role="status">Carregando resumo das avaliações...</p>
      ) : summary.isError ? (
        <div role="alert">
          <p>Não foi possível carregar o resumo das avaliações.</p>
          <Button variant="outline" onClick={() => void summary.refetch()}>
            Recarregar resumo
          </Button>
        </div>
      ) : (
        <>
          <RatingBadge {...summary.data} />
          {summary.data.rating_count > 0 && (
            <div className="max-w-xl space-y-2" aria-label="Distribuição de todas as notas">
              {summary.data.distribution.map((row) => (
                <div key={row.rating} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 whitespace-nowrap">
                    {row.rating} {row.rating === 1 ? "estrela" : "estrelas"}
                  </span>
                  <meter
                    className="min-w-0 flex-1"
                    aria-label={`${row.rating} estrelas`}
                    min={0}
                    max={summary.data.rating_count}
                    value={row.count}
                  />
                  <span>{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {list.isPending ? (
        <HamsterLoader size="sm" message="Carregando avaliações..." />
      ) : list.isError ? (
        <div role="alert" className="space-y-2">
          <p>Não foi possível carregar esta página de avaliações.</p>
          <Button variant="outline" onClick={() => void list.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          {list.data.data.length === 0 ? (
            summarySaysEmpty && page === 1 ? null : <p className="py-4 text-slate-600">
              {page === 1
                ? "Este item ainda não recebeu avaliações."
                : "Nenhuma avaliação nesta página."}
            </p>
          ) : (
            <div className="space-y-3">
              {list.data.data.map((review) => (
                <article
                  key={review.id}
                  aria-label={`Avaliação de ${review.author.full_name}`}
                  className="space-y-2 rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="break-words font-semibold">{review.author.full_name}</h3>
                    <time dateTime={review.created_at} className="text-sm text-slate-500">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </time>
                  </div>
                  <Stars rating={review.rating} />
                  {review.comment && (
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                      {review.comment}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {!singlePage && (
      <nav aria-label="Paginação de avaliações" className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          disabled={page === 1 || list.isFetching}
          onClick={() => setPage((value) => value - 1)}
        >
          Página anterior
        </Button>
        <span className="text-sm" aria-live="polite">
          Página {page}
          {list.data ? ` de ${Math.max(1, list.data.pages)}` : ""}
        </span>
        <Button
          variant="outline"
          disabled={!list.data || list.isError || list.isFetching || page >= list.data.pages}
          onClick={() => setPage((value) => value + 1)}
        >
          Próxima página
        </Button>
      </nav>
      )}
    </section>
  );
}
