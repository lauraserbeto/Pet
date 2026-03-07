import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import {
  Search,
  Star,
  ShoppingCart,
  Heart,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  Tag,
  Truck,
  ShieldCheck,
  PawPrint,
  Dog,
  Cat,
  Fish,
  Package,
  Sparkles,
  Pill,
  Shirt,
  Bone,
  Bath,
  Sofa,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════
   DATA
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
  category: string;
  pet: string;
  badge?: string;
  isFavorite?: boolean;
};

const categories = [
  { id: "all", name: "Todos", icon: Package },
  { id: "alimentacao", name: "Alimentação", icon: Bone },
  { id: "higiene", name: "Higiene", icon: Bath },
  { id: "farmacia", name: "Farmácia", icon: Pill },
  { id: "acessorios", name: "Acessórios", icon: Tag },
  { id: "conforto", name: "Conforto", icon: Sofa },
  { id: "beleza", name: "Beleza", icon: Sparkles },
  { id: "roupas", name: "Roupas", icon: Shirt },
];

const petTypes = [
  { id: "all", name: "Todos", icon: PawPrint },
  { id: "caes", name: "Cães", icon: Dog },
  { id: "gatos", name: "Gatos", icon: Cat },
  { id: "outros", name: "Outros", icon: Fish },
];

const brands = [
  "Pedigree",
  "Royal Canin",
  "Premier",
  "GranPlus",
  "Golden",
  "Whiskas",
  "PetClean",
  "Sanol",
];

const priceRanges = [
  { id: "all", label: "Todos os preços" },
  { id: "0-50", label: "Até R$ 50" },
  { id: "50-100", label: "R$ 50 – R$ 100" },
  { id: "100-200", label: "R$ 100 – R$ 200" },
  { id: "200+", label: "Acima de R$ 200" },
];

