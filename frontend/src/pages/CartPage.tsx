import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { useCart } from "../components/cart/CartContext";
import { CartSyncNotice } from '../components/cart/CartSyncNotice';
import { useAuth } from "../contexts/AuthContext";
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
  PackageOpen,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { rememberPostLoginRedirect } from "../lib/postLoginRedirect";
import { useState } from "react";

export function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart, syncBlocked, isLoading, cartError } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [itemToRemove, setItemToRemove] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  const handleCheckout = () => {
    if (syncBlocked || isLoading || cartError) return;
    if (isAuthenticated) {
      navigate("/checkout");
      return;
    }

    setIsAuthPromptOpen(true);
  };

  const continueWithAuthentication = (destination: "/login" | "/register") => {
    const redirect = { returnTo: "/cart", intent: "checkout" as const };
    rememberPostLoginRedirect(redirect);
    setIsAuthPromptOpen(false);
    navigate(destination, { state: redirect });
  };

  if (syncBlocked || cartError) return <CartSyncNotice />;
  if (isLoading) return <div role="status" className="p-8 text-center">Carregando carrinho...</div>;
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
            <button
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" aria-hidden="true" />
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
                    <Link to={`/shopping/${item.product_id}`} className="shrink-0">
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
                      <p className="text-[11px] text-slate-600 uppercase tracking-wider">
                        {item.brand}
                      </p>
                      <Link
                        to={`/shopping/${item.product_id}`}
                        className="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-[var(--color-primary-700)] transition-colors font-[family-name:var(--font-display)]"
                      >
                        {item.name}
                      </Link>

                      <div className="mt-auto flex items-end justify-between pt-2">
                        {/* Qty controls */}
                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg border border-slate-100">
                          <button
                            onClick={() => {
                              if (item.quantity === 1) {
                                setItemToRemove(item);
                              } else {
                                updateQuantity(item.id, item.quantity - 1);
                              }
                            }}
                            aria-label={`Diminuir quantidade de ${item.name}`}
                            className="p-1.5 hover:bg-slate-100 rounded-l-lg transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-800" aria-live="polite" aria-label={`Quantidade: ${item.quantity}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label={`Aumentar quantidade de ${item.name}`}
                            className="p-1.5 hover:bg-slate-100 rounded-r-lg transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
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
                      onClick={() => setItemToRemove(item)}
                      aria-label={`Remover ${item.name} do carrinho`}
                      className="self-start p-2 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600 transition-colors" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clear cart */}
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  if (await clearCart()) toast.success("Carrinho limpo");
                }}
                className="text-sm text-slate-600 hover:text-red-700 transition-colors"
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

              {/* Totals — o mesmo valor que o pedido cobra (DEC-C: sem frete, cupom ou desconto) */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalItems} itens)</span>
                  <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
                    R$ {totalPrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <Button size="lg" className="w-full gap-2 rounded-xl h-12" onClick={handleCheckout}>
                Finalizar Compra
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Link
                to="/shopping"
                className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-primary-700)] hover:text-[var(--color-primary-700)] font-medium transition-colors"
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

      {/* Confirmação de remoção: Dialog acessível (foco preso, Esc, título) — E-34 */}
      <Dialog open={!!itemToRemove} onOpenChange={(open) => !open && !isRemoving && setItemToRemove(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl p-6 text-center sm:max-w-sm sm:p-8">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50">
              <Trash2 className="h-5 w-5 text-orange-700" aria-hidden="true" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)]">
              Remover este item?
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold leading-relaxed text-slate-600">
              Você quer retirar{" "}
              <span className="font-bold text-slate-800">"{itemToRemove?.name}"</span> do seu carrinho?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
              onClick={() => setItemToRemove(null)}
              disabled={isRemoving}
            >
              Cancelar
            </Button>
            <Button
              className="h-11 flex-1 rounded-xl font-bold"
              disabled={isRemoving}
              onClick={async () => {
                if (!itemToRemove) return;
                setIsRemoving(true);
                // Sucesso só depois da confirmação da API (E-20).
                const removed = await removeItem(itemToRemove.id);
                setIsRemoving(false);
                setItemToRemove(null);
                if (removed) toast.success("Item removido do carrinho");
              }}
            >
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuthPromptOpen} onOpenChange={setIsAuthPromptOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
            </div>
            <DialogTitle>Entre para finalizar sua compra</DialogTitle>
            <DialogDescription className="max-w-sm leading-6">
              Seu carrinho será mantido. Depois de entrar, você volta para ele e pode continuar a
              compra com segurança.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 grid gap-3">
            <Button
              size="lg"
              className="w-full gap-2 rounded-xl"
              onClick={() => continueWithAuthentication("/login")}
            >
              <LogIn className="h-4 w-4" />
              Entrar e continuar
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 rounded-xl"
              onClick={() => continueWithAuthentication("/register")}
            >
              <UserPlus className="h-4 w-4" />
              Criar uma conta
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-xl text-slate-500"
              onClick={() => setIsAuthPromptOpen(false)}
            >
              Continuar comprando
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
