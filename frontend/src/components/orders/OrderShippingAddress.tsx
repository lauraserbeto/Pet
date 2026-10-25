import { MapPin } from "lucide-react";
import {
  formatShippingAddress,
  type OrderShippingAddress as ShippingAddress,
} from "../../lib/services/orderService";

/**
 * Endereço de entrega gravado no pedido (E-05). Usado no detalhe do pedido do
 * lojista e do tutor; pedidos anteriores ao E-05 não têm endereço.
 */
export function OrderShippingAddress({ address }: { address?: ShippingAddress | null }) {
  const lines = formatShippingAddress(address);

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        Endereço de Entrega
      </h4>
      {lines ? (
        <div className="flex items-start gap-2 text-sm text-slate-700">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {lines.map((line, index) => (
              <p key={index} className={index === 0 ? "font-medium" : "text-slate-600"}>
                {line}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Endereço não registrado neste pedido.</p>
      )}
    </div>
  );
}