const products: Product[] = [
  {
    id: 1,
    name: "Ração Premium Cães Adultos 15kg",
    brand: "Pedigree",
    price: 149.9,
    originalPrice: 179.9,
    rating: 4.5,
    reviews: 328,
    image: "https://images.unsplash.com/photo-1725533488658-437e3619f856?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZG9nJTIwZm9vZCUyMGJhZyUyMGtpYmJsZXxlbnwxfHx8fDE3NzIxMjE1NTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "alimentacao",
    pet: "caes",
    badge: "Mais Vendido",
  },
  {
    id: 2,
    name: "Brinquedo Interativo Resistente",
    brand: "PetClean",
    price: 39.9,
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1714339691990-803e3dbf2056?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB0b3klMjBjb2xvcmZ1bCUyMGRvZ3xlbnwxfHx8fDE3NzIxMjE1NTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "acessorios",
    pet: "caes",
  },
  {
    id: 3,
    name: "Coleira Ajustável Refletiva Premium",
    brand: "Premier",
    price: 89.9,
    originalPrice: 119.9,
    rating: 4.8,
    reviews: 94,
    image: "https://images.unsplash.com/photo-1765895899115-bfdd2854b141?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBjb2xsYXIlMjBsZWFzaCUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc3MjEyMTU1OHww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "acessorios",
    pet: "caes",
    badge: "Oferta",
  },
  {
    id: 4,
    name: "Cama Ortopédica Pet Grande",
    brand: "Premier",
    price: 219.9,
    rating: 4.9,
    reviews: 201,
    image: "https://images.unsplash.com/photo-1632147104665-09e9bf73703e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBiZWQlMjBjdXNoaW9uJTIwY29tZm9ydHxlbnwxfHx8fDE3NzIxMjE1NTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "conforto",
    pet: "caes",
    badge: "Novo",
  },
  {
    id: 5,
    name: "Suplemento Vitamínico Cães e Gatos",
    brand: "Sanol",
    price: 64.9,
    rating: 4.3,
    reviews: 78,
    image: "https://images.unsplash.com/photo-1556739664-787e863d09c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB2aXRhbWlucyUyMHN1cHBsZW1lbnRzJTIwaGVhbHRofGVufDF8fHx8MTc3MjEyMTU1OXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "farmacia",
    pet: "caes",
  },
  {
    id: 6,
    name: "Biscoito Natural Orgânico 500g",
    brand: "GranPlus",
    price: 29.9,
    rating: 4.6,
    reviews: 215,
    image: "https://images.unsplash.com/photo-1609075689223-58f5120b3d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjB0cmVhdCUyMHNuYWNrJTIwYmlzY3VpdHxlbnwxfHx8fDE3NzIxMjE1NjB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "alimentacao",
    pet: "caes",
    badge: "Popular",
  },
  {
    id: 7,
    name: "Sanitário Higiênico para Gatos",
    brand: "PetClean",
    price: 124.9,
    originalPrice: 159.9,
    rating: 4.4,
    reviews: 167,
    image: "https://images.unsplash.com/photo-1689349511905-44b0c120a05e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBsaXR0ZXIlMjBib3glMjBhY2Nlc3Nvcmllc3xlbnwxfHx8fDE3NzIxMjE1NjB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "higiene",
    pet: "gatos",
    badge: "Oferta",
  },
  {
    id: 8,
    name: "Bolsa de Transporte Acolchoada",
    brand: "Premier",
    price: 189.9,
    rating: 4.7,
    reviews: 92,
    image: "https://images.unsplash.com/photo-1765182272682-c1e8edf6251e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBjYXJyaWVyJTIwdHJhbnNwb3J0JTIwYmFnfGVufDF8fHx8MTc3MjEyMTU2MXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "conforto",
    pet: "caes",
  },
  {
    id: 9,
    name: "Roupinha Inverno Fleece M",
    brand: "PetClean",
    price: 59.9,
    rating: 4.2,
    reviews: 64,
    image: "https://images.unsplash.com/photo-1765312769388-bfb3d5d68472?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBjbG90aGluZyUyMG91dGZpdCUyMHdpbnRlcnxlbnwxfHx8fDE3NzIxMjE1NjF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "roupas",
    pet: "caes",
  },
  {
    id: 10,
    name: "Aquário Completo com Filtro 50L",
    brand: "Golden",
    price: 349.9,
    rating: 4.8,
    reviews: 45,
    image: "https://images.unsplash.com/photo-1667763207293-fab06a1accb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcXVhcml1bSUyMGZpc2glMjB0YW5rJTIwc3VwcGxpZXN8ZW58MXx8fHwxNzcyMTIxNTYxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "conforto",
    pet: "outros",
    badge: "Premium",
  },
  {
    id: 11,
    name: "Shampoo Neutro Hipoalergênico 500ml",
    brand: "Sanol",
    price: 34.9,
    rating: 4.5,
    reviews: 289,
    image: "https://images.unsplash.com/photo-1587291086390-69a3af40cf0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBzaGFtcG9vJTIwYm90dGxlJTIwZ3Jvb21pbmd8ZW58MXx8fHwxNzcyMTIxNTY1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "beleza",
    pet: "caes",
    badge: "Mais Vendido",
  },
  {
    id: 12,
    name: "Arranhador Torre para Gatos",
    brand: "Royal Canin",
    price: 279.9,
    originalPrice: 349.9,
    rating: 4.9,
    reviews: 134,
    image: "https://images.unsplash.com/photo-1762037770311-6a2e21c0fac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBzY3JhdGNoaW5nJTIwcG9zdCUyMHRvd2VyfGVufDF8fHx8MTc3MjEyMTU2NXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "conforto",
    pet: "gatos",
    badge: "Oferta",
  },
];

