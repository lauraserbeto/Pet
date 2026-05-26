import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence, useInView } from "motion/react";
import { toast } from "sonner";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";

// Import local assets for services section
import petSitterImg from "../assets/imgs/c5143ed5-35e8-48be-97b7-d281b9de4a15.png";
import petShopImg from "../assets/imgs/450b354e-1b6f-4f83-9dcf-84ed5d9ac6be.png";
import hotelImg from "../assets/imgs/26376cf8-e893-4f9d-a14c-69c5063c4a73.png";

// Import local assets for popular categories
import catAlimentacao from "../assets/imgs/cat_alimentacao.png";
import catBrinquedos from "../assets/imgs/cat_brinquedos.png";
import catHigiene from "../assets/imgs/cat_higiene.png";
import catAcessorios from "../assets/imgs/cat_acessorios.png";
import catConforto from "../assets/imgs/cat_conforto.png";
import catFarmacia from "../assets/imgs/cat_farmacia.png";
import catRoupas from "../assets/imgs/cat_roupas.png";

// Import local assets for hero section
import heroCarePets from "../assets/imgs/hero_care_pets.png";
import heroShopDog from "../assets/imgs/hero_shop_dog.png";
import heroServicePet from "../assets/imgs/hero_service_pet.png";
import ctaPartnerHotel from "../assets/imgs/cta_partner_hotel.png";

import {
  Search,
  MapPin,
  Calendar,
  Shield,
  Hotel,
  PawPrint,
  ShoppingBag,
  Star,
  Heart,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Flame,
  ArrowRight,
  Sparkles,
  Gift,
  Clock,
  Zap,
  Instagram,
  Quote,
  Mail,
  Tag,
  Bone,
  Pill,
  Shirt,
  Bath,
  Sofa,
  Store,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useCart } from "../components/cart/CartContext";
import { HeroSearch } from "../components/layout/HeroSearch";
import { AnimatedHeroIllustration } from "../components/layout/AnimatedHeroIllustration";
import { productService } from "../lib/services/productService";

/* ═══════════════════════════════════════════════
   PRODUCT DATA
   ═══════════════════════════════════════════════ */

type Product = {
  id: string | number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  discount?: number;
  soldCount?: number;
};





const popularCategories = [
  {
    id: "alimentacao",
    name: "Alimentação",
    icon: Bone,
    image: catAlimentacao,
    count: 186,
    color: "from-amber-400 to-orange-500",
    pastelBg: "bg-[#FFF4E6]",
  },
  {
    id: "brinquedos",
    name: "Brinquedos",
    icon: Sparkles,
    image: catBrinquedos,
    count: 124,
    color: "from-pink-400 to-rose-500",
    pastelBg: "bg-[#FFF0F6]",
  },
  {
    id: "higiene",
    name: "Higiene",
    icon: Bath,
    image: catHigiene,
    count: 98,
    color: "from-sky-400 to-blue-500",
    pastelBg: "bg-[#E6F7FF]",
  },
  {
    id: "acessorios",
    name: "Acessórios",
    icon: Tag,
    image: catAcessorios,
    count: 142,
    color: "from-violet-400 to-purple-500",
    pastelBg: "bg-[#F3F0FF]",
  },
  {
    id: "conforto",
    name: "Conforto",
    icon: Sofa,
    image: catConforto,
    count: 76,
    color: "from-teal-400 to-emerald-500",
    pastelBg: "bg-[#E6FFFA]",
  },
  {
    id: "farmacia",
    name: "Farmácia",
    icon: Pill,
    image: catFarmacia,
    count: 64,
    color: "from-green-400 to-emerald-500",
    pastelBg: "bg-[#EAFDF5]",
  },
  {
    id: "roupas",
    name: "Roupas",
    icon: Shirt,
    image: catRoupas,
    count: 53,
    color: "from-fuchsia-400 to-pink-500",
    pastelBg: "bg-[#FFF0FD]",
  },
];

