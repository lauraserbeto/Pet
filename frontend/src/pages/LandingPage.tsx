import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence, useInView } from "motion/react";
import { toast } from "sonner";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
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
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useCart } from "../components/cart/CartContext";
import { HeroSearch } from "../components/layout/HeroSearch";
import { AnimatedHeroIllustration } from "../components/layout/AnimatedHeroIllustration";

/* ═══════════════════════════════════════════════
   PRODUCT DATA
   ═══════════════════════════════════════════════ */

type Product = {
  id: number;
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

const weeklyHighlights: Product[] = [
  {
    id: 1,
    name: "Ração Premium Cães Adultos 15kg",
    brand: "Royal Canin",
    price: 149.9,
    originalPrice: 189.9,
    rating: 4.8,
    reviews: 328,
    image:
      "https://images.unsplash.com/photo-1725533488658-437e3619f856?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZG9nJTIwZm9vZCUyMGJhZyUyMGtpYmJsZXxlbnwxfHx8fDE3NzIxMjE1NTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "Mais Vendido",
    discount: 21,
  },
  {
    id: 3,
    name: "Coleira Refletiva Premium Ajustável",
    brand: "Premier",
    price: 89.9,
    originalPrice: 119.9,
    rating: 4.7,
    reviews: 94,
    image:
      "https://images.unsplash.com/photo-1765895899115-bfdd2854b141?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBjb2xsYXIlMjBsZWFzaCUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc3MjEyMTU1OHww&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "Oferta",
    discount: 25,
  },
  {
    id: 4,
    name: "Cama Ortopédica Pet Grande",
    brand: "Premier",
    price: 219.9,
    originalPrice: 289.9,
    rating: 4.9,
    reviews: 201,
    image:
      "https://images.unsplash.com/photo-1632147104665-09e9bf73703e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBiZWQlMjBjdXNoaW9uJTIwY29tZm9ydHxlbnwxfHx8fDE3NzIxMjE1NTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "Novo",
    discount: 24,
  },
  {
    id: 2,
    name: "Brinquedo Interativo Resistente",
    brand: "PetClean",
    price: 39.9,
    rating: 4.6,
    reviews: 156,
    image:
      "https://images.unsplash.com/photo-1714339691990-803e3dbf2056?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB0b3klMjBjb2xvcmZ1bCUyMGRvZ3xlbnwxfHx8fDE3NzIxMjE1NTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 5,
    name: "Suplemento Vitamínico Cães e Gatos",
    brand: "Sanol",
    price: 54.9,
    originalPrice: 69.9,
    rating: 4.5,
    reviews: 78,
    image:
      "https://images.unsplash.com/photo-1770836037793-95bdbf190f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJpYW4lMjBwZXQlMjBoZWFsdGglMjBjaGVja3VwfGVufDF8fHx8MTc3MjQyODU2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    discount: 21,
  },
  {
    id: 6,
    name: "Roupa Pet Fashion Inverno",
    brand: "PetStyle",
    price: 79.9,
    originalPrice: 99.9,
    rating: 4.4,
    reviews: 62,
    image:
      "https://images.unsplash.com/photo-1630438994394-3deff7a591bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZnJlbmNoJTIwYnVsbGRvZyUyMHN3ZWF0ZXIlMjBvdXRmaXR8ZW58MXx8fHwxNzcyNDYzNDkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "Oferta",
    discount: 20,
  },
];



const popularCategories = [
  {
    id: "alimentacao",
    name: "Alimentação",
    icon: Bone,
    image:
      "https://images.unsplash.com/photo-1734654901149-02a9a5f7993b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBmb29kJTIwYm93bCUyMHByZW1pdW0lMjBraWJibGV8ZW58MXx8fHwxNzcyNDYzNDg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    count: 186,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "brinquedos",
    name: "Brinquedos",
    icon: Sparkles,
    image:
      "https://images.unsplash.com/photo-1744710835733-936ab49ee0b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBwbGF5aW5nJTIwdG95JTIwY29sb3JmdWx8ZW58MXx8fHwxNzcyNDYzNDg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    count: 124,
    color: "from-pink-400 to-rose-500",
  },
  {
    id: "higiene",
    name: "Higiene",
    icon: Bath,
    image:
      "https://images.unsplash.com/photo-1597595735781-6a57fb8e3e3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBncm9vbWluZyUyMHNhbG9uJTIwYmF0aHxlbnwxfHx8fDE3NzI0Mjg1NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    count: 98,
    color: "from-sky-400 to-blue-500",
  },
  {
    id: "acessorios",
    name: "Acessórios",
    icon: Tag,
    image:
      "https://images.unsplash.com/photo-1710683941590-fd4f339f0c7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBhY2Nlc3NvcmllcyUyMGNvbGxhciUyMGxlYXNoJTIwc3R5bGlzaHxlbnwxfHx8fDE3NzI0NjM0ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    count: 142,
    color: "from-violet-400 to-purple-500",
  },
  {
    id: "conforto",
    name: "Conforto",
    icon: Sofa,
    image:
      "https://images.unsplash.com/photo-1632147104665-09e9bf73703e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwZG9nJTIwYmVkJTIwc2xlZXBpbmclMjBjdXNoaW9ufGVufDF8fHx8MTc3MjQ2MzQ4OHww&ixlib=rb-4.1.0&q=80&w=1080",
    count: 76,
    color: "from-teal-400 to-emerald-500",
  },
  {
    id: "farmacia",
    name: "Farmácia",
    icon: Pill,
    image:
      "https://images.unsplash.com/photo-1770836037793-95bdbf190f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJpYW4lMjBwZXQlMjBoZWFsdGglMjBjaGVja3VwfGVufDF8fHx8MTc3MjQyODU2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    count: 64,
    color: "from-green-400 to-emerald-500",
  },
  {
    id: "roupas",
    name: "Roupas",
    icon: Shirt,
    image:
      "https://images.unsplash.com/photo-1769483167964-44e703deab9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBjbG90aGluZyUyMGZhc2hpb24lMjBkb2clMjBzdHlsaXNofGVufDF8fHx8MTc3MjQ2MzQ5OHww&ixlib=rb-4.1.0&q=80&w=1080",
    count: 53,
    color: "from-fuchsia-400 to-pink-500",
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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col bg-white rounded-2xl border border-slate-100/60 shadow-sm hover:shadow-xl transition-shadow overflow-hidden"
    >
      {/* Image */}
      <Link to={`/shopping/${product.id}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
      <div className="flex flex-col flex-1 p-4 gap-2">
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
          onClick={() => {
            // NOTE: LandingPage usa Product mock (id: number); cart server rejeita
            // ids não-UUID com 422. Quando integrado ao catálogo real, basta
            // garantir que `product.id` venha como UUID do backend.
            addItem({
              id: String(product.id),
              name: product.name,
              brand: product.brand,
              price: product.price,
              originalPrice: product.originalPrice,
              image: product.image,
            });
            toast.success(`${product.name} adicionado ao carrinho!`);
          }}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary-500)] to-orange-400 text-white text-sm font-semibold hover:from-[var(--color-primary-600)] hover:to-orange-500 active:scale-[0.98] transition-all shadow-md shadow-orange-500/20"
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
        className={`flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 ${className}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {/* Gradient fades */}
      {canLeft && (
        <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none z-[5]" />
      )}
      {canRight && (
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none z-[5]" />
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
  badge: string;
  badgeIcon?: React.ElementType;
  title: string;
  subtitle: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
      <div>
        <div className="inline-flex items-center gap-2 bg-[var(--color-primary-50)] text-[var(--color-primary-600)] px-3.5 py-1.5 rounded-full mb-3">
          {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5" />}
          <span className="text-xs font-semibold">{badge}</span>
        </div>
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
    badge: "Pet+",
    title: "Cuidado completo para quem é ",
    highlight: "família",
    description: "De cuidados especializados aos melhores produtos. Encontre tudo o que você precisa para garantir o bem-estar do seu melhor amigo em um só lugar.",
    image: "https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "from-orange-50 to-amber-100",
    blobColor: "bg-orange-400",
    ctaText: "Explorar Serviços",
    ctaLink: "/walkers",
    features: [
      { icon: Shield, title: "Segurança Total", subtitle: "Parceiros verificados" },
      { icon: Calendar, title: "Agendamento Fácil", subtitle: "Online e instantâneo" }
    ]
  },
  {
    id: 2,
    badge: "Shopping",
    title: "Ofertas exclusivas no ",
    highlight: "Shopping Pet",
    description: "As melhores marcas com descontos imperdíveis. Ração, brinquedos, acessórios e farmácia com entrega rápida na sua porta.",
    image: "https://images.unsplash.com/photo-1597843786411-a7fa8ad44a95?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "from-purple-50 to-indigo-100",
    blobColor: "bg-purple-400",
    ctaText: "Acessar Loja",
    ctaLink: "/shopping",
    features: [
      { icon: Zap, title: "Entrega Rápida", subtitle: "Para toda a cidade" },
      { icon: Tag, title: "Melhores Preços", subtitle: "Ofertas diárias" }
    ]
  },
  {
    id: 3,
    badge: "Serviços",
    title: "Encontre o Pet Sitter ou ",
    highlight: "Hotel ideal",
    description: "Viaje tranquilo ou trabalhe sem preocupações. Conectamos você aos melhores cuidadores e hotéis verificados da região.",
    image: "https://images.unsplash.com/photo-1494947665470-20322015e3a8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "from-teal-50 to-emerald-100",
    blobColor: "bg-teal-400",
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
    <div className="relative w-full overflow-hidden bg-white min-h-[600px] md:min-h-[700px] flex items-center pt-16 md:pt-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.color} opacity-40`}
        />
      </AnimatePresence>

      {/* Animated Blobs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`blob-${slide.id}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 1.5 }}
          className={`absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full blur-[100px] ${slide.blobColor}`}
        />
      </AnimatePresence>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:32px_32px] opacity-30 z-0 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 lg:px-16 relative z-10 py-12 md:py-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${slide.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center"
          >
            {/* Content */}
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-display)] leading-[1.1]">
                {slide.title}
                <span className="relative inline-block text-[var(--color-primary-600)]">
                  {slide.highlight}
                  <svg viewBox="0 0 200 20" className="absolute -bottom-2 left-0 w-full h-3 text-[var(--color-primary-200)] -z-0">
                    <path d="M0 10 Q 50 0 100 10 T 200 10" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                  </svg>
                </span>.
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed font-medium">
                {slide.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Link to={slide.ctaLink}>
                  <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl rounded-xl px-10 h-14 text-lg font-bold transition-all hover:scale-105 active:scale-95">
                    {slide.ctaText}
                  </Button>
                </Link>
                <Link to="/shopping">
                  <Button size="lg" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-xl px-8 h-14 text-base font-semibold">
                    Ver Catálogo
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-8 pt-6">
                {slide.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="p-3 rounded-xl bg-white/60 backdrop-blur-sm text-slate-700 shadow-sm border border-white/40 group-hover:scale-110 transition-transform">
                      <feat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{feat.title}</p>
                      <p className="text-xs text-slate-500">{feat.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/50"
              >
                <img src={slide.image} alt={slide.highlight} className="w-full h-full object-cover" />
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

  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-body)]">
      {/* ═══════════════════════════════════════════════
          1. HERO
          ═══════════════════════════════════════════════ */}
      <HeroCarousel />

      

      {/* ═══════════════════════════════════════════════
          3. DESTAQUES DA SEMANA — Carousel Progressivo
          ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Promoção"
            badgeIcon={Flame}
            title="Destaques da Semana"
            subtitle="Produtos selecionados com descontos imperdíveis."
            action="Ver todo o Shopping"
            actionHref="/shopping"
          />

          {/* Timer bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-8 p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-white" />
              <span className="text-sm font-semibold text-white">
                Ofertas encerram em:
              </span>
            </div>
            <CountdownTimer />
          </div>

          <HorizontalCarousel>
            {weeklyHighlights.map((product) => (
              <div
                key={product.id}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </HorizontalCarousel>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          4. CATEGORIAS POPULARES — Cards Visuais Premium
          ═══════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        {/* Background blob for depth */}
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-100 rounded-full blur-[100px] opacity-60 -translate-y-1/2 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Navegue"
            badgeIcon={Sparkles}
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
                  <div className="relative">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden ring-2 ring-slate-100 group-hover:ring-[var(--color-primary-300)] transition-all shadow-sm group-hover:shadow-md">
                      <ImageWithFallback
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
              Tudo que seu pet precisa
            </h2>
            <p className="mt-4 text-slate-600">
              Navegue por categorias e encontre o serviço ideal.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "Hotelaria",
                icon: Hotel,
                color: "text-blue-600",
                bg: "bg-blue-50",
                desc: "Hospedagem segura e confortável para o seu pet",
                href: "/hotels",
                image: "https://images.unsplash.com/photo-1516222338250-863216ce01ea?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              },
              {
                name: "Pet Sitter",
                icon: PawPrint,
                color: "text-orange-600",
                bg: "bg-orange-50",
                desc: "Cuidadores verificados na sua casa ou na deles",
                href: "/walkers",
                image: "https://images.unsplash.com/photo-1553322378-eb94e5966b0c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              },
              {
                name: "Shopping",
                icon: ShoppingBag,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                desc: "Rações, brinquedos e tudo para o dia a dia",
                href: "/shopping",
                image: "https://images.unsplash.com/photo-1684176025658-7befca57913f?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              },
            ].map((cat) => (
              <Link key={cat.name} to={cat.href} className="group relative block rounded-[2.5rem] overflow-hidden bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100">
                <div className="h-48 overflow-hidden relative">
                   <ImageWithFallback 
                     src={cat.image} 
                     className="w-full h-full object-cover" 
                     alt={cat.name} 
                   />
                   <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
                </div>
                
                <div className="relative z-20 px-8 pb-8 -mt-10">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${cat.bg} ${cat.color} shadow-lg ring-4 ring-white transition-transform group-hover:scale-110 duration-500`}>
                    <cat.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] mb-3 group-hover:text-[var(--color-primary-600)] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {cat.desc}
                  </p>
                  
                  <div className={`mt-6 flex items-center gap-2 text-sm font-bold ${cat.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                    Explorar <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      
      

      {/* ═══════════════════════════════════════════════
          6. CTA PARCEIROS
          ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-[var(--color-primary-600)] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 font-[family-name:var(--font-display)]">
            Você tem um Pet Shop ou Clínica?
          </h2>
          <p className="text-lg text-[var(--color-primary-100)] mb-8 max-w-2xl mx-auto">
            Junte-se ao Pet+ e expanda seu negócio. Gerencie agendamentos,
            clientes e produtos em um só lugar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" className="font-bold">
              Cadastrar meu Negócio
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10"
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          7. SOCIAL PROOF — Depoimentos + Instagram
          ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Comunidade"
            badgeIcon={Heart}
            title="Amado por Tutores"
            subtitle="Veja o que dizem os tutores que confiam no Pet+."
          />

          {/* Testimonials carousel */}
          <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-6 sm:p-10 mb-12 sm:mb-16">
            <Quote className="absolute top-6 left-6 h-10 w-10 text-[var(--color-primary-200)] opacity-60" />

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

      
    </div>
  );
}

export { LandingPage };