const sortOptions = [
  { value: "relevance", label: "Relevância" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
  { value: "rating", label: "Melhor avaliação" },
  { value: "reviews", label: "Mais avaliados" },
];

/* ══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export function ShoppingPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPet, setSelectedPet] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sidebar section toggles
  const [openSections, setOpenSections] = useState({
    category: true,
    pet: true,
    price: true,
    brand: true,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const toggleBrand = (brand: string) =>
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast("Removido dos favoritos");
      } else {
        next.add(id);
        toast.success("Adicionado aos favoritos!");
      }
      return next;
    });
  };

  const addToCart = (product: Product) => {
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedPet("all");
    setSelectedPrice("all");
    setSelectedBrands([]);
    setSearch("");
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedPet !== "all" ||
    selectedPrice !== "all" ||
    selectedBrands.length > 0 ||
    search.length > 0;

  /* ─── Filtering + Sorting ─── */
  const filtered = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "all")
      result = result.filter((p) => p.category === selectedCategory);
    if (selectedPet !== "all")
      result = result.filter((p) => p.pet === selectedPet);
    if (selectedBrands.length > 0)
      result = result.filter((p) => selectedBrands.includes(p.brand));
    if (selectedPrice !== "all") {
      const [min, max] = selectedPrice.includes("+")
        ? [parseInt(selectedPrice), Infinity]
        : selectedPrice.split("-").map(Number);
      result = result.filter((p) => p.price >= min && p.price <= max);
    }

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "reviews":
        result.sort((a, b) => b.reviews - a.reviews);
        break;
    }

    return result;
  }, [search, selectedCategory, selectedPet, selectedPrice, selectedBrands, sortBy]);

  /* ─── Filter sidebar (shared for desktop & mobile drawer) ─── */
  const FilterContent = () => (
    <div className="space-y-5">
      {/* Pet type */}
      <div>
        <button
          onClick={() => toggleSection("pet")}
          className="flex items-center justify-between w-full text-sm font-bold text-slate-800 mb-2"
        >
          Tipo de Pet
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${openSections.pet ? "rotate-180" : ""}`}
          />
        </button>
        {openSections.pet && (
          <div className="space-y-1">
            {petTypes.map((pt) => (
              <button
                key={pt.id}
                onClick={() => setSelectedPet(pt.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedPet === pt.id
                    ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)] font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <pt.icon className="h-4 w-4" />
                {pt.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <button
          onClick={() => toggleSection("category")}
          className="flex items-center justify-between w-full text-sm font-bold text-slate-800 mb-2"
        >
          Categoria
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${openSections.category ? "rotate-180" : ""}`}
          />
        </button>
        {openSections.category && (
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)] font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div>
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full text-sm font-bold text-slate-800 mb-2"
        >
          Faixa de Preço
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${openSections.price ? "rotate-180" : ""}`}
          />
        </button>
        {openSections.price && (
          <div className="space-y-1">
            {priceRanges.map((pr) => (
              <button
                key={pr.id}
                onClick={() => setSelectedPrice(pr.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedPrice === pr.id
                    ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)] font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pr.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Brand */}
      <div>
        <button
          onClick={() => toggleSection("brand")}
          className="flex items-center justify-between w-full text-sm font-bold text-slate-800 mb-2"
        >
          Marca
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${openSections.brand ? "rotate-180" : ""}`}
          />
        </button>
        {openSections.brand && (
          <div className="space-y-1">
            {brands.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="h-4 w-4 rounded border-slate-300 text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
                />
                {brand}
              </label>
            ))}
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full text-sm text-red-500 hover:text-red-600 font-medium py-2"
        >
          Limpar todos os filtros
        </button>
      )}
    </div>
  );

  const badgeColor = (badge: string) => {
    switch (badge) {
      case "Mais Vendido":
        return "bg-emerald-500";
      case "Oferta":
        return "bg-red-500";
      case "Novo":
        return "bg-blue-500";
      case "Popular":
        return "bg-[var(--color-primary-500)]";
      case "Premium":
        return "bg-amber-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="font-[family-name:var(--font-body)] bg-slate-50 min-h-screen">
      {/* ═══════ Hero ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary-500)] via-[var(--color-primary-400)] to-amber-400">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-white" />
          <div className="absolute bottom-0 right-0 w-56 sm:w-96 h-56 sm:h-96 rounded-full bg-white translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full mb-4">
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Shopping Pet+
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-[family-name:var(--font-display)] leading-tight">
              Tudo para o seu <span className="text-amber-200">pet</span>
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-white/90 max-w-lg mx-auto leading-relaxed">
              Rações, brinquedos, acessórios e muito mais com os melhores preços e
              entrega rápida.
            </p>

            {/* Search bar */}
            <div className="mt-6 sm:mt-8 relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produtos, marcas..."
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-white text-slate-800 placeholder:text-slate-400 shadow-lg shadow-orange-600/10 border-0 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm sm:text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 text-white/80 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> Frete grátis acima de R$ 199
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Compra segura
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="h-4 w-4" /> Ofertas diárias
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ Pet Type Pills (mobile-visible, desktop too) ═══════ */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {petTypes.map((pt) => (
              <button
                key={pt.id}
                onClick={() => setSelectedPet(pt.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedPet === pt.id
                    ? "bg-[#b6ddf4] text-[#3699d2]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <pt.icon className="h-4 w-4" />
                {pt.name}
              </button>
            ))}

            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1 shrink-0" />

            {/* Category pills — horizontal on the same strip */}
            {categories.filter(c => c.id !== "all").map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? "all" : cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)] ring-1 ring-[var(--color-primary-200)]"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ Main Content ═══════ */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex gap-8">
          {/* ─── Desktop Sidebar ─── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-36 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-900 mb-4 font-[family-name:var(--font-display)] flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[var(--color-primary-500)]" />
                Filtros
              </h3>
              <FilterContent />
            </div>
          </aside>

          {/* ─── Products Area ─── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors shadow-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-[var(--color-primary-500)] text-white text-[10px] font-bold">
                      !
                    </span>
                  )}
                </button>

                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-800">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? "produto" : "produtos"}
                </p>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="self-start sm:self-auto text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-300)] shadow-sm"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedPet !== "all" && (
                  <Chip label={petTypes.find((p) => p.id === selectedPet)!.name} onRemove={() => setSelectedPet("all")} />
                )}
                {selectedCategory !== "all" && (
                  <Chip label={categories.find((c) => c.id === selectedCategory)!.name} onRemove={() => setSelectedCategory("all")} />
                )}
                {selectedPrice !== "all" && (
                  <Chip label={priceRanges.find((p) => p.id === selectedPrice)!.label} onRemove={() => setSelectedPrice("all")} />
                )}
                {selectedBrands.map((b) => (
                  <Chip key={b} label={b} onRemove={() => toggleBrand(b)} />
                ))}
                {search && <Chip label={`"${search}"`} onRemove={() => setSearch("")} />}
              </div>
            )}

            {/* Product Grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {filtered.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="group bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col relative"
                  >
                    {/* Image */}
                    <Link to={`/shopping/${product.id}`} className="relative aspect-square bg-slate-100 overflow-hidden">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Badge */}
                      {product.badge && (
                        <span
                          className={`absolute top-2 left-2 sm:top-3 sm:left-3 ${badgeColor(product.badge)} text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md`}
                        >
                          {product.badge}
                        </span>
                      )}

                      {/* Discount % */}
                      {product.originalPrice && (
                        <span className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md">
                          -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </span>
                      )}
                    </Link>

                    {/* Favorite */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          favorites.has(product.id)
                            ? "fill-red-500 text-red-500"
                            : "text-slate-400"
                        }`}
                      />
                    </button>

                    {/* Info */}
                    <div className="flex-1 flex flex-col p-3 sm:p-4">
                      {/* Brand */}
                      <span className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wide">
                        {product.brand}
                      </span>

                      {/* Name */}
                      <h3 className="mt-1 text-xs sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2 font-[family-name:var(--font-display)]">
                        {product.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <Star
                              key={j}
                              className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                                j < Math.floor(product.rating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-slate-200 text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] sm:text-xs text-slate-400">
                          {product.rating} ({product.reviews})
                        </span>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Price + Button */}
                      <div className="mt-2 sm:mt-3">
                        {product.originalPrice && (
                          <p className="text-[10px] sm:text-xs text-slate-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                          </p>
                        )}
                        <div className="flex items-end justify-between gap-2">
                          <p className="text-sm sm:text-base font-extrabold text-slate-900">
                            R$ {product.price.toFixed(2).replace(".", ",")}
                          </p>
                          <button
                            onClick={() => addToCart(product)}
                            className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white flex items-center justify-center shadow-md shadow-orange-200 transition-colors"
                          >
                            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="text-center py-16 sm:py-24">
                <div className="inline-flex h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-slate-100 items-center justify-center mb-4">
                  <Search className="h-7 w-7 sm:h-8 sm:w-8 text-slate-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Tente ajustar os filtros ou buscar por outro termo.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm font-medium text-[var(--color-primary-600)] hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ Mobile Filter Drawer ═══════ */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[var(--color-primary-500)]" />
                  Filtros
                </h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterContent />
              </div>
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-bold rounded-xl transition-colors"
                >
                  Ver {filtered.length} produto{filtered.length !== 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Chip Component ─── */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="h-4 w-4 rounded-full hover:bg-[var(--color-primary-200)] flex items-center justify-center transition-colors"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}