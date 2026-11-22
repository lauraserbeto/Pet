import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { RatingBadge } from "../components/reviews/RatingBadge";
import { ReviewsPanel } from "../components/reviews/ReviewsPanel";
import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { toast } from "sonner";
import { productService } from "../lib/services/productService";
import { useFavorites } from "../contexts/FavoritesContext";
import { useCart } from "../components/cart/CartContext";
import {
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
  Package,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   INFORMAÇÕES DE ENTREGA
   ═══════════════════════════════════════════════ */

// DEC-C (E-06): o pedido cobra só os itens. Nada de prazos ou valores de frete
// que a plataforma não calcula nem cobra.
const deliveryInfo = [
  {
    icon: Truck,
    title: "Entrega pela loja parceira",
    desc: "Combinada com a loja após a confirmação do pedido. A Pet+ não cobra frete: o total é a soma dos itens.",
    color: "bg-blue-50 text-blue-500",
  },
];

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isFavorite: isFav, toggle: toggleFav } = useFavorites();
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "delivery">("desc");
  const query = useQuery({
    queryKey: ["public-product", id],
    queryFn: () => productService.fetchProductDetails(id!),
    enabled: !!id,
  });
  const product = query.data;
  const isFavorite = product ? isFav("PRODUCT", String(product.id)) : false;
  if (!id || query.isError)
    return (
      <section className="mx-auto max-w-4xl space-y-4 p-8" role="alert">
        <h1 className="text-xl font-bold">Não foi possível carregar o produto</h1>
        <p>Ele pode estar indisponível. Tente novamente para conferir.</p>
        <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
        <Link to="/shopping">Voltar ao Shopping</Link>
      </section>
    );
  if (query.isPending || !product)
    return (
      <p role="status" className="p-10 text-center">
        Carregando produto...
      </p>
    );
  const productFacts = [
    { label: "Categoria", value: product.category },
    { label: "Tipo de pet", value: product.pet_type },
    { label: "Código do produto", value: product.sku },
  ].filter((item) => item.value);

  const addToCart = async () => {
    if (!product) return;
    const added = await addItem(
      {
        id: String(product.id),
        name: product.name,
        brand: product.provider?.business_name ?? product.provider_name ?? "",
        price: Number(product.price) || 0,
        image: product.image_url ?? "",
      },
      quantity
    );
    if (added) {
      toast.success(`${quantity}x ${product.name} adicionado ao carrinho!`);
    }
  };

  const toggleFavorite = () => {
    if (!product) return;
    void toggleFav("PRODUCT", String(product.id));
  };

  return (
    <div className="font-[family-name:var(--font-body)] bg-slate-50 min-h-screen pb-20 sm:pb-0">
      {/* ═══════ Header/Breadcrumb ═══════ */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 sm:relative sm:top-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/shopping" className="hover:text-slate-600 transition-colors">
              Shopping
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-slate-700 font-medium truncate max-w-[150px] sm:max-w-none">
              {product.name}
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => toast("Link copiado!"))
                  .catch(() => toast.error("Não foi possível copiar o link."))
              }
              aria-label="Copiar link do produto"
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFavorite}
              aria-label={isFavorite ? "Remover dos favoritos" : "Favoritar"}
              aria-pressed={isFavorite}
              className={`p-2 transition-colors ${isFavorite ? "text-red-500" : "text-slate-400 hover:text-red-500"}`}
            >
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

                <RatingBadge {...product} />

                <div className="h-px bg-slate-50 my-2" />

                {/* Price & Installments */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">
                      {fmt(Number(product.price))}
                    </span>
                  </div>
                  {/* Sem parcelamento: o checkout não oferece parcelas (G20). */}

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
                      aria-label="Diminuir quantidade"
                      className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-none hover:shadow-sm"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 font-black text-slate-800 text-base" aria-live="polite" aria-label={`Quantidade: ${quantity}`}>{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      aria-label="Aumentar quantidade"
                      className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-none hover:shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={addToCart}
                    // No celular o container é coluna: flex-1 encolhia a altura para 24px (G15).
                    className="w-full shrink-0 sm:w-auto sm:flex-1 px-8 h-[52px] bg-gradient-to-br from-[var(--color-primary-700)] to-[var(--color-primary-800)] hover:from-[var(--color-primary-800)] hover:to-[var(--color-primary-900)] text-white font-black rounded-2xl shadow-[0_10px_25px_-5px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(249,115,22,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base"
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
                    {product.provider.user?.avatar_url ? (
                      <ImageWithFallback
                        src={product.provider.user.avatar_url}
                        alt={product.provider.business_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // Sem logo cadastrado: iniciais, em vez de <img src=""> quebrada (G15).
                      <span
                        aria-hidden="true"
                        className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-700 font-bold font-[family-name:var(--font-display)]"
                      >
                        {(product.provider.business_name || "Loja")
                          .split(/\s+/)
                          .map((part: string) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    )}
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

            {/* ─── Informações da compra ───
                Antes: "Frete Rápido / Entrega garantida" e "Ambiente 100% blindado",
                que a plataforma não oferece. Agora a regra real de entrega (DEC-C, G20). */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Truck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Entrega pela loja</span>
                  <span className="text-xs text-slate-500">Combinada após o pedido</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Sem frete da Pet+</span>
                  <span className="text-xs text-slate-500">Total = soma dos itens</span>
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
                      ? "border-[var(--color-primary-500)] text-[var(--color-primary-700)]"
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)] mb-4">
                    Sobre o produto
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line max-w-4xl">
                    {product.description}
                  </p>
                </motion.div>
              )}

              {activeTab === "specs" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)] mb-4">
                    Especificações técnicas
                  </h3>
                  <div className="border border-slate-100 rounded-xl overflow-hidden max-w-2xl">
                    {productFacts.map((s, i) => (
                      <div
                        key={s.label}
                        className={`flex justify-between sm:grid sm:grid-cols-2 px-6 py-3.5 text-sm ${
                          i % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                        }`}
                      >
                        <span className="font-medium text-slate-500">{s.label}</span>
                        <span className="text-slate-800 font-bold text-right sm:text-left">
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "delivery" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)] mb-4">
                    Informações de entrega
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deliveryInfo.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/30"
                      >
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

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ReviewsPanel target={{ product_id: id }} />
      </div>

      {/* ═══════ Mobile Sticky CTA ═══════ */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-lg font-extrabold text-slate-900">
            {fmt(Number(product.price))}
          </span>
          <span className="text-[10px] text-slate-400">Preço à vista</span>
        </div>
        <button
          onClick={addToCart}
          className="flex-1 h-11 bg-[var(--color-primary-700)] text-white font-bold rounded-xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Comprar
        </button>
      </div>
    </div>
  );
}