const testimonials = [
  {
    id: 1,
    name: "Juliana Mendes",
    avatar:
      "https://images.unsplash.com/photo-1760551936981-d1d74af8c33d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0JTIwaGVhZHNob3QlMjBjYXN1YWx8ZW58MXx8fHwxNzcyNDYzNDk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    text: "O Pet+ mudou completamente como cuido do meu golden! A hotelaria é incrível e o shopping tem tudo que preciso. Já comprei ração, brinquedos e cama — entrega super rápida!",
    petName: "Thor",
    rating: 5,
  },
  {
    id: 2,
    name: "Rafael Costa",
    avatar:
      "https://images.unsplash.com/photo-1769071167455-e5779ecc81a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3QlMjBjYXN1YWwlMjBmcmllbmRseXxlbnwxfHx8fDE3NzI0NjM0OTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    text: "Como parceiro Pet Sitter, a plataforma facilitou muito minha vida. O dashboard é completo, consigo gerenciar agendamentos e recebo avaliações direto no app. Recomendo demais!",
    petName: "Luna",
    rating: 5,
  },
  {
    id: 3,
    name: "Fernanda Oliveira",
    avatar:
      "https://images.unsplash.com/photo-1758600433358-b44bf8a32c8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWRkbGUlMjBhZ2VkJTIwd29tYW4lMjBwb3J0cmFpdCUyMGhlYWRzaG90JTIwd2FybXxlbnwxfHx8fDE3NzI0NjM0OTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    text: "Uso o Pet+ toda semana! Os preços do Shopping são muito competitivos e os Pet Sitters são super carinhosos com minha gatinha. Melhor plataforma pet que já usei.",
    petName: "Mimi",
    rating: 5,
  },
];

const instagramPhotos = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1565169464865-9f33e7987eb7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHdvbWFuJTIwaHVnZ2luZyUyMGdvbGRlbiUyMHJldHJpZXZlcnxlbnwxfHx8fDE3NzI0NjM0ODl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 342,
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1637739393754-1e8fe712583d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjB3YWxraW5nJTIwZG9nJTIwcGFyayUyMGF1dHVtbnxlbnwxfHx8fDE3NzI0NjM0ODl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 287,
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1760141080554-1ce4c4be4612?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBwbGF5aW5nJTIwcHVwcHklMjBiYWNreWFyZHxlbnwxfHx8fDE3NzI0NjM0ODl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 519,
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1630438994394-3deff7a591bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZnJlbmNoJTIwYnVsbGRvZyUyMHN3ZWF0ZXIlMjBvdXRmaXR8ZW58MXx8fHwxNzcyNDYzNDkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 456,
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1736331552060-bd3ed18cb2fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBzbGVlcGluZyUyMGNvenklMjBibGFua2V0JTIwaW5kb29yfGVufDF8fHx8MTc3MjQ0MjU4OHww&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 398,
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1769690093961-5241cea477e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBzdG9yZSUyMHNob3BwaW5nJTIwbW9kZXJuJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcyNDYzNDkxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 267,
  },
];

/* ═══════════════════════════════════════════════
   PRODUCT CARD
   ═══════════════════════════════════════════════ */

