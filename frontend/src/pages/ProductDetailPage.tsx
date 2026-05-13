import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { toast } from "sonner";
import { productService } from "../lib/services/productService";
import { useFavorites } from "../contexts/FavoritesContext";
import { useCart } from "../components/cart/CartContext";
import {
  Star,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Store,
  MessageCircle,
  Share2,
  Info,
  Camera,
  ThumbsUp,
  Package,
  Clock,
  MapPin,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   MOCK DATA (STAYS MOCKED)
   ═══════════════════════════════════════════════ */

const allProductsMock = [
  {
    id: 1,
    name: "Ração Premium Cães Adultos 15kg",
    brand: "Pedigree",
    price: 149.9,
    rating: 4.5,
    reviews: 328,
    image: "https://images.unsplash.com/photo-1725533488658-437e3619f856?w=600&q=80",
  },
  {
    id: 2,
    name: "Brinquedo Interativo Resistente",
    brand: "PetClean",
    price: 39.9,
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1714339691990-803e3dbf2056?w=600&q=80",
  },
];

const ratingDistribution = [
  { stars: 5, percentage: 72 },
  { stars: 4, percentage: 18 },
  { stars: 3, percentage: 6 },
  { stars: 2, percentage: 3 },
  { stars: 1, percentage: 1 },
];

const mockedReviews = [
  {
    id: 1,
    author: "Ana Beatriz",
    rating: 5,
    date: "15 fev 2026",
    text: "Meu cachorro adorou! A qualidade é excelente, pelagem ficou muito mais brilhante desde que troquei de ração. Recomendo demais!",
    helpful: 24,
    verified: true,
  },
  {
    id: 2,
    author: "Carlos Mendes",
    rating: 4,
    date: "10 fev 2026",
    text: "Produto de boa qualidade e entrega rápida. Só achei o preço um pouco salgado, mas vale o custo-benefício no longo prazo.",
    helpful: 12,
    verified: true,
  },
];

const mockedSpecs = [
  { label: "Peso", value: "15 kg" },
  { label: "Sabor", value: "Carne e vegetais" },
  { label: "Faixa etária", value: "Adulto (1-7 anos)" },
  { label: "Porte", value: "Médio e grande" },
  { label: "Composição", value: "Proteína 26%, Gordura 12%, Fibra 4%" },
  { label: "Validade", value: "18 meses" },
  { label: "País de origem", value: "Brasil" },
];

const mockedDelivery = [
  {
    icon: Truck,
    title: "Entrega padrão",
    desc: "3 a 7 dias úteis — Grátis para compras acima de R$ 199",
    color: "bg-blue-50 text-blue-500",
  },
  {
    icon: Clock,
    title: "Entrega expressa",
    desc: "1 a 2 dias úteis — A partir de R$ 14,90",
    color: "bg-amber-50 text-amber-500",
  },
  {
    icon: MapPin,
    title: "Retirada na loja",
    desc: "Disponível em lojas parceiras — Sem custo adicional",
    color: "bg-emerald-50 text-emerald-500",
  },
];

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : i < rating
              ? "fill-amber-400/50 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isFavorite: isFav, toggle: toggleFav } = useFavorites();
  const { addItem } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "delivery">("desc");
  const isFavorite = product ? isFav("PRODUCT", String(product.id)) : false;

  const relatedScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        if(!id) return;
        const data = await productService.fetchProductDetails(id);
        setProduct(data);
      } catch (err) {
        toast.error("Erro ao carregar os detalhes do produto.");
        setProduct({
            id: 0,
            name: "Produto não encontrado",
            price: 0,
            description: "Desculpe, não conseguimos carregar as informações deste produto.",
            image_url: ""
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="h-10 w-10 border-4 border-[var(--color-primary-100)] border-t-[var(--color-primary-600)] rounded-full"
        />
      </div>
    );
  }

  const addToCart = () => {
    if (!product) return;
    void addItem(
      {
        id: String(product.id),
        name: product.name,
        brand: product.provider?.business_name ?? product.provider_name ?? "",
        price: Number(product.price) || 0,
        image: product.image_url ?? "",
      },
      quantity
    );
    toast.success(`${quantity}x ${product.name} adicionado ao carrinho!`);
  };

  const toggleFavorite = () => {
    if (!product) return;
    void toggleFav("PRODUCT", String(product.id));
  };

  const scrollRelated = (dir: "left" | "right") => {
    relatedScrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <div className="font-[family-name:var(--font-body)] bg-slate-50 min-h-screen pb-20 sm:pb-0">
      {/* ═══════ Header/Breadcrumb ═══════ */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 sm:relative sm:top-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/shopping" className="hover:text-slate-600 transition-colors">Shopping</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-slate-700 font-medium truncate max-w-[150px] sm:max-w-none">{product.name}</span>
          </nav>
          <div className="flex items-center gap-3">
             <button onClick={() => toast("Link copiado!")} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Share2 className="h-4 w-4" />
             </button>
             <button onClick={toggleFavorite} className={`p-2 transition-colors ${isFavorite ? "text-red-500" : "text-slate-400 hover:text-red-500"}`}>
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
             </button>
          </div>
        </div>
      </div>

      {/* ═══════ Main Content Container ═══════ */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* ─── Top Section: Image & Conversion ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* Visual Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-square relative">
              <ImageWithFallback
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info Column */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* ─── Main Info Card ─── */}
            <section className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col gap-4">
                {/* Header: Title & Category/Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)] leading-[1.15] tracking-tight">
                    {product.name}
                  </h1>
                </div>
                
                {/* Rating Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    <Stars rating={4.8} size="sm" />
                    <span className="ml-1.5 text-xs font-bold text-amber-700">4.8</span>
                  </div>
                  <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer underline underline-offset-4 transition-colors">
                    X avaliações de clientes
                  </span>
                </div>

                <div className="h-px bg-slate-50 my-2" />

                {/* Price & Installments */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">
                      {fmt(Number(product.price))}
                    </span>
                    
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    ou em até <span className="text-slate-900 font-bold">10x de {fmt(Number(product.price)/10)}</span> sem juros
                  </p>
                  
                  <div className="mt-4 inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/50 transition-all hover:bg-emerald-100">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold">Em estoque</span>
                  </div>
                </div>

                {/* Buy Box */}
                <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-3">
                   {/* Modern Quantity Selector */}
                   <div className="flex items-center justify-between p-1 bg-slate-50 rounded-2xl border border-slate-100 w-full sm:w-auto">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-none hover:shadow-sm"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 font-black text-slate-800 text-base">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                        className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-none hover:shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                   </div>
                   
                   <button
                    onClick={addToCart}
                    className="flex-1 px-8 h-[52px] bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-600)] hover:from-[var(--color-primary-600)] hover:to-[var(--color-primary-700)] text-white font-black rounded-2xl shadow-[0_10px_25px_-5px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(249,115,22,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Adicionar ao Carrinho
                  </button>
                </div>
              </div>
            </section>

            {/* ─── Compact Store Profile ─── */}
            {product.provider && (
              <section className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex items-center justify-between gap-4 transition-colors hover:border-[var(--color-primary-100)]">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 shrink-0 shadow-inner">
                    <ImageWithFallback 
                      src={product.provider.user?.avatar_url} 
                      alt={product.provider.business_name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {product.provider.business_name}
                      </h3>
                      <div className="bg-blue-50 p-0.5 rounded-full">
                        <Check className="h-3 w-3 text-blue-500" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Stars rating={4.8} size="sm" />
                    </div>
                  </div>
                </div>
                <Link 
                  to={`/store/${product.provider.id}`} 
                  className="h-10 px-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 text-xs font-bold text-slate-600 rounded-xl transition-all flex items-center justify-center shrink-0"
                >
                  Ver loja
                </Link>
              </section>
            )}

            {/* ─── Premium Trust Badges ─── */}
            <div className="grid grid-cols-2 gap-4">
               <div className="group bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex items-center gap-4 transition-all hover:bg-blue-50/30">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Frete Rápido</span>
                    <span className="text-[10px] text-slate-400">Entrega garantida</span>
                  </div>
               </div>
               <div className="group bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex items-center gap-4 transition-all hover:bg-emerald-50/30">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Compra Segura</span>
                    <span className="text-[10px] text-slate-400">Ambiente 100% blindado</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Section: Full Width Tabs ─── */}
        <div className="mt-10 lg:mt-12">
            <section className="flex flex-col">
              {/* Tab headers */}
              <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-1 overflow-x-auto scrollbar-hide">
                {(
                  [
                    { key: "desc", label: "Descrição", icon: Info },
                    { key: "specs", label: "Especificações", icon: Package },
                    { key: "delivery", label: "Entrega", icon: Truck },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-6 py-4 text-sm font-bold border-b-2 transition-all shrink-0 ${
                      activeTab === tab.key
                        ? "border-[var(--color-primary-500)] text-[var(--color-primary-600)]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="bg-white rounded-b-2xl border border-t-0 border-slate-100 p-6 sm:p-8 lg:p-10 shadow-sm">
                {activeTab === "desc" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)] mb-4">
                      Sobre o produto
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line max-w-4xl">
                        {product.description}
                    </p>
                  </motion.div>
                )}

                {activeTab === "specs" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)] mb-4">
                      Especificações técnicas
                    </h3>
                    <div className="border border-slate-100 rounded-xl overflow-hidden max-w-2xl">
                      {mockedSpecs.map((s, i) => (
                        <div
                          key={s.label}
                          className={`flex justify-between sm:grid sm:grid-cols-2 px-6 py-3.5 text-sm ${
                            i % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                          }`}
                        >
                          <span className="font-medium text-slate-500">{s.label}</span>
                          <span className="text-slate-800 font-bold text-right sm:text-left">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "delivery" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)] mb-4">
                      Informações de entrega
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mockedDelivery.map((item) => (
                        <div key={item.title} className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                          <div className={`p-2.5 rounded-xl shrink-0 ${item.color}`}>
                            <item.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </section>
        </div>
      </main>

      {/* ═══════ Reviews & Ratings ═══════ */}
      <section className="bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] mb-6 sm:mb-8">
            Avaliações e Comentários
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            {/* Rating summary */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 p-5 sm:p-6">
              <div className="text-center mb-5">
                <p className="text-4xl sm:text-5xl font-extrabold text-slate-900">4.8</p>
                <div className="flex justify-center my-2">
                  <Stars rating={4.8} size="lg" />
                </div>
                <p className="text-sm text-slate-500 mt-1">150 avaliações</p>
              </div>
              <div className="space-y-2">
                {ratingDistribution.map((r) => (
                  <div key={r.stars} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-3 text-right">{r.stars}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{r.percentage}%</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-5 flex items-center justify-center gap-2 h-10 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Camera className="h-4 w-4" />
                Escrever avaliação
              </button>
            </div>

            {/* Review list */}
            <div className="lg:col-span-2 space-y-4">
              {mockedReviews.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-slate-100 rounded-xl sm:rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-[var(--color-primary-200)] to-[var(--color-primary-400)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {r.author.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-slate-800">{r.author}</p>
                          {r.verified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                              <Check className="h-3 w-3" /> Compra verificada
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Stars rating={r.rating} size="sm" />
                          <span className="text-[11px] text-slate-400">{r.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{r.text}</p>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
                    <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      Útil ({r.helpful})
                    </button>
                  </div>
                </motion.div>
              ))}

              <button className="w-full py-3 text-sm font-semibold text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded-xl transition-colors">
                Ver todas as avaliações
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Related Products (Mocked) ═══════ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
            Quem viu também gostou
          </h2>
          <div className="flex gap-2">
            <button onClick={() => scrollRelated("left")} className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-all"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => scrollRelated("right")} className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-all"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div ref={relatedScrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {allProductsMock.map((rp) => (
            <Link key={rp.id} to={`/shopping/${rp.id}`} className="shrink-0 w-[60%] sm:w-[35%] md:w-[25%] lg:w-[18%] snap-start group">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-all">
                <div className="aspect-square bg-slate-50">
                  <ImageWithFallback src={rp.image} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{rp.brand}</span>
                  <h4 className="text-xs font-bold text-slate-800 mt-1 line-clamp-2">{rp.name}</h4>
                  <div className="mt-auto pt-2">
                    <p className="text-sm font-extrabold text-slate-900">{fmt(rp.price)}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ Mobile Sticky CTA ═══════ */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center gap-4">
          <div className="flex flex-col">
             <span className="text-lg font-extrabold text-slate-900">{fmt(Number(product.price))}</span>
             <span className="text-[10px] text-slate-400">Preço à vista</span>
          </div>
          <button
            onClick={addToCart}
            className="flex-1 h-11 bg-[var(--color-primary-500)] text-white font-bold rounded-xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Comprar
          </button>
      </div>
    </div>
  );
}
