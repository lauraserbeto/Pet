import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Heart,
  Share2,
  MapPin,
  Star,
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

const AUTOPLAY_INTERVAL = 4500;

export function HotelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "reviews">("info");
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hotel = {
    name: "Hotel São Roque",
    distance: "3.3 km",
    address: "Rua 33, Bairro Verde",
    price: 190,
    rating: 5.0,
    reviews: 64,
    description:
      "No Hotel São Roque, seu cãozinho é tratado com carinho e atenção! Oferecemos hospedagem de alto padrão, creche diurna e muito amor para seu pet se sentir em casa. Nosso espaço conta com área verde ampla, supervisão veterinária e monitoramento 24h.",
    images: [
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1548366086-7f1b76106622?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1647249893022-9287c83b8cc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwZXQlMjBob3RlbCUyMGludGVyaW9yJTIwbW9kZXJufGVufDF8fHx8MTc3MjAyOTczNHww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    amenities: [
      { icon: "tree", label: "Área Verde" },
      { icon: "shield", label: "Supervisão 24h" },
      { icon: "wifi", label: "Webcam ao vivo" },
      { icon: "paw", label: "Pet Friendly" },
    ],
    acceptsDogs: true,
    acceptsCats: false,
    openHours: "08:00 — 20:00",
    policies: [
      "Check-in a partir das 08h",
      "Check-out até às 18h",
      "Carteira de vacinação obrigatória",
      "Animais sociáveis (avaliação prévia)",
    ],
    reviewsList: [
      {
        name: "Maria S.",
        rating: 5,
        text: "Meu cachorro amou! Voltou super feliz. Equipe atenciosa.",
        date: "2 semanas atrás",
      },
      {
        name: "Carlos R.",
        rating: 5,
        text: "Lugar impecável, meu pet foi muito bem cuidado.",
        date: "1 mês atrás",
      },
      {
        name: "Ana P.",
        rating: 4,
        text: "Ótimo espaço, preço justo. Recomendo!",
        date: "1 mês atrás",
      },
    ],
  };

  // Autoplay logic
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % hotel.images.length);
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, hotel.images.length]);

  // Reset timer when user manually picks an image
  const handleManualSelect = (index: number) => {
    setActiveImage(index);
    // Reset the interval so the next auto-advance waits the full duration
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setActiveImage((prev) => (prev + 1) % hotel.images.length);
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

  return (
    <div className="min-h-screen bg-white pb-28 font-[family-name:var(--font-body)]">
      {/* Image Gallery with Autoplay */}
      <div
        className="relative w-full bg-slate-100"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="aspect-[4/3] sm:aspect-[16/9] md:aspect-[2/1] max-h-[500px] w-full overflow-hidden relative">
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
        </div>

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
            >
              <Share2 size={18} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={`rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm h-10 w-10 ${
                isFav ? "text-red-500" : "text-slate-900"
              }`}
              onClick={() => setIsFav(!isFav)}
              aria-label={isFav ? "Remover dos favoritos" : "Favoritar"}
            >
              <Heart size={18} className={isFav ? "fill-current" : ""} />
            </Button>
          </div>
        </div>

        {/* Bottom bar: thumbnails + progress + pause */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          {/* Progress bar */}
          <div className="flex gap-1 px-4 mb-2">
            {hotel.images.map((_, i) => (
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

          {/* Thumbnails row */}
          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex gap-2">
              {hotel.images.map((img, i) => (
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
              {/* Pause/Play */}
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
              {/* Counter */}
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1.5 rounded-full">
                <Camera className="h-3 w-3" />
                {activeImage + 1}/{hotel.images.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white -mt-6 relative z-10 rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
                {hotel.name}
              </h1>
              <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-sm">
                  {hotel.address} • {hotel.distance}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-amber-700">
                  {hotel.rating.toFixed(1)}
                </span>
                <span className="text-xs text-amber-600/70">
                  ({hotel.reviews})
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                {hotel.openHours}
              </div>
            </div>
          </div>

          {/* Pet acceptance + Price */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  hotel.acceptsDogs
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-500"
                }`}
              >
                <Dog className="h-3.5 w-3.5" />
                {hotel.acceptsDogs ? "Aceita Cães" : "Não aceita Cães"}
              </div>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  hotel.acceptsCats
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-500"
                }`}
              >
                <Cat className="h-3.5 w-3.5" />
                {hotel.acceptsCats ? "Aceita Gatos" : "Não aceita Gatos"}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-slate-900">
                R${hotel.price}
              </p>
              <p className="text-[11px] text-slate-400">por noite</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-slate-100 rounded-xl p-1">
          {(["info", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "info" ? "Informações" : `Avaliações (${hotel.reviews})`}
            </button>
          ))}
        </div>

        {activeTab === "info" ? (
          <motion.div
            key="info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Description */}
            <div className="mt-6">
              <h2 className="font-bold text-slate-900 mb-2 font-[family-name:var(--font-display)]">
                Sobre o hotel
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {hotel.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="mt-6">
              <h2 className="font-bold text-slate-900 mb-3 font-[family-name:var(--font-display)]">
                Comodidades
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {hotel.amenities.map((am) => (
                  <div
                    key={am.label}
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
              </div>
            </div>

            {/* Policies */}
            <div className="mt-6">
              <h2 className="font-bold text-slate-900 mb-3 font-[family-name:var(--font-display)]">
                Regras e Políticas
              </h2>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2.5">
                {hotel.policies.map((policy, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-amber-800">{policy}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reviews"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-6 space-y-4"
          >
            {/* Rating Summary */}
            <div className="bg-slate-50 rounded-xl p-5 flex items-center gap-6 border border-slate-100">
              <div className="text-center">
                <p className="text-4xl font-extrabold text-slate-900">
                  {hotel.rating.toFixed(1)}
                </p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {hotel.reviews} avaliações
                </p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((level) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-3">{level}</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width:
                            level === 5
                              ? "85%"
                              : level === 4
                              ? "15%"
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Cards */}
            {hotel.reviewsList.map((review, i) => (
              <div
                key={i}
                className="bg-white border border-slate-100 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-600)] font-bold text-sm">
                      {review.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {review.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {review.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star
                        key={j}
                        className="h-3 w-3 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600">{review.text}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 z-40">
        <div className="container mx-auto max-w-3xl flex items-center gap-3">
          <div className="hidden sm:block">
            <p className="text-lg font-extrabold text-slate-900">
              R${hotel.price}
              <span className="text-sm font-normal text-slate-400">
                /noite
              </span>
            </p>
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
            >
              <Phone size={20} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl border-slate-200 text-slate-600 hover:text-[var(--color-primary-600)] hover:border-[var(--color-primary-200)]"
              aria-label="Mensagem"
            >
              <MessageCircle size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
