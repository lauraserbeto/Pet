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
  Bell,
  Heart,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Flame,
  TrendingUp,
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

const bestSellers: (Product & { soldCount: number })[] = [
  {
    id: 1,
    name: "Ração Premium Cães Adultos 15kg",
    brand: "Royal Canin",
    price: 149.9,
    originalPrice: 189.9,
    rating: 4.8,
    reviews: 328,
    soldCount: 2340,
    image:
      "https://images.unsplash.com/photo-1725533488658-437e3619f856?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZG9nJTIwZm9vZCUyMGJhZyUyMGtpYmJsZXxlbnwxfHx8fDE3NzIxMjE1NTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "Mais Vendido",
    discount: 21,
  },
  {
    id: 4,
    name: "Cama Ortopédica Pet Grande",
    brand: "Premier",
    price: 219.9,
    originalPrice: 289.9,
    rating: 4.9,
    reviews: 201,
    soldCount: 1890,
    image:
      "https://images.unsplash.com/photo-1632147104665-09e9bf73703e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBiZWQlMjBjdXNoaW9uJTIwY29tZm9ydHxlbnwxfHx8fDE3NzIxMjE1NTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    discount: 24,
  },
  {
    id: 2,
    name: "Brinquedo Interativo Resistente",
    brand: "PetClean",
    price: 39.9,
    rating: 4.6,
    reviews: 156,
    soldCount: 1520,
    image:
      "https://images.unsplash.com/photo-1714339691990-803e3dbf2056?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB0b3klMjBjb2xvcmZ1bCUyMGRvZ3xlbnwxfHx8fDE3NzIxMjE1NTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3,
    name: "Coleira Refletiva Premium Ajustável",
    brand: "Premier",
    price: 89.9,
    originalPrice: 119.9,
    rating: 4.7,
    reviews: 94,
    soldCount: 1180,
    image:
      "https://images.unsplash.com/photo-1765895899115-bfdd2854b141?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBjb2xsYXIlMjBsZWFzaCUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc3MjEyMTU1OHww&ixlib=rb-4.1.0&q=80&w=1080",
    discount: 25,
  },
  {
    id: 5,
    name: "Suplemento Vitamínico Cães e Gatos",
    brand: "Sanol",
    price: 54.9,
    originalPrice: 69.9,
    rating: 4.5,
    reviews: 78,
    soldCount: 980,
    image:
      "https://images.unsplash.com/photo-1770836037793-95bdbf190f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJpYW4lMjBwZXQlMjBoZWFsdGglMjBjaGVja3VwfGVufDF8fHx8MTc3MjQyODU2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    discount: 21,
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

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-xl)] transition-shadow overflow-hidden"
    >
      {/* Image */}
      <Link to={`/shopping/${product.id}`} className="relative block aspect-square overflow-hidden bg-[var(--bg-sunken)]">
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
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-[var(--bg-surface)] transition-colors"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              fav ? "fill-red-500 text-red-500" : "text-[var(--text-muted)]"
            }`}
          />
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
          {product.brand}
        </p>
        <Link
          to={`/shopping/${product.id}`}
          className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 hover:text-[var(--accent-text)] transition-colors font-[family-name:var(--font-display)]"
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
                    : "text-[var(--border-default)]"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-2">
          {product.originalPrice && (
            <span className="text-xs text-[var(--text-muted)] line-through mr-2">
              R$ {product.originalPrice.toFixed(2).replace(".", ",")}
            </span>
          )}
          <span className="text-lg font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={() => toast.success(`${product.name} adicionado ao carrinho!`)}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--accent-bg)] text-[var(--text-on-accent)] text-sm font-semibold hover:bg-[var(--accent-bg-hover)] active:scale-[0.98] transition-all"
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
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[var(--bg-surface)] shadow-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:shadow-xl transition-all hidden sm:flex"
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
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[var(--bg-surface)] shadow-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:shadow-xl transition-all hidden sm:flex"
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
        <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-[var(--bg-base)] to-transparent pointer-events-none z-[5]" />
      )}
      {canRight && (
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[var(--bg-base)] to-transparent pointer-events-none z-[5]" />
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
        <div className="inline-flex items-center gap-2 bg-[var(--accent-bg-subtle)] text-[var(--accent-text)] px-3.5 py-1.5 rounded-full mb-3">
          {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5" />}
          <span className="text-xs font-semibold">{badge}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
          {title}
        </h2>
        <p className="mt-1.5 text-sm sm:text-base text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      {action && actionHref && (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-text)] hover:text-[var(--accent-bg)] transition-colors shrink-0"
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
      <section className="relative bg-[var(--secondary-bg-subtle)] py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge
                variant="subtle"
                className="px-4 py-1 text-sm font-medium rounded-full shadow-sm"
              >
                A melhor plataforma para seu pet
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] font-[family-name:var(--font-display)]">
                Cuidado completo para quem você{" "}
                <span className="text-[var(--accent-bg)]">mais ama</span>.
              </h1>
              <p className="text-lg text-[var(--text-secondary)] max-w-xl">
                Encontre hotéis pet, pet sitters e os melhores produtos no nosso
                Shopping. Agende serviços, compare preços e garanta o bem-estar
                do seu melhor amigo.
              </p>

              <div className="bg-[var(--bg-surface)] p-4 rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--border-default)] max-w-lg">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
                    <Input
                      placeholder="O que seu pet precisa?"
                      className="pl-9 border-0 bg-[var(--bg-sunken)] focus-visible:ring-0"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
                    <Input
                      placeholder="Localização"
                      className="pl-9 border-0 bg-[var(--bg-sunken)] focus-visible:ring-0"
                    />
                  </div>
                  <Button size="lg" className="w-full md:w-auto">
                    Buscar
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)] font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[var(--secondary-text)]" />
                  Profissionais Verificados
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[var(--secondary-text)]" />
                  Agendamento Online
                </div>
              </div>
            </div>
            <div className="relative lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1719292606971-0916fc62f5b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXIlMjBkb2clMjBoYXBweXxlbnwxfHx8fDE3NzE4ODA5NjN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Happy Dog"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-white bg-slate-200"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    +2.000 tutores satisfeitos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[var(--accent-bg)]/15 rounded-full blur-3xl z-0" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[var(--secondary-bg)]/15 rounded-full blur-3xl z-0" />
      </section>

      {/* ═══════════════════════════════════════════════
          2. SERVIÇOS — 3 Cards
          ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-[var(--bg-surface)]">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
              Tudo que seu pet precisa
            </h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Navegue por categorias e encontre o serviço ideal.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                name: "Hotelaria",
                icon: Hotel,
                color: "bg-[var(--secondary-bg-subtle)] text-[var(--secondary-text)]",
                href: "/hotels",
              },
              {
                name: "Pet Sitter",
                icon: PawPrint,
                color: "bg-[var(--accent-bg-subtle)] text-[var(--accent-text)]",
                href: "/walkers",
              },
              {
                name: "Shopping",
                icon: ShoppingBag,
                color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                href: "/shopping",
              },
            ].map((cat) => (
              <Link key={cat.name} to={cat.href}>
                <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--card-hover-border)] transition-all group cursor-pointer">
                  <div
                    className={`p-4 rounded-full ${cat.color} mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <cat.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. DESTAQUES DA SEMANA — Carousel Progressivo
          ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-[var(--bg-base)]">
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
          4. CATEGORIAS POPULARES — Circular visual
          ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden ring-2 ring-[var(--border-default)] group-hover:ring-[var(--accent-bg)] transition-all shadow-sm group-hover:shadow-md">
                      <ImageWithFallback
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r ${cat.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm`}
                    >
                      {cat.count}
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--accent-text)] transition-colors text-center font-[family-name:var(--font-display)]">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          5. BEST SELLERS — Lista Numerada
          ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-[var(--bg-base)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Ranking"
            badgeIcon={TrendingUp}
            title="Best Sellers"
            subtitle="Os 5 produtos mais vendidos deste mês."
            action="Ver mais produtos"
            actionHref="/shopping"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Featured #1 — Big card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="lg:row-span-2 bg-gradient-to-br from-[var(--accent-bg-subtle)] to-[var(--accent-bg-subtle)] rounded-2xl border border-[var(--card-border)] overflow-hidden group"
            >
              <Link to={`/shopping/${bestSellers[0].id}`} className="block">
                <div className="relative aspect-square overflow-hidden">
                  <ImageWithFallback
                    src={bestSellers[0].image}
                    alt={bestSellers[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <span className="text-white font-extrabold font-[family-name:var(--font-display)]">
                        1
                      </span>
                    </div>
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
                      Mais Vendido
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    {bestSellers[0].brand}
                  </p>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-[family-name:var(--font-display)]">
                    {bestSellers[0].name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= Math.round(bestSellers[0].rating)
                              ? "text-amber-400 fill-amber-400"
                              : "text-[var(--border-default)]"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      ({bestSellers[0].reviews})
                    </span>
                    <span className="text-xs text-emerald-600 font-medium">
                      {bestSellers[0].soldCount.toLocaleString("pt-BR")} vendidos
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {bestSellers[0].originalPrice && (
                      <span className="text-sm text-[var(--text-muted)] line-through">
                        R$ {bestSellers[0].originalPrice.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
                      R$ {bestSellers[0].price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* #2–5 compact cards */}
            {bestSellers.slice(1).map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (i + 1) * 0.08 }}
              >
                <Link
                  to={`/shopping/${product.id}`}
                  className="flex items-center gap-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-3 sm:p-4 hover:shadow-[var(--shadow-lg)] hover:border-[var(--card-hover-border)] transition-all group"
                >
                  {/* Rank number */}
                  <div
                    className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center font-extrabold font-[family-name:var(--font-display)] text-sm shadow-sm ${
                      i === 0
                        ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                        : i === 1
                        ? "bg-gradient-to-br from-amber-700 to-amber-800 text-white"
                        : "bg-[var(--bg-sunken)] text-[var(--text-muted)]"
                    }`}
                  >
                    {i + 2}
                  </div>

                  {/* Image */}
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-sunken)]">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      {product.brand}
                    </p>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate font-[family-name:var(--font-display)]">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-2.5 w-2.5 ${
                              s <= Math.round(product.rating)
                                ? "text-amber-400 fill-amber-400"
                                : "text-[var(--border-default)]"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {product.soldCount.toLocaleString("pt-BR")} vendidos
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    {product.originalPrice && (
                      <span className="text-[10px] text-[var(--text-muted)] line-through block">
                        R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    <span className="text-base font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          6. CTA PARCEIROS
          ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-[var(--accent-bg)] text-[var(--text-on-accent)]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 font-[family-name:var(--font-display)]">
            Você tem um Pet Shop ou Clínica?
          </h2>
          <p className="text-lg text-[var(--text-on-accent)]/80 mb-8 max-w-2xl mx-auto">
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
      <section className="py-16 sm:py-20 bg-[var(--bg-surface)] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Comunidade"
            badgeIcon={Heart}
            title="Amado por Tutores"
            subtitle="Veja o que dizem os tutores que confiam no Pet+."
          />

          {/* Testimonials carousel */}
          <div className="relative bg-gradient-to-br from-[var(--bg-sunken)] to-[var(--bg-base)] rounded-3xl p-6 sm:p-10 mb-12 sm:mb-16 border border-[var(--border-subtle)]">
            <Quote className="absolute top-6 left-6 h-10 w-10 text-[var(--accent-bg)]/30" />

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
                  <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-full overflow-hidden ring-4 ring-[var(--bg-surface)] shadow-lg">
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
                  <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed mb-4 italic">
                    "{testimonials[testimonialIdx].text}"
                  </p>
                  <div>
                    <p className="font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
                      {testimonials[testimonialIdx].name}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      Tutor(a) de{" "}
                      <span className="font-medium text-[var(--accent-text)]">
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
                className="h-9 w-9 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
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
                        ? "w-6 bg-[var(--accent-bg)]"
                        : "w-2 bg-[var(--border-strong)] hover:bg-[var(--text-muted)]"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextTestimonial}
                className="h-9 w-9 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Instagram Grid */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              <Instagram className="h-5 w-5 text-pink-500" />
              <span>
                Siga <span className="text-[var(--accent-text)]">@petmais</span>{" "}
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
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          8. NEWSLETTER / OFERTAS — Banner de captura
          ═══════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-20 bg-gradient-to-br from-[var(--color-primary-700)] via-[var(--accent-bg)] to-[var(--color-primary-400)] overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-16 -mb-16" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-5">
              <Gift className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">
                Oferta Exclusiva
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 font-[family-name:var(--font-display)]">
              Ganhe 15% OFF na primeira compra
            </h2>
            <p className="text-white/80 mb-3 max-w-xl mx-auto">
              Cadastre seu e-mail e receba ofertas exclusivas, novidades e um
              cupom especial de boas-vindas. Válido por tempo limitado!
            </p>

            {/* Scarcity trigger */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm text-white/90">
                <strong className="text-yellow-300">247 pessoas</strong>{" "}
                se cadastraram nas últimas 24h
              </span>
            </div>

            {/* Email form */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Seu melhor e-mail"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <button
                onClick={() => {
                  if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) {
                    toast.error("Informe um e-mail válido.");
                    return;
                  }
                  toast.success("Cadastro realizado! Verifique seu e-mail para o cupom.");
                  setNewsletterEmail("");
                }}
                className="px-8 py-3.5 rounded-xl bg-[#1A1A2E] text-white text-sm font-semibold hover:bg-[#2A2A3E] transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Tag className="h-4 w-4" />
                Quero meu cupom
              </button>
            </div>

            <p className="text-xs text-white/50 mt-4">
              Sem spam. Cancele quando quiser. Consulte nossa{" "}
              <Link to="/privacy" className="underline hover:text-white/80">
                Política de Privacidade
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export { LandingPage };
