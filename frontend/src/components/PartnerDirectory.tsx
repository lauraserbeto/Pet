import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Heart, MapPin, Search } from "lucide-react";
import { providerService } from "../lib/services/providerService";
import { useFavorites } from "../contexts/FavoritesContext";
import { Button } from "./ui/button";
import { HamsterLoader } from "./ui/HamsterLoader";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { RatingBadge } from "./reviews/RatingBadge";
import type { RatingSummary } from "../lib/services/reviewService";

type Kind = "HOTEL" | "SITTER";
interface PublicPartner extends RatingSummary {
  id: string;
  business_name?: string;
  description?: string;
  city?: string;
  state?: string;
  starting_price?: number | string | null;
  services?: { id: string; name: string; is_active: boolean }[];
  gallery_images?: string[];
  user?: { full_name?: string; avatar_url?: string };
}

function startingPrice(partner: PublicPartner): number | null {
  const value = partner.starting_price;
  if (value === null || value === undefined || value === "") return null;
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const activeServices = (partner: PublicPartner) =>
  partner.services?.filter((item) => item.is_active) || [];

export function PartnerDirectory({ kind }: { kind: Kind }) {
  const { isFavorite, toggle } = useFavorites();
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [service, setService] = useState("");
  const isHotel = kind === "HOTEL";
  const title = isHotel ? "Hotéis Pet" : "Pet Sitters";
  const basePath = isHotel ? "/hotels" : "/walkers";
  const nameOf = (partner: PublicPartner) =>
    partner.business_name || partner.user?.full_name || (isHotel ? "Hotel" : "Pet Sitter");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const request =
      kind === "HOTEL" ? providerService.fetchHotels() : providerService.fetchSitters();
    request
      .then((data: PublicPartner[]) => {
        if (!cancelled) setPartners(data.filter((partner) => activeServices(partner).length > 0));
      })
      .catch(() => {
        if (!cancelled) {
          setPartners([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, attempt]);

  const serviceNames = [
    ...new Set(partners.flatMap((partner) => activeServices(partner).map((item) => item.name))),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const visible = partners
    .filter((partner) => {
      const text = [
        nameOf(partner),
        partner.city,
        partner.state,
        partner.description,
        ...activeServices(partner).map((item) => item.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return (
        text.includes(query.trim().toLocaleLowerCase("pt-BR")) &&
        (!service || activeServices(partner).some((item) => item.name === service))
      );
    })
    .sort((a, b) => {
      if (sort === "rating") {
        const value = (partner: PublicPartner) =>
          Number.isSafeInteger(partner.rating_count) &&
          (partner.rating_count || 0) > 0 &&
          typeof partner.rating_avg === "number" &&
          Number.isFinite(partner.rating_avg) &&
          partner.rating_avg >= 1 &&
          partner.rating_avg <= 5
            ? partner.rating_avg
            : -1;
        if (value(a) !== value(b)) return value(b) - value(a);
      }
      if (sort === "price") {
        const aPrice = startingPrice(a),
          bPrice = startingPrice(b);
        if (aPrice !== bPrice) return aPrice === null ? 1 : bPrice === null ? -1 : aPrice - bPrice;
      }
      return nameOf(a).localeCompare(nameOf(b), "pt-BR");
    });

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="border-b bg-white px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {/* Celular: busca em largura total e os dois seletores lado a lado;
              a partir de sm volta a uma linha (auditoria visual G16). */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
            <label className="col-span-2 flex min-w-0 items-center gap-2 rounded-lg border bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-[var(--color-primary-700)] sm:col-span-1">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <input
                aria-label="Buscar por nome, local ou serviço"
                placeholder="Buscar por nome, local ou serviço"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 min-w-0 w-full bg-transparent text-sm outline-none"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs text-slate-600">
              Serviço
              <select
                value={service}
                onChange={(event) => setService(event.target.value)}
                className="h-11 w-full min-w-0 rounded-lg border bg-white px-2 text-sm sm:max-w-64"
              >
                <option value="">Todos os serviços</option>
                {serviceNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs text-slate-600">
              Ordenar por
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-11 w-full min-w-0 rounded-lg border bg-white px-2 text-sm"
              >
                <option value="name">Nome</option>
                <option value="price">Menor preço</option>
                <option value="rating">Melhor avaliados</option>
              </select>
            </label>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-4 px-4 pt-6" aria-busy={loading}>
        {loading ? (
          <HamsterLoader message={`Buscando ${title.toLowerCase()}...`} size="sm" />
        ) : error ? (
          <div role="alert" className="space-y-3 py-8 text-center">
            <p>Não foi possível carregar {isHotel ? "os hotéis" : "os Pet Sitters"}.</p>
            <Button onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</Button>
          </div>
        ) : (
          <>
            <p role="status" className="text-sm text-slate-500">
              {visible.length}{" "}
              {visible.length === 1 ? "resultado encontrado" : "resultados encontrados"}
            </p>
            {visible.length === 0 && (
              <p className="py-10 text-center text-slate-600">
                {isHotel ? "Nenhum hotel encontrado" : "Nenhum profissional encontrado"}
              </p>
            )}
            {visible.map((partner) => {
              const name = nameOf(partner),
                price = startingPrice(partner);
              const location = [partner.city, partner.state].filter(Boolean).join(" / ");
              const image = isHotel
                ? partner.gallery_images?.[0] || partner.user?.avatar_url
                : partner.user?.avatar_url;
              return (
                <article
                  key={partner.id}
                  aria-label={name}
                  className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row"
                >
                  <ImageWithFallback
                    src={image || "/email-assets/petplus-logo.png"}
                    alt={image ? name : "Pet+"}
                    className={`h-40 w-full rounded-lg bg-slate-50 sm:h-28 sm:w-36 ${image ? "object-cover" : "object-contain p-4"}`}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <h2 className="break-words text-lg font-bold">
                      <Link to={`${basePath}/${partner.id}`} className="hover:underline">
                        {name}
                      </Link>
                    </h2>
                    <RatingBadge {...partner} />
                    {location && (
                      <p className="flex items-center gap-1 text-sm text-slate-500">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {location}
                      </p>
                    )}
                    {partner.description && (
                      <p className="line-clamp-2 break-words text-sm text-slate-600">
                        {partner.description}
                      </p>
                    )}
                    <p className="break-words text-xs text-slate-500">
                      {activeServices(partner)
                        .map((item) => item.name)
                        .join(" · ")}
                    </p>
                    <p className="font-semibold">
                      {price === null
                        ? "Preço não informado"
                        : `A partir de ${currency.format(price)}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <button
                      type="button"
                      title="Favoritos"
                      aria-label={
                        isFavorite(kind, partner.id)
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                      aria-pressed={isFavorite(kind, partner.id)}
                      onClick={() => void toggle(kind, partner.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-sky-500"
                    >
                      <Heart
                        className={`h-5 w-5 ${isFavorite(kind, partner.id) ? "fill-red-500 text-red-500" : "text-slate-500"}`}
                      />
                    </button>
                    <Button asChild>
                      <Link to={`${basePath}/${partner.id}`}>
                        {isHotel ? "Ver detalhes" : "Ver perfil"}
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}
