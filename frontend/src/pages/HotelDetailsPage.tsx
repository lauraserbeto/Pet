import { useState, useEffect, useRef } from "react";
import { providerService } from "../lib/services/providerService";
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

  const [apiHotel, setApiHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    providerService.fetchProviderDetails(id)
      .then(data => {
        const gallery = Array.isArray(data.gallery_images) ? data.gallery_images : [];
        const amenities = Array.isArray(data.amenities) ? data.amenities : [];
        const allowed = Array.isArray(data.allowed_animals) ? data.allowed_animals : [];
        
        let policies: string[] = [];
        if (data.rules_policies) {
            try {
                // Tenta fazer parse se for JSON stringified
                const parsed = JSON.parse(data.rules_policies);
                policies = Array.isArray(parsed) ? parsed : [data.rules_policies];
            } catch {
                // Se não for JSON, quebra por linhas
                policies = data.rules_policies.split('\n').filter((l: string) => l.trim().length > 0);
            }
        }

        const formatOperatingHours = (oh: any) => {
            if (!oh || typeof oh !== 'object') return "Horário não informado";
            const daysMap: Record<string, string> = {
                segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui", sexta: "Sex", sabado: "Sab", domingo: "Dom"
            };
            const activeDays = Object.entries(oh)
                .filter(([_, config]: [string, any]) => !config.closed && config.open && config.close)
                .map(([day, config]: [string, any]) => `${daysMap[day] || day}: ${config.open}-${config.close}`);
            
            return activeDays.length > 0 ? activeDays.join(" • ") : "Fechado temporariamente";
        };

        setApiHotel({
          name: data.business_name || data.user.full_name,
          logo: data.user.avatar_url,
          distance: "3.0 km",
          address: `${data.city || 'Cidade'}, ${data.state || 'UF'}`,
          price: data.daily_rate ? Number(data.daily_rate) : 150,
          rating: 5.0,
          reviews: 12,
          description: data.description || "O melhor lugar para seu pet.",
          images: gallery.length > 0 ? gallery : [
            data.user.avatar_url || "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&auto=format&fit=crop&q=80"
          ],
          amenities: amenities.map((a: string) => ({
            icon: a.toLowerCase().includes('verde') ? 'tree' : a.toLowerCase().includes('wi-fi') ? 'wifi' : a.toLowerCase().includes('superv') ? 'shield' : 'paw',
            label: a
          })),
          acceptsDogs: allowed.includes('Cachorro') || allowed.includes('Sem restrição'),
          acceptsCats: allowed.includes('Gato') || allowed.includes('Sem restrição'),
          openHours: formatOperatingHours(data.operating_hours),
          policies: policies.length > 0 ? policies : ["Consulte as regras com o parceiro"],
          reviewsList: []
        });
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [id]);

  const hotel = apiHotel;

  // Autoplay logic
  useEffect(() => {
    if (!hotel || isPaused || hotel.images.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % hotel.images.length);
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, hotel?.images.length]);

  const handleManualSelect = (index: number) => {
    setActiveImage(index);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPaused && hotel.images.length > 1) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="h-12 w-12 border-4 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)] rounded-full animate-spin"></div>
        <p className="font-bold text-slate-600 animate-pulse">Carregando detalhes do hotel...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <PawPrint className="h-16 w-16 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-800">Hotel não encontrado</h2>
        <Button onClick={() => navigate('/hotels')}>Voltar para a listagem</Button>
      </div>
    );
  }

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
            {hotel.images.map((_: any, i: number) => (
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
          {/* Hotel Logo Avatar */}
          <div className="absolute -top-12 sm:-top-16 left-6 z-20">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white">
              <ImageWithFallback
                src={hotel.logo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(hotel.name)}
                alt={`Logo ${hotel.name}`}
                className="w-full h-full object-cover"
              />
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
              <div className="flex items-center gap-1 text-[11px] text-slate-500 max-w-[200px] text-right">
                <Clock className="h-3 w-3 shrink-0" />
                {hotel.openHours}
              </div>
            </div>
          </div>

          {/* Pet acceptance + Price */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
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
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">
                R${hotel.price}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400">por noite</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-slate-100 rounded-xl p-1">
          {(["info", "reviews"] as const).map((tab: string) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "info" | "reviews")}
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
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {hotel.description}
              </p>
            </div>

            {/* Amenities Grid */}
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
                    <p className="text-xs text-slate-400 italic">Nenhuma comodidade informada</p>
                )}
              </div>
            </div>

            {/* Policies */}
            <div className="mt-6">
              <h2 className="font-bold text-slate-900 mb-3 font-[family-name:var(--font-display)]">
                Regras e Políticas
              </h2>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2.5">
                {hotel.policies.map((policy: string, i: number) => (
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
                  {[1, 2, 3, 4, 5].map((s: number) => (
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
                {[5, 4, 3, 2, 1].map((level: number) => (
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

            <div className="text-center py-8">
                <Star className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Ainda não há avaliações detalhadas para este hotel.</p>
            </div>
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
