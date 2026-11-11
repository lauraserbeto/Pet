
import { useState, useEffect, useRef } from "react";
import { providerService } from "../lib/services/providerService";
import { Button } from "../components/ui/button";
import {
  Heart,
  Share2,
  MapPin,
  CheckCircle2,
  Phone,
  MessageCircle,
  PawPrint,
  ArrowLeft,
  Wifi,
  TreePine,
  Shield,
  Camera,
  Dog,
  Cat,
  Clock,
  ChevronRight,
  CalendarDays,
  Pause,
  Play,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { motion, AnimatePresence } from "motion/react";
import { useFavorites } from "../contexts/FavoritesContext";

const AUTOPLAY_INTERVAL = 4500;

export function HotelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeImage, setActiveImage] = useState(0);
  const { isFavorite, toggle } = useFavorites();
  const isFav = id ? isFavorite("HOTEL", id) : false;

  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [apiHotel, setApiHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega os dados reais do hotel.
  useEffect(() => {
    if (!id) {
      setError("Identificador do hotel não informado.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);
    setApiHotel(null);
    setActiveImage(0);

    providerService.fetchProviderDetails(id)
      .then(data => {
        if (cancelled) return;

        const gallery = Array.isArray(data.gallery_images)
          ? data.gallery_images
          : [];

        const amenities = Array.isArray(data.amenities)
          ? data.amenities
          : [];

        const allowed = Array.isArray(data.allowed_animals)
          ? data.allowed_animals
          : [];

        // Mantém somente serviços ativos e converte os preços.
        const services = Array.isArray(data.services)
          ? data.services
              .filter(service => service.is_active)
              .map(service => ({
                ...service,
                price: Number(service.price),
              }))
              .filter(service => Number.isFinite(service.price))
          : [];

        // Calcula o menor preço entre os serviços ativos.
        const startingPrice = services.length > 0
          ? Math.min(...services.map(service => service.price))
          : null;

        // Interpreta as regras e políticas cadastradas.
        let policies: string[] = [];

        if (data.rules_policies) {
          try {
            const parsed = JSON.parse(data.rules_policies);

            policies = Array.isArray(parsed)
              ? parsed
              : [data.rules_policies];
          } catch {
            policies = data.rules_policies
              .split("\n")
              .filter(line => line.trim().length > 0);
          }
        }

        // Formata os horários de funcionamento.
        const formatOperatingHours = (hours: any) => {
          if (!hours || typeof hours !== "object") {
            return "Horário não informado";
          }

          const daysMap: Record<string, string> = {
            mon: "Seg",
            tue: "Ter",
            wed: "Qua",
            thu: "Qui",
            fri: "Sex",
            sat: "Sáb",
            sun: "Dom",
            segunda: "Seg",
            terca: "Ter",
            quarta: "Qua",
            quinta: "Qui",
            sexta: "Sex",
            sabado: "Sáb",
            domingo: "Dom",
          };

          const activeDays = Object.entries(hours)
            .filter(([_, config]: [string, any]) => {
              return (
                config.open === true &&
                !config.closed &&
                config.start &&
                config.end
              );
            })
            .map(([day, config]: [string, any]) => {
              return `${daysMap[day] || day}: ${config.start}-${config.end}`;
            });

          return activeDays.length > 0
            ? activeDays.join(" • ")
            : "Horário não informado";
        };

        const address = [
          data.address_line,
          data.city,
          data.state,
        ].filter(Boolean).join(", ");

        setApiHotel({
          name: data.business_name || data.user?.full_name || "Hotel",
          logo: data.user?.avatar_url,
          address: address || "Endereço não informado",
          phone: data.phone || null,
          startingPrice,
          services,
          description: data.description || "Descrição não informada.",
          images: gallery.length > 0
            ? gallery
            : data.user?.avatar_url
              ? [data.user.avatar_url]
              : [],
          amenities: amenities.map((amenity: string) => ({
            icon: amenity.toLowerCase().includes("verde")
              ? "tree"
              : amenity.toLowerCase().includes("wi-fi") ||
                amenity.toLowerCase().includes("wi fi")
                ? "wifi"
                : amenity.toLowerCase().includes("superv")
                  ? "shield"
                  : "paw",
            label: amenity,
          })),
          acceptsDogs:
            allowed.includes("Cachorro") ||
            allowed.includes("Sem restrição"),
          acceptsCats:
            allowed.includes("Gato") ||
            allowed.includes("Sem restrição"),
          openHours: formatOperatingHours(data.operating_hours),
          policies: policies.length > 0
            ? policies
            : ["Nenhuma regra informada."],
        });
      })
      .catch(error => {
        if (cancelled) return;

        console.error("Erro ao carregar detalhes do hotel:", error);

        setApiHotel(null);
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados do hotel."
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
  }, [id]);

  const hotel = apiHotel;

  // Autoplay da galeria.
  useEffect(() => {
    if (!hotel || isPaused || hotel.images.length <= 1) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveImage(prev => (prev + 1) % hotel.images.length);
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, hotel?.images.length]);

  const handleManualSelect = (index: number) => {
    if (!hotel) return;

    setActiveImage(index);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isPaused && hotel.images.length > 1) {
      timerRef.current = setInterval(() => {
        setActiveImage(prev => (prev + 1) % hotel.images.length);
      }, AUTOPLAY_INTERVAL);
    }
  };

  const amenityIcon = (type: string) => {
    switch (type) {
      case "tree":
        return <TreePine className="h-5 w-5" />;
      case "shield":
        return <Shield className="h-5 w-5" />;
      case "wifi":
        return <Wifi className="h-5 w-5" />;
      case "paw":
        return <PawPrint className="h-5 w-5" />;
      default:
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Estado de carregamento.
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="h-12 w-12 border-4 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)] rounded-full animate-spin" />
        <p className="font-bold text-slate-600 animate-pulse">
          Carregando detalhes do hotel...
        </p>
      </div>
    );
  }

  // Estado de erro ou hotel não encontrado.
  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 px-4">
        <PawPrint className="h-16 w-16 text-slate-300" />

        <h2 className="text-xl font-bold text-slate-800">
          Não foi possível carregar o hotel
        </h2>

        <p className="text-sm text-slate-500 text-center">
          {error || "Ocorreu um erro ao buscar os dados do parceiro."}
        </p>

        <Button onClick={() => navigate("/hotels")}>
          Voltar para a listagem
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28 font-[family-name:var(--font-body)]">

      {/* Galeria de imagens */}
      <div
        className="relative w-full bg-slate-100"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="aspect-[4/3] sm:aspect-[16/9] md:aspect-[2/1] max-h-[500px] w-full overflow-hidden relative">

          {hotel.images.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <ImageWithFallback
                  src={hotel.images[activeImage]}
                  alt={`${hotel.name} — Foto ${activeImage + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
              <PawPrint className="h-16 w-16" />
              <p className="text-sm">
                Nenhuma imagem cadastrada
              </p>
            </div>
          )}
        </div>

        {/* Controles superiores */}
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
            >
              <Share2 size={18} />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className={`rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm h-10 w-10 ${
                isFav ? "text-red-500" : "text-slate-900"
              }`}
              onClick={() => id && toggle("HOTEL", id)}
              aria-label={isFav ? "Remover dos favoritos" : "Favoritar"}
            >
              <Heart
                size={18}
                className={isFav ? "fill-current" : ""}
              />
            </Button>
          </div>
        </div>

        {/* Barra inferior da galeria */}
        {hotel.images.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-10">

            {/* Barra de progresso */}
            {hotel.images.length > 1 && (
              <div className="flex gap-1 px-4 mb-2">
                {hotel.images.map((_: string, i: number) => (
                  <div
                    key={i}
                    className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/30 cursor-pointer"
                    onClick={() => handleManualSelect(i)}
                  >
                    {i === activeImage ? (
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: isPaused ? 0 : AUTOPLAY_INTERVAL / 1000,
                          ease: "linear",
                        }}
                        key={`progress-${activeImage}-${isPaused}`}
                      />
                    ) : i < activeImage ? (
                      <div className="h-full w-full bg-white rounded-full" />
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {/* Miniaturas */}
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex gap-2">
                {hotel.images.slice(0, 5).map((img: string, i: number) => (
                  <button
                    key={i}
                    className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === i
                        ? "border-white shadow-lg scale-105"
                        : "border-white/40 opacity-60 hover:opacity-100"
                    }`}
                    onClick={() => handleManualSelect(i)}
                    aria-label={`Ver foto ${i + 1}`}
                  >
                    <img
                      src={img}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {hotel.images.length > 1 && (
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1.5 rounded-full hover:bg-black/70 transition-colors"
                    aria-label={isPaused ? "Continuar slideshow" : "Pausar slideshow"}
                  >
                    {isPaused ? (
                      <Play className="h-3 w-3" />
                    ) : (
                      <Pause className="h-3 w-3" />
                    )}
                  </button>
                )}

                <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1.5 rounded-full">
                  <Camera className="h-3 w-3" />
                  {activeImage + 1}/{hotel.images.length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto max-w-3xl px-4 sm:px-6">

        {/* Cabeçalho do hotel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white -mt-6 relative z-10 rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6"
        >
          {/* Logo */}
          <div className="absolute -top-12 sm:-top-16 left-6 z-20">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
              {hotel.logo ? (
                <ImageWithFallback
                  src={hotel.logo}
                  alt={`Logo ${hotel.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PawPrint className="h-12 w-12 text-slate-300" />
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pt-8 sm:pt-0 sm:pl-36">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
                {hotel.name}
              </h1>

              <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-sm">
                  {hotel.address}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-500 max-w-[200px] text-right">
              <Clock className="h-3 w-3 shrink-0" />
              {hotel.openHours}
            </div>
          </div>

          {/* Aceitação de animais e menor preço */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                  hotel.acceptsDogs
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-500"
                }`}
              >
                <Dog className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {hotel.acceptsDogs ? "Aceita Cães" : "Não aceita Cães"}
              </div>

              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                  hotel.acceptsCats
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-500"
                }`}
              >
                <Cat className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {hotel.acceptsCats ? "Aceita Gatos" : "Não aceita Gatos"}
              </div>
            </div>

            <div className="text-right shrink-0">
              {hotel.startingPrice !== null ? (
                <>
                  <p className="text-lg sm:text-2xl font-extrabold text-slate-900">
                    {formatPrice(hotel.startingPrice)}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">
                    menor preço por diária
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">
                  Consulte os serviços
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Informações */}
        <motion.div
          key="info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >

          {/* Descrição */}
          <div className="mt-6">
            <h2 className="font-bold text-slate-900 mb-2 font-[family-name:var(--font-display)]">
              Sobre o hotel
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {hotel.description}
            </p>
          </div>

          {/* Serviços reais */}
          <div className="mt-6">
            <h2 className="font-bold text-slate-900 mb-3 font-[family-name:var(--font-display)]">
              Serviços e preços
            </h2>

            {hotel.services.length > 0 ? (
              <div className="space-y-3">
                {hotel.services.map((service: any) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-800">
                        {service.name}
                      </h3>

                      {service.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">
                        {formatPrice(service.price)}
                      </p>

                      <p className="text-xs text-slate-400">
                        {service.billing_unit === "DIARIA"
                          ? "por diária"
                          : "unidade não informada"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-100">
                Este hotel não possui serviços ativos cadastrados no momento.
              </p>
            )}
          </div>

          {/* Comodidades */}
          <div className="mt-6">
            <h2 className="font-bold text-slate-900 mb-3 font-[family-name:var(--font-display)]">
              Comodidades
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {hotel.amenities.map((am: { icon: string; label: string }, idx: number) => (
                <div
                  key={`${am.label}-${idx}`}
                  className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100"
                >
                  <div className="p-2 rounded-lg bg-[var(--color-primary-100)] text-[var(--color-primary-600)]">
                    {amenityIcon(am.icon)}
                  </div>

                  <span className="text-sm font-medium text-slate-700">
                    {am.label}
                  </span>
                </div>
              ))}

              {hotel.amenities.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  Nenhuma comodidade informada.
                </p>
              )}
            </div>
          </div>

          {/* Regras e políticas */}
          <div className="mt-6">
            <h2 className="font-bold text-slate-900 mb-3 font-[family-name:var(--font-display)]">
              Regras e Políticas
            </h2>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2.5">
              {hotel.policies.map((policy: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-amber-800">
                    {policy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Botões fixos inferiores */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 z-40">
        <div className="container mx-auto max-w-3xl flex items-center gap-3">

          <div className="hidden sm:block">
            {hotel.startingPrice !== null ? (
              <p className="text-lg font-extrabold text-slate-900">
                {formatPrice(hotel.startingPrice)}
                <span className="text-sm font-normal text-slate-400">
                  /diária
                </span>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Consulte os serviços
              </p>
            )}
          </div>

          <div className="flex-1 flex items-center gap-2">
            <Button
              className="flex-1 h-12 rounded-xl font-bold text-base gap-2 shadow-md shadow-orange-200"
              onClick={() => {}}
            >
              <CalendarDays className="h-5 w-5" />
              Reservar agora
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl border-slate-200 text-slate-600 hover:text-[var(--color-primary-600)] hover:border-[var(--color-primary-200)]"
              aria-label="Ligar"
              onClick={() => {
                if (hotel.phone) {
                  window.location.href = `tel:${hotel.phone}`;
                }
              }}
              disabled={!hotel.phone}
            >
              <Phone size={20} />
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl border-slate-200 text-slate-600 hover:text-[var(--color-primary-600)] hover:border-[var(--color-primary-200)]"
              aria-label="Mensagem"
              onClick={() => {
                if (hotel.phone) {
                  const phone = hotel.phone.replace(/\D/g, "");
                  window.open(`https://wa.me/55${phone}`, "_blank");
                }
              }}
              disabled={!hotel.phone}
            >
              <MessageCircle size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
