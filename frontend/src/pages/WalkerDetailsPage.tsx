import { useState, useEffect } from "react";
import { providerService } from "../lib/services/providerService";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Heart,
  Share2,
  MapPin,
  Star,
  Phone,
  MessageCircle,
  PawPrint,
  ArrowLeft,
  Trophy,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Briefcase,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { isApprovedProviderStatus } from "../lib/constants/providerStatus";

export function WalkerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "services" | "reviews">(
    "about"
  );

  const [apiWalker, setApiWalker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    providerService.fetchProviderDetails(id)
      .then(data => {
        setApiWalker({
          name: data.user.full_name || data.business_name,
          age: 30, // Mock
          role: data.description || "Pet Sitter & Dog Walker",
          price: data.hourly_rate ? Number(data.hourly_rate) : 40,
          rating: 5.0,
          reviews: 24,
          distance: "2.0 km",
          experience: "3 anos",
          petsCount: 35,
          description: data.description || "Apaixonado por animais. Levo os passeios a sério.",
          image: data.user.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
          coverImage: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&auto=format&fit=crop&q=80",
          verified: isApprovedProviderStatus(data.status),
          available: true,
          services: data.services && data.services.length > 0 ? data.services.map((s: any) => ({
            name: s.name,
            price: s.price,
            description: s.description
          })) : [
            { name: "Passeio (30 min)", price: 30, description: "Passeio individual com duração de 30 minutos" },
            { name: "Pet Sitting", price: 120, description: "Cuidados na sua casa" }
          ],
          reviewsList: [
            { name: "Fernanda L.", rating: 5, text: "Incrível! Muito atencioso com meu cão.", date: "1 semana atrás" }
          ],
          highlights: (data.highlights && data.highlights.length > 0) ? data.highlights : ["Certificado profissional", "Envia fotos e vídeos"]
        });
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [id]);




  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-[family-name:var(--font-display)] text-sky-600">Carregando perfil...</div>;
  }

  if (!apiWalker) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-md w-full text-center">
        <PawPrint className="h-12 w-12 text-slate-300 mx-auto mb-4" />

        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Profissional não encontrado
        </h1>

        <p className="text-sm text-slate-500 mb-6">
          O profissional que você está procurando não existe ou não está mais disponível.
        </p>

        <Button
          className="bg-sky-600 hover:bg-sky-700"
          onClick={() => navigate("/walkers")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a lista
        </Button>
      </div>
    </div>
  );
}

const walker = apiWalker;

  const stats = [
    {
      icon: Trophy,
      label: "Experiência",
      value: walker.experience,
    },
    {
      icon: PawPrint,
      label: "Pets cuidados",
      value: `${walker.petsCount}+`,
    },
    {
      icon: Star,
      label: "Avaliação",
      value: walker.rating.toFixed(1),
    },
  ];

 
  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-[family-name:var(--font-body)]">
      {/* Cover Image */}
      <div className="relative h-[220px] sm:h-[280px] w-full bg-slate-200">
        <ImageWithFallback
          src={walker.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
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
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-white">
                <ImageWithFallback
                  src={walker.image}
                  alt={walker.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {walker.available && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-white flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
              )}
            </div>

            {/* Name & Meta */}
            <div className="flex-1 text-center sm:text-left sm:pt-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
                  {walker.name}
                </h1>
                {walker.verified && (
                  <ShieldCheck className="h-5 w-5 text-sky-500" />
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{walker.role}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {walker.distance}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {walker.experience}
                </span>
                {walker.available && (
                  <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px]">
                    <Clock className="h-3 w-3 mr-1" />
                    Disponível
                  </Badge>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="text-center sm:text-right sm:pt-2">
              <p className="text-2xl font-extrabold text-slate-900">
                R${walker.price}
              </p>
              <p className="text-xs text-slate-400">a partir de /hora</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl py-3"
              >
                <stat.icon className="h-5 w-5 text-sky-500" />
                <p className="font-bold text-slate-900 text-lg leading-none">
                  {stat.value}
                </p>
                <p className="text-[10px] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Verified Banner */}
        {walker.verified && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mt-4 bg-gradient-to-r from-sky-50 to-sky-100 border border-sky-200 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-sky-500 text-white shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sky-900 text-sm">
                Profissional Verificado
              </p>
              <p className="text-xs text-sky-700 mt-0.5">
                Identidade, antecedentes e certificações conferidos pelo Pet+.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-slate-100 rounded-xl p-1">
          {(["about", "services", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "about"
                ? "Sobre"
                : tab === "services"
                ? "Serviços"
                : `Avaliações (${walker.reviews})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "about" && (
          <motion.div
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Bio */}
            <div className="mt-6">
              <h2 className="font-bold text-slate-900 mb-2 font-[family-name:var(--font-display)]">
                Quem sou eu
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {walker.description}
              </p>
            </div>

            {/* Highlights */}
            <div className="mt-6">
              <h2 className="font-bold text-slate-900 mb-3 font-[family-name:var(--font-display)]">
                Destaques
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {walker.highlights.map((hl: string) => (
                  <div
                    key={hl}
                    className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-slate-700">{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "services" && (
          <motion.div
            key="services"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-6 space-y-3"
          >
            {walker.services.map((service: { name: string; price: number; description: string }) => (
              <div
                key={service.name}
                className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:border-sky-200 transition-colors group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {service.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <p className="font-extrabold text-slate-900">
                    R${service.price}
                  </p>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "reviews" && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-6 space-y-4"
          >
            {/* Summary */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-extrabold text-slate-900">
                  {walker.rating.toFixed(1)}
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
                  {walker.reviews} avaliações
                </p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((level) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-3">{level}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width:
                            level === 5 ? "100%" : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {walker.reviewsList.map((review: { name: string; rating: number; text: string; date: string }, i: number) => (
              <div
                key={i}
                className="bg-white border border-slate-100 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm">
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
              R${walker.price}
              <span className="text-sm font-normal text-slate-400">
                /hora
              </span>
            </p>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <Button
              className="flex-1 h-12 rounded-xl font-bold text-base gap-2 bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-200"
              onClick={() => {}}
            >
              <CalendarDays className="h-5 w-5" />
              Agendar agora
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-200"
              aria-label="Ligar"
            >
              <Phone size={20} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-200"
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
