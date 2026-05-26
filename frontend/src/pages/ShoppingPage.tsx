import { useState, useMemo, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { HamsterLoader } from "../components/ui/HamsterLoader";
import { Link } from "react-router";
import { toast } from "sonner";
import { productService } from "../lib/services/productService";
import { useFavorites } from "../contexts/FavoritesContext";
import { useCart } from "../components/cart/CartContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

/* ═══════════════════════════════════════════════
   DATA
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
  const [sortBy, setSortBy] = useState("relevance");
  const { isFavorite, toggle: toggleFavoriteCtx } = useFavorites();
  const { addItem } = useCart();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
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
            category: p.category ? p.category.toLowerCase() : 'outros',
            pet: p.pet_type ? (p.pet_type.toLowerCase() === 'cães' || p.pet_type.toLowerCase() === 'caes' ? 'caes' : p.pet_type.toLowerCase()) : 'todos',
            badge: badge
          };
        });
        
        setApiProducts(mapped);
      } catch (err: any) {
        toast.error("Erro ao carregar o catálogo de produtos.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Sidebar section toggles
  const [openSections, setOpenSections] = useState({
    category: true,
    pet: true,
    price: true,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const toggleFavorite = (id: string | number) => {
    void toggleFavoriteCtx("PRODUCT", String(id));
  };

  const addToCart = async (product: Product) => {
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
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedPet("all");
    setSelectedPrice("all");
    setSearch("");
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedPet !== "all" ||
    selectedPrice !== "all" ||
    search.length > 0;

  /* ─── Filtering + Sorting ─── */
  const filtered = useMemo(() => {
    let result = [...apiProducts];

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
  }, [search, selectedCategory, selectedPet, selectedPrice, sortBy, apiProducts]);

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

      {/* ═══════ Pet Type Pills (mobile/tablet-only quick switcher) ═══════ */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-100 shadow-sm lg:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 py-3 overflow-x-auto scrollbar-hide">
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
                  <span className="font-semibold text-slate-800">{loading ? "Carregando catálogo..." : `${filtered.length} ${filtered.length === 1 ? 'produto' : 'produtos'}`}</span>
                </p>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-white border-slate-200 rounded-xl shadow-sm text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && !loading && (
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

                {search && <Chip label={`"${search}"`} onRemove={() => setSearch("")} />}
              </div>
            )}

            {/* Content Switcher */}
            {loading ? (
              <HamsterLoader message="Carregando catálogo completo..." size="sm" />
            ) : filtered.length > 0 ? (
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
                    </Link>

                    {/* Favorite */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          isFavorite("PRODUCT", String(product.id))
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
