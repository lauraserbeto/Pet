import { Link } from "react-router";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  ShoppingBag,
  Home,
  Mail,
} from "lucide-react";
import { Button } from "../components/ui/button";

export function CheckoutSuccessPage() {
  const orderNumber = `PET-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mx-auto"
        >
          <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          </div>
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
            Pedido Confirmado!
          </h1>
          <p className="text-slate-500 mt-2">
            Seu pedido foi recebido com sucesso e está sendo preparado.
          </p>
        </div>

        {/* Order details card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-primary-50)]">
              <Package className="h-5 w-5 text-[var(--color-primary-600)]" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Número do pedido</p>
              <p className="font-bold text-slate-900 font-[family-name:var(--font-display)]">
                {orderNumber}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>Confirmação enviada para seu e-mail</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Package className="h-4 w-4 text-slate-400" />
              <span>Prazo estimado: 3 a 5 dias úteis</span>
            </div>
          </div>

          {/* Progress tracker */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Status do Pedido
            </p>
            <div className="flex items-center gap-2">
              {[
                { label: "Confirmado", done: true },
                { label: "Preparando", done: false },
                { label: "Enviado", done: false },
                { label: "Entregue", done: false },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2 flex-1">
                  <div
                    className={`h-3 w-3 rounded-full shrink-0 ${
                      step.done ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                  <span className={`text-[10px] ${step.done ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                  {i < 3 && <div className="flex-1 h-px bg-slate-200" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link to="/shopping" className="block">
            <Button size="lg" className="w-full gap-2 rounded-xl">
              <ShoppingBag className="h-4 w-4" />
              Continuar Comprando
            </Button>
          </Link>
          <Link to="/" className="block">
            <Button variant="outline" size="lg" className="w-full gap-2 rounded-xl">
              <Home className="h-4 w-4" />
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
