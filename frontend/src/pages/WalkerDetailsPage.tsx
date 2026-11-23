import { useState, useEffect } from "react";
import { providerService } from "../lib/services/providerService";
import { RatingBadge } from "../components/reviews/RatingBadge";
import { ReviewsPanel } from "../components/reviews/ReviewsPanel";
import { Button } from "../components/ui/button";
import {
  Heart,
  Share2,
  MapPin,
  PawPrint,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { isMissingResourceError } from "../lib/httpClient";
import { ResourceLoadError } from "../components/ResourceLoadError";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { isApprovedProviderStatus } from "../lib/constants/providerStatus";
import { useFavorites } from "../contexts/FavoritesContext";
import { BILLING_UNIT_LABELS, type BillingUnit } from "../lib/services/serviceService";

type Service = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_active: boolean;
  billing_unit?: BillingUnit;
};

// Unidade vinda do serviço (antes era o texto fixo "a partir de /hora" — G21).
const unitText = (unit?: BillingUnit | null) => (unit ? BILLING_UNIT_LABELS[unit] : null);

export function WalkerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isFavorite, toggle } = useFavorites();
  const isFav = id ? isFavorite("SITTER", id) : false;

  const [activeTab, setActiveTab] = useState<"about" | "services">("about");
  const [apiWalker, setApiWalker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) {
      setError("Identificador do profissional não informado.");
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);
    setNotFound(false);

    providerService
      .fetchProviderDetails(id)
      .then((data) => {
        if (cancelled) return;

        const services: Service[] = Array.isArray(data.services)
          ? data.services
              .filter((service: Service) => service.is_active)
              .map((service: Service) => ({
                ...service,
                price: Number(service.price),
              }))
          : [];

        const validPrices = services
          .map((service) => service.price)
          .filter((price) => Number.isFinite(price) && price > 0);

        const startingPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
        const startingUnit =
          startingPrice === null
            ? null
            : services.find((service) => service.price === startingPrice)?.billing_unit ?? null;

        setApiWalker({
          name: data.business_name || data.user?.full_name || "Profissional",
          rating_avg: data.rating_avg,
          rating_count: data.rating_count,
          role: data.description || "Pet Sitter",
          description: data.description || null,
          image: data.user?.avatar_url || null,
          address: [data.city, data.state].filter(Boolean).join(", "),
          phone: null,
          verified: isApprovedProviderStatus(data.status),
          services,
          startingPrice,
          startingUnit,
        });
      })
      .catch((error) => {
        if (cancelled) return;

        setApiWalker(null);
        // 404/ID inválido é "não encontrado"; o resto é falha com nova tentativa (E-31).
        setNotFound(isMissingResourceError(error));
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados do profissional."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <div className="h-10 w-10 border-4 border-[var(--color-primary-100)] border-t-[var(--color-primary-700)] rounded-full animate-spin" />
        <p className="font-semibold text-slate-600">Carregando perfil...</p>
      </div>
    );
  }

  if (!apiWalker) {
    return (
      <ResourceLoadError
        notFound={notFound}
        notFoundTitle="Profissional não encontrado"
        errorTitle="Não foi possível carregar o profissional"
        message={error}
        onRetry={() => setAttempt((value) => value + 1)}
        backTo="/walkers"
        backLabel="Voltar para os Pet Sitters"
      />
    );
  }

  const walker = apiWalker;

  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-[family-name:var(--font-body)]">
      {/* Cover */}
      <div className="relative h-[220px] sm:h-[280px] w-full bg-gradient-to-br from-sky-100 to-slate-200">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 shadow-sm h-10 w-10"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 shadow-sm h-10 w-10"
              aria-label="Compartilhar"
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: walker.name,
                      url: window.location.href,
                    })
                    .catch(() => {});
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                }
              }}
            >
              <Share2 size={18} />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className={`rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm h-10 w-10 ${
                isFav ? "text-red-500" : "text-slate-900"
              }`}
              onClick={() => id && toggle("SITTER", id)}
              aria-label={isFav ? "Remover dos favoritos" : "Favoritar"}
            >
              <Heart size={18} className={isFav ? "fill-current" : ""} />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 -mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0 -mt-14 sm:-mt-16">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center">
                {walker.image ? (
                  <ImageWithFallback
                    src={walker.image}
                    alt={walker.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PawPrint className="h-10 w-10 text-slate-300" />
                )}
              </div>
            </div>

            {/* Name and Information */}
            <div className="flex-1 text-center sm:text-left sm:pt-2 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
                  {walker.name}
                </h1>

                {walker.verified && <ShieldCheck className="h-5 w-5 text-sky-500 shrink-0" />}
              </div>

              <p className="text-sm text-slate-500 mt-0.5">Pet Sitter</p>
              <div className="mt-2">
                <RatingBadge {...walker} />
              </div>

              {walker.address && (
                <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{walker.address}</span>
                </div>
              )}
            </div>

            {/* Starting Price */}
            <div className="text-center sm:text-right sm:pt-2">
              {walker.startingPrice !== null ? (
                <>
                  <p className="text-2xl font-extrabold text-slate-900">
                    R$ {formatPrice(walker.startingPrice)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {["a partir de", unitText(walker.startingUnit)].filter(Boolean).join(" · ")}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400">Preço não informado</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Verified Banner */}
        {walker.verified && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mt-4 bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-sky-500 text-white shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <p className="font-bold text-sky-900 text-sm">Profissional Verificado</p>
              <p className="text-xs text-sky-700 mt-0.5">
                Este profissional possui status de aprovação na plataforma.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-slate-100 rounded-xl p-1">
          {(["about", "services"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "about" ? "Sobre" : "Serviços"}
            </button>
          ))}
        </div>

        {/* About */}
        {activeTab === "about" && (
          <motion.div
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mt-6">
              <h2 className="font-bold text-slate-900 mb-2 font-[family-name:var(--font-display)]">
                Sobre o profissional
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {walker.description || "Nenhuma descrição informada pelo profissional."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Services */}
        {activeTab === "services" && (
          <motion.div
            key="services"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-6 space-y-3"
          >
            {walker.services.length > 0 ? (
              walker.services.map((service: Service) => (
                <div
                  key={service.id}
                  className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:border-sky-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{service.name}</p>

                    {service.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{service.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900">R$ {formatPrice(service.price)}</p>
                      {unitText(service.billing_unit) && (
                        <p className="text-xs text-slate-500">{unitText(service.billing_unit)}</p>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-100 rounded-xl p-8 text-center">
                <PawPrint className="h-10 w-10 text-slate-300 mx-auto mb-3" />

                <p className="font-semibold text-slate-700">Nenhum serviço disponível</p>

                <p className="text-sm text-slate-400 mt-1">
                  Este profissional ainda não cadastrou serviços ativos.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      {id && (
        <div className="container mx-auto max-w-3xl px-4 pb-28">
          <ReviewsPanel target={{ provider_id: id }} />
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 z-40">
        <div className="container mx-auto max-w-3xl flex items-center gap-3">
          <div className="hidden sm:block">
            {walker.startingPrice !== null ? (
              <>
                <p className="text-lg font-extrabold text-slate-900">
                  R$ {formatPrice(walker.startingPrice)}
                </p>
                {unitText(walker.startingUnit) && (
                  <span className="text-sm font-normal text-slate-500">
                    {unitText(walker.startingUnit)}
                  </span>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Preço não informado</p>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Agende pela plataforma. Telefone e endereço completo não são exibidos no perfil público.
          </p>
          <div className="flex-1 flex items-center gap-2">
            {/* CTA primário como no Hotel; o rótulo diz o que acontece (abre o agendamento). */}
            <Button
              className="flex-1 h-12 rounded-xl font-bold text-base gap-2 shadow-md"
              onClick={() => id && navigate(`/tutor/agendar/${id}`)}
              disabled={walker.services.length === 0}
            >
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
              Agendar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