function ProductCard({ product }: { product: Product }) {
  const [fav, setFav] = useState(false);
  const { addItem } = useCart();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col h-full bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all overflow-hidden"
    >
      {/* Image */}
      <Link to={`/shopping/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-50/50 p-2.5">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-500"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.discount && (
            <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
              <Zap className="h-3 w-3" />
              -{product.discount}%
            </span>
          )}
          {product.badge && (
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm ${
                product.badge === "Mais Vendido"
                  ? "bg-amber-400 text-amber-900"
                  : product.badge === "Novo"
                  ? "bg-emerald-500 text-white"
                  : "bg-violet-500 text-white"
              }`}
            >
              {product.badge}
            </span>
          )}
        </div>
        {/* Fav */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setFav(!fav);
            toast.success(fav ? "Removido dos favoritos" : "Adicionado aos favoritos");
          }}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              fav ? "fill-red-500 text-red-500" : "text-slate-400"
            }`}
          />
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
          {product.brand}
        </p>
        <Link
          to={`/shopping/${product.id}`}
          className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 hover:text-[var(--color-primary-600)] transition-colors font-[family-name:var(--font-display)]"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-3 w-3 ${
                  s <= Math.round(product.rating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-400">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-2">
          {product.originalPrice && (
            <span className="text-xs text-slate-400 line-through mr-2">
              R$ {product.originalPrice.toFixed(2).replace(".", ",")}
            </span>
          )}
          <span className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)]">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={async () => {
            // NOTE: LandingPage usa Product mock (id: number); cart server rejeita
            // ids não-UUID com 422. Quando integrado ao catálogo real, basta
            // garantir que `product.id` venha como UUID do backend.
            const added = await addItem({
              id: String(product.id),
              name: product.name,
              brand: product.brand,
              price: product.price,
              originalPrice: product.originalPrice,
              image: product.image,
            });
            if (added) {
              toast.success(`${product.name} adicionado ao carrinho!`);
            }
          }}
          className="mt-1.5 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-[var(--color-primary-500)] to-orange-400 text-white text-xs font-semibold hover:from-[var(--color-primary-600)] hover:to-orange-500 active:scale-[0.98] transition-all shadow-sm"
        >
          <ShoppingCart className="h-4 w-4" />
          Adicionar
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   HORIZONTAL SCROLL CAROUSEL
   ═══════════════════════════════════════════════ */

function HorizontalCarousel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    return () => el?.removeEventListener("scroll", checkScroll);
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.72;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group/carousel">
      {/* Arrows */}
      <AnimatePresence>
        {canLeft && (
          <motion.button
            key="left"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            onClick={() => scroll("left")}
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:shadow-xl transition-all hidden sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {canRight && (
          <motion.button
            key="right"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            onClick={() => scroll("right")}
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:shadow-xl transition-all hidden sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scrollable area */}
      <div
        ref={scrollRef}
        className={`flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pt-2 pb-2 ${className}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {/* Gradient fades */}
      {canLeft && (
        <div className="absolute left-0 top-2 bottom-2 w-8 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none z-[5]" />
      )}
      {canRight && (
        <div className="absolute right-0 top-2 bottom-2 w-8 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none z-[5]" />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════ */

function SectionHeader({
  badge,
  badgeIcon: BadgeIcon,
  title,
  subtitle,
  action,
  actionHref,
}: {
  badge?: string;
  badgeIcon?: React.ElementType;
  title: string;
  subtitle: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
          {title}
        </h2>
        <p className="mt-1.5 text-sm sm:text-base text-slate-500">{subtitle}</p>
      </div>
      {action && actionHref && (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors shrink-0"
        >
          {action}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COUNTDOWN TIMER
   ═══════════════════════════════════════════════ */

function CountdownTimer() {
  const [time, setTime] = useState({ h: 5, m: 23, s: 47 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) {
          s = 59;
          m--;
        }
        if (m < 0) {
          m = 59;
          h--;
        }
        if (h < 0) return { h: 5, m: 23, s: 47 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      {[
        { val: pad(time.h), label: "h" },
        { val: pad(time.m), label: "m" },
        { val: pad(time.s), label: "s" },
      ].map((t, i) => (
        <div key={t.label} className="flex items-center gap-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 min-w-[40px] text-center">
            <span className="text-lg sm:text-xl font-bold font-mono text-white">
              {t.val}
            </span>
          </div>
          {i < 2 && <span className="text-white/60 font-bold text-lg">:</span>}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HERO CAROUSEL
   ═══════════════════════════════════════════════ */

const heroSlides = [
  {
    id: 1,
    title: "Cuidado completo para quem é ",
    highlight: "família",
    description: "De cuidados especializados aos melhores produtos. Encontre tudo o que você precisa para garantir o bem-estar do seu melhor amigo em um só lugar.",
    image: heroCarePets,
    bgColor: "bg-[#edf4de]", // Light pastel lime green
    blobColor: "bg-[#cddba9]",
    yellowBlobColor: "bg-[#fcd015]",
    ctaText: "Explorar Serviços",
    ctaLink: "/walkers",
    features: [
      { icon: Shield, title: "Segurança Total", subtitle: "Parceiros verificados" },
      { icon: Calendar, title: "Agendamento Fácil", subtitle: "Online e instantâneo" }
    ]
  },
  {
    id: 2,
    badgeText: "Ofertas Especiais",
    title: "Ofertas exclusivas no ",
    highlight: "Shopping Pet",
    description: "As melhores marcas com descontos imperdíveis. Ração, brinquedos, acessórios e farmácia com entrega rápida na sua porta.",
    image: heroShopDog,
    bgColor: "bg-[#eef2ff]", // Light pastel blue/indigo
    blobColor: "bg-[#c7d2fe]",
    yellowBlobColor: "bg-[#fb923c]", // Orange blob behind blue theme
    ctaText: "Acessar Loja",
    ctaLink: "/shopping",
    features: [
      { icon: Zap, title: "Entrega Rápida", subtitle: "Para toda a cidade" },
      { icon: Tag, title: "Melhores Preços", subtitle: "Ofertas diárias" }
    ]
  },
  {
    id: 3,
    badgeText: "Hospedagem & Cuidados",
    title: "Encontre o Pet Sitter ou ",
    highlight: "Hotel ideal",
    description: "Viaje tranquilo ou trabalhe sem preocupações. Conectamos você aos melhores cuidadores e hotéis verificados da região.",
    image: heroServicePet,
    bgColor: "bg-[#fdf4e9]", // Light pastel peach/amber
    blobColor: "bg-[#fed7aa]",
    yellowBlobColor: "bg-[#4ade80]", // Pastel green blob behind peach theme
    ctaText: "Buscar Hotéis",
    ctaLink: "/hotels",
    features: [
      { icon: Hotel, title: "Hospedagem", subtitle: "Conforto garantido" },
      { icon: PawPrint, title: "Pet Sitters", subtitle: "Cuidados em casa" }
    ]
  }
];

function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <div className="relative w-full overflow-hidden bg-white min-h-[calc(100vh-76px)] flex items-center pt-24 pb-16 lg:py-0">
      {/* Dynamic Background Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 ${slide.bgColor} transition-colors duration-700`}
        />
      </AnimatePresence>

      {/* Top Hanging Blobs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`top-blobs-${slide.id}`}
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 0.7, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-x-0 top-0 h-[180px] overflow-hidden pointer-events-none z-0"
        >
          {/* Main center-left hanging blob */}
          <div className={`absolute top-0 left-[35%] w-[160px] h-[70px] rounded-b-[40px] opacity-75 blur-[1px] transition-all duration-700 ${slide.blobColor}`} />
          {/* Top-right hanging blob */}
          <div className={`absolute top-0 right-[15%] w-[200px] h-[85px] rounded-b-[50px] opacity-60 blur-[2px] transition-all duration-700 ${slide.blobColor}`} />
          {/* Subtle dots or bubbles */}
          <div className={`absolute top-[40px] left-[32%] w-3 h-3 rounded-full opacity-60 transition-all duration-700 ${slide.blobColor}`} />
          <div className={`absolute top-[80px] right-[25%] w-4 h-4 rounded-full opacity-50 transition-all duration-700 ${slide.blobColor}`} />
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:32px_32px] opacity-25 z-0 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 py-8 lg:py-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${slide.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center"
          >
            {/* Content */}
            <div className="space-y-6">

              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-[4.5rem] font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-display)] leading-[1.15] filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]">
                {slide.title}
                <span className="relative inline-block text-[var(--color-primary-600)]">
                  {slide.highlight}
                  <svg viewBox="0 0 200 20" className="absolute -bottom-2 left-0 w-full h-3 text-[var(--color-primary-200)] -z-0">
                    <path d="M0 10 Q 50 0 100 10 T 200 10" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                  </svg>
                </span>.
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-xl leading-relaxed font-semibold">
                {slide.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Link to={slide.ctaLink}>
                  <Button size="lg" className="bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] shadow-lg rounded-full px-10 h-14 text-lg font-bold transition-all hover:scale-105 active:scale-95 border-none">
                    {slide.ctaText}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image Section with Blob, Lines, and Paws */}
            <div className="relative flex items-center justify-center min-h-[300px] md:min-h-[460px]">
              {/* Yellow organic blob behind the image */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`blob-bg-${slide.id}`}
                  initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
                  animate={{ opacity: 0.9, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 20 }}
                  transition={{ duration: 0.8 }}
                  className={`absolute w-[220px] h-[220px] min-[375px]:w-[280px] min-[375px]:h-[280px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] transition-all duration-700 ${slide.yellowBlobColor} -z-10`}
                  style={{ borderRadius: "60% 40% 60% 40% / 40% 60% 40% 60%" }}
                />
              </AnimatePresence>

              {/* Decorative lines behind the pet */}
              <div className="absolute right-[5%] top-[10%] w-[1px] h-[120px] bg-slate-400/20 rotate-[15deg] hidden sm:block" />
              <div className="absolute right-[3%] top-[15%] w-[1px] h-[90px] bg-slate-400/20 rotate-[15deg] hidden sm:block" />

              {/* Floating Paw Prints */}
              <motion.div
                animate={{ y: [0, -12, 0], rotate: [15, 20, 15] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute -top-6 right-[20%] text-slate-800/15"
              >
                <PawPrint className="h-9 w-9" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0], rotate: [-10, -5, -10] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-[12%] right-[5%] text-slate-800/10"
              >
                <PawPrint className="h-7 w-7" />
              </motion.div>

              {/* Faded bone icon bottom-left */}
              <motion.div
                animate={{ rotate: [-25, -20, -25] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute bottom-[8%] left-[5%] text-slate-800/15 hidden sm:block"
              >
                <Bone className="h-16 w-16" />
              </motion.div>

              {/* Cutout Image of Pets (using SVG chroma filter to remove white background cleanly) */}
              <motion.div
                key={`img-${slide.id}`}
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-[240px] h-[240px] min-[375px]:w-[290px] min-[375px]:h-[290px] sm:w-[350px] sm:h-[350px] md:w-[410px] md:h-[410px] z-10 flex items-center justify-center overflow-visible"
              >
                <img
                  src={slide.image}
                  alt={slide.highlight}
                  className="w-full h-full object-contain select-none"
                  style={{ filter: "url(#remove-white) drop-shadow(0 20px 25px rgba(0, 0, 0, 0.12))" }}
                />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === currentSlide ? "w-8 bg-[var(--color-primary-600)]" : "w-2.5 bg-slate-300 hover:bg-slate-400"
            }`}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>

      {/* SVG Chromakey Filter to key out white background dynamically */}
      <svg className="absolute w-0 h-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="remove-white">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              -1 -1 -1 3 0
            " />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════ */

export default function LandingPage() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const nextTestimonial = () =>
    setTestimonialIdx((i) => (i + 1) % testimonials.length);
  const prevTestimonial = () =>
    setTestimonialIdx((i) => (i - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    const timer = setInterval(nextTestimonial, 6000);
    return () => clearInterval(timer);
  }, []);

  const [highlights, setHighlights] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHighlights = async () => {
      try {
        const data = await productService.fetchAllPublicProducts();
        const now = new Date();
        const mapped: Product[] = data.map((p: any) => {
          let badge = undefined;
          if (p.created_at) {
            const createdAt = new Date(p.created_at);
            const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
            if (daysDiff <= 7) {
              badge = "Novo";
            }
          }
          return {
            id: p.id,
            name: p.name,
            brand: p.provider_name || 'Desconhecida',
            price: Number(p.price),
            rating: 4.8, 
            reviews: Math.floor(Math.random() * 100) + 10,
            image: p.image_url || "https://images.unsplash.com/photo-1725533488658-437e3619f856",
            badge: badge
          };
        });
        if (mapped.length > 0) {
          setHighlights(mapped.slice(0, 8));
        }
      } catch (err: any) {
        console.error("Erro ao carregar os produtos na landing page.");
      } finally {
        setLoading(false);
      }
    };
    loadHighlights();
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-body)]">
      {/* ═══════════════════════════════════════════════
          1. HERO
          ═══════════════════════════════════════════════ */}
      <HeroCarousel />

      {/* Wrapper to standardize background color between Hero and Footer */}
      <div className="bg-slate-50">

      {/* ═══════════════════════════════════════════════
          4. CATEGORIAS POPULARES — Cards Visuais Premium
          ═══════════════════════════════════════════════ */}
      <section className="relative py-10 sm:py-14 overflow-hidden">
        {/* Background blob for depth */}
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-100 rounded-full blur-[100px] opacity-60 -translate-y-1/2 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Categorias Populares"
            subtitle="Encontre rapidamente o que seu pet precisa."
            action="Ver todas as categorias"
            actionHref="/shopping"
          />

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6">
            {popularCategories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Link
                  to={`/shopping?category=${cat.id}`}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="relative flex items-center justify-center w-30 h-30 sm:w-30 sm:w-30">
                    {/* Dashed outer border ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200 group-hover:border-[var(--color-primary-500)] transition-colors duration-300" />
                    
                    {/* Sparkles / Shiny lines effect on hover */}
                    <div className="absolute -top-1.5 -right-1.5 opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 pointer-events-none z-20">
                      <Sparkles className="h-5 w-5 text-amber-500 fill-amber-300" />
                    </div>

                    {/* Inner circle with pastel bg or solid brand bg on hover */}
                    <div className={`absolute w-[86%] h-[86%] rounded-full ${cat.pastelBg} group-hover:bg-[var(--color-primary-500)] transition-all duration-300 flex items-center justify-center overflow-visible`}>
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-[85%] h-[85%] object-contain transform group-hover:scale-115 group-hover:-translate-y-1 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-[var(--color-primary-600)] transition-colors text-center font-[family-name:var(--font-display)]">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════
          2. SERVIÇOS — 3 Cards
          ═══════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Tudo que seu pet precisa"
            subtitle="Navegue por categorias e encontre o serviço ideal."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "Hotelaria",
                bgColor: "bg-[#7148c4]",
                gradient: "from-[#7148c4] via-[#7148c4]/30 to-transparent",
                desc: "Hospedagem segura e confortável para o seu pet.",
                href: "/hotels",
                image: hotelImg,
                icon: PawPrint,
                iconClass: "w-40 h-40 -bottom-10 -left-6 rotate-[15deg] opacity-10"
              },
              {
                name: "Pet Sitter",
                bgColor: "bg-[#f57a26]",
                gradient: "from-[#f57a26] via-[#f57a26]/20 to-transparent",
                desc: "Cuidadores verificados na sua casa ou na deles.",
                href: "/walkers",
                image: petSitterImg,
                icon: PawPrint,
                iconClass: "w-28 h-28 -bottom-4 left-4 -rotate-12 opacity-20"
              },
              {
                name: "Shopping",
                bgColor: "bg-[#2563eb]",
                gradient: "from-[#2563eb] via-[#2563eb]/30 to-transparent",
                desc: "Rações, brinquedos e tudo para o dia a dia.",
                href: "/shopping",
                image: petShopImg,
                icon: Bone,
                iconClass: "w-32 h-32 -bottom-4 left-4 rotate-45 opacity-20"
              },
            ].map((cat) => (
              <Link key={cat.name} to={cat.href} className={`group relative block rounded-[2rem] overflow-hidden ${cat.bgColor} hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 min-h-[280px]`}>
                
                {/* Decorative blob */}
                <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                
                {/* Background watermark icon */}
                <div className={`absolute ${cat.iconClass} transition-transform duration-500 group-hover:scale-105`}>
                   <cat.icon className="w-full h-full text-white fill-white" />
                </div>

                {/* Right side image with gradient mask */}
                <div className="absolute top-0 right-0 w-[60%] sm:w-[55%] h-full">
                   <div className={`absolute inset-0 bg-gradient-to-r ${cat.gradient} z-10 w-full`} />
                   <ImageWithFallback 
                     src={cat.image} 
                     className="w-full h-full object-cover object-center" 
                     alt={cat.name} 
                   />
                </div>
                
                {/* Content */}
                <div className="relative z-20 flex flex-col h-full p-6 sm:p-8 w-[65%] sm:w-[60%]">
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-display)] mb-2 leading-tight">
                    {cat.name}
                  </h3>
                  <p className="text-white/95 font-medium text-sm sm:text-[15px] leading-relaxed mb-6">
                    {cat.desc}
                  </p>
                  
                  <div className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                    <span className="underline underline-offset-[5px] decoration-1 decoration-white/70 group-hover:decoration-white transition-colors">
                      Explorar
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      

      {/* ═══════════════════════════════════════════════
          3. DESTAQUES DA SEMANA — Carousel Progressivo
          ═══════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Produtos em Destaque"
            subtitle="Os produtos mais procurados pelos nossos clientes."
            action="Ver todo o Shopping"
            actionHref="/shopping"
          />

          {/* Timer bar */}
          {/* <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-8 p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-white" />
              <span className="text-sm font-semibold text-white">
                Ofertas encerram em:
              </span>
            </div>
            <CountdownTimer />
          </div> */}

          <HorizontalCarousel>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 w-full min-h-[200px] col-span-full">
                <Loader2 className="h-8 w-8 text-[var(--color-primary-500)] animate-spin" />
                <p className="mt-3 text-sm text-slate-500 font-semibold tracking-wide animate-pulse">
                  Carregando produtos...
                </p>
              </div>
            ) : highlights.length > 0 ? (
              highlights.map((product) => (
                <div
                  key={product.id}
                  className="w-[210px] sm:w-[230px] shrink-0 snap-start flex flex-col"
                >
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 w-full text-center text-slate-400 font-medium col-span-full">
                Nenhum produto em destaque disponível no momento.
              </div>
            )}
          </HorizontalCarousel>
        </div>
      </section>

      

      

      
      

      {/* ═══════════════════════════════════════════════
          6. CTA PARCEIROS - PREMIUM 3D
          ═══════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative bg-[#eef2ff] rounded-[2rem] sm:rounded-[2.5rem] py-8 px-6 sm:py-10 sm:px-10 lg:py-10 lg:px-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 border border-indigo-200/80">
            
            {/* Floaty Elements */}
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-8 left-8 lg:left-16 text-indigo-300/40 z-0 hidden sm:block"
            >
              <PawPrint className="w-10 h-10" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 12, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-8 right-8 lg:right-1/3 text-purple-300/40 z-0 hidden sm:block"
            >
              <Heart className="w-8 h-8" />
            </motion.div>

            {/* Left side: Text Content */}
            <div className="flex-1 text-center lg:text-left relative z-10 order-2 lg:order-1">
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] mb-4 leading-tight">
                Você tem um Pet Shop, Hotel ou é Cuidador?
              </h2>
              <p className="text-slate-600 text-base mb-6 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Junte-se ao Pet+ e expanda seu negócio. Gerencie agendamentos, atração de clientes e faturamento em uma única plataforma inteligente.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/partners" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-bold shadow-md shadow-primary-500/10 px-6 rounded-full h-11 text-sm">
                    Conhecer Área de Parceiros
                  </Button>
                </Link>
                <Link to="/about" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold px-6 rounded-full h-11 text-sm shadow-sm">
                    Saiba Mais
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side: 3D Image */}
            <div className="flex-1 relative z-10 w-full max-w-[240px] sm:max-w-[280px] lg:max-w-[320px] mx-auto order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative aspect-square flex items-center justify-center"
              >
                {/* Image Backdrop Blob */}
                <div className="absolute inset-0 bg-[#c7d2fe]/40 rounded-full blur-2xl opacity-60 mix-blend-multiply" />
                
                <ImageWithFallback
                  src={ctaPartnerHotel}
                  alt="Profissional trabalhando em hotel pet"
                  className="relative z-10 w-full h-full object-contain drop-shadow-lg"
                  style={{ filter: "url(#remove-white)" }}
                />
              </motion.div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          7. SOCIAL PROOF — Depoimentos + Instagram
          ═══════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Comunidade"
            badgeIcon={Heart}
            title="Amado por Tutores"
            subtitle="Veja o que dizem os tutores que confiam no Pet+."
          />

          {/* Testimonials carousel */}
          <div className="relative bg-[#fff7ed] rounded-[2rem] sm:rounded-[2.5rem] border border-orange-200/80 p-6 sm:p-10 mb-12 sm:mb-16">
            <Quote className="absolute top-6 left-6 h-10 w-10 text-orange-300 opacity-50" />

            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIdx}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col md:flex-row items-center gap-6 sm:gap-10"
              >
                {/* Avatar */}
                <div className="shrink-0">
                  <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                    <ImageWithFallback
                      src={testimonials[testimonialIdx].avatar}
                      alt={testimonials[testimonialIdx].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex justify-center md:justify-start mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="h-4 w-4 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-4 italic">
                    "{testimonials[testimonialIdx].text}"
                  </p>
                  <div>
                    <p className="font-bold text-slate-900 font-[family-name:var(--font-display)]">
                      {testimonials[testimonialIdx].name}
                    </p>
                    <p className="text-sm text-slate-500">
                      Tutor(a) de{" "}
                      <span className="font-medium text-[var(--color-primary-600)]">
                        {testimonials[testimonialIdx].petName}
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-center md:justify-end gap-3 mt-6">
              <button
                onClick={prevTestimonial}
                className="h-9 w-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIdx(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === testimonialIdx
                        ? "w-6 bg-[var(--color-primary-500)]"
                        : "w-2 bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextTestimonial}
                className="h-9 w-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Instagram Grid */}
          {/* <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Instagram className="h-5 w-5 text-pink-500" />
              <span>
                Siga <span className="text-[var(--color-primary-600)]">@petplus</span>{" "}
                no Instagram
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {instagramPhotos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer"
              >
                <ImageWithFallback
                  src={photo.image}
                  alt={`Instagram ${photo.id}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-white">
                    <Heart className="h-4 w-4 fill-white" />
                    <span className="text-sm font-semibold">{photo.likes}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div> */}
        </div>
      </section>

      </div> {/* End of bg-slate-50 wrapper */}
    </div>
  );
}

export { LandingPage };