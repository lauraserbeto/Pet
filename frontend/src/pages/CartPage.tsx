import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { useCart } from "../components/cart/CartContext";
import { toast } from "sonner";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  PackageOpen,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useState } from "react";

export function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "PETMAIS15") {
      setDiscount(totalPrice * 0.15);
      toast.success("Cupom aplicado! 15% de desconto.");
    } else {
      toast.error("Cupom inválido. Tente PETMAIS15");
    }
  };

  const shipping = totalPrice >= 199 ? 0 : 14.9;
  const finalTotal = totalPrice - discount + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <PackageOpen className="h-20 w-20 text-slate-200 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-[family-name:var(--font-display)]">
            Seu carrinho está vazio
          </h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            Explore nosso Shopping e adicione produtos incríveis para o seu pet!
          </p>
          <Link to="/shopping">
            <Button size="lg" className="gap-2">
              <ShoppingCart className="h-5 w-5" />
              Ir para o Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-6xl px-4 py-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
                Meu Carrinho
              </h1>
              <p className="text-sm text-slate-500">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link to={`/shopping/${item.id}`} className="shrink-0">
                      <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden bg-slate-100">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                        {item.brand}
                      </p>
                      <Link
                        to={`/shopping/${item.id}`}
                        className="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-[var(--color-primary-600)] transition-colors font-[family-name:var(--font-display)]"
                      >
                        {item.name}
                      </Link>

                      <div className="mt-auto flex items-end justify-between pt-2">
                        {/* Qty controls */}
                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg border border-slate-100">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-slate-100 rounded-l-lg transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5 text-slate-500" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-slate-100 rounded-r-lg transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5 text-slate-500" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          {item.originalPrice && (
                            <span className="text-xs text-slate-400 line-through block">
                              R$ {(item.originalPrice * item.quantity).toFixed(2).replace(".", ",")}
                            </span>
                          )}
                          <span className="text-base font-bold text-slate-900 font-[family-name:var(--font-display)]">
                            R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => {
                        removeItem(item.id);
                        toast.success("Item removido do carrinho");
                      }}
                      className="self-start p-2 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clear cart */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  clearCart();
                  toast.success("Carrinho limpo");
                }}
                className="text-sm text-slate-400 hover:text-red-500 transition-colors"
              >
                Limpar carrinho
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-20 space-y-5">
              <h3 className="font-bold text-slate-900 font-[family-name:var(--font-display)]">
                Resumo do Pedido
              </h3>

              {/* Coupon */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Cupom de desconto"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-200)]"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyCoupon}
                  className="shrink-0 rounded-xl"
                >
                  Aplicar
                </Button>
              </div>

              {/* Totals */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalItems} itens)</span>
                  <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Desconto (cupom)</span>
                    <span>- R$ {discount.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Frete</span>
                  <span className={shipping === 0 ? "text-emerald-600 font-medium" : ""}>
                    {shipping === 0 ? "Grátis" : `R$ ${shipping.toFixed(2).replace(".", ",")}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-slate-400">
                    Frete grátis acima de R$ 199,00
                  </p>
                )}
                <div className="border-t border-slate-100 pt-3 flex justify-between">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
                    R$ {finalTotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <Button
                size="lg"
                className="w-full gap-2 rounded-xl h-12"
                onClick={() => navigate("/checkout")}
              >
                Finalizar Compra
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Link
                to="/shopping"
                className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-medium transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Continuar comprando
              </Link>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                {[
                  { icon: ShieldCheck, label: "Compra Segura" },
                  { icon: Truck, label: "Entrega Rápida" },
                  { icon: RotateCcw, label: "Troca Fácil" },
                ].map((badge) => (
                  <div key={badge.label} className="flex flex-col items-center gap-1 text-center">
                    <badge.icon className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] text-slate-500">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
