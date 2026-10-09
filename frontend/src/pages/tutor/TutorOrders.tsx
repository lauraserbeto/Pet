import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Store,
  Receipt,
} from "lucide-react";
import { HamsterLoader } from "../../components/ui/HamsterLoader";
import {
  orderService,
  formatBRL,
  formatOrderDate,
  formatOrderDateTime,
  getOrderStatusBadge,
  type Order,
} from "../../lib/services/orderService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";

function StatusIcon({ variant }: { variant: string }) {
  switch (variant) {
    case "completed":
      return <CheckCircle className="w-4 h-4" />;
    case "shipped":
      return <Truck className="w-4 h-4" />;
    case "preparing":
      return <Package className="w-4 h-4" />;
    case "paid":
      return <CheckCircle className="w-4 h-4" />;
    case "cancelled":
      return <XCircle className="w-4 h-4" />;
    case "pending":
    default:
      return <Clock className="w-4 h-4" />;
  }
}

export function TutorOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["tutor-orders"],
    queryFn: () => orderService.listMyOrders(),
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meus Pedidos</h1>
            <p className="text-slate-500 mt-2">
              Histórico e acompanhamento de compras realizadas no Pet+ Shopping.
            </p>
          </div>
          <Link
            to="/shopping"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-semibold text-sm transition-colors shadow-sm self-start sm:self-auto"
          >
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            Ir para o Shopping
          </Link>
        </div>

        {/* Estado 1: Loading */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex justify-center items-center">
            <HamsterLoader message="Carregando seus pedidos..." size="md" />
          </div>
        )}

        {/* Estado 2: Erro com retry */}
        {!isLoading && isError && (
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-10 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Não foi possível carregar seus pedidos
            </h3>
            <p className="text-slate-500 max-w-md mb-6 text-sm">
              {error instanceof Error
                ? error.message
                : "Houve uma instabilidade na conexão com o servidor. Por favor, tente novamente."}
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Estado 3: Lista vazia */}
        {!isLoading && !isError && orders.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-300 p-12 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-slate-500 mb-6 max-w-md">
              Você ainda não realizou nenhuma compra em nosso shopping. Descubra produtos incríveis
              para o seu pet!
            </p>
            <Link
              to="/shopping"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              Explorar Shopping
            </Link>
          </div>
        )}

        {/* Estado 4: Sucesso com pedidos */}
        {!isLoading && !isError && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusBadge = getOrderStatusBadge(order.status);
              const itemsSummary =
                order.items && order.items.length > 0
                  ? order.items
                      .map((i) => `${i.quantity}x ${i.product?.name || "Produto"}`)
                      .join(", ")
                  : "Itens sob processamento";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:border-[var(--color-primary-200)] transition-colors"
                >
                  {/* Header Pedido */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Nº DO PEDIDO
                      </span>
                      <p className="font-bold text-slate-900 text-base" title={order.id}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      {order.provider?.business_name && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.provider.business_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-8">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          DATA
                        </span>
                        <p className="font-medium text-slate-800 text-sm">
                          {formatOrderDate(order.created_at)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          TOTAL
                        </span>
                        <p className="font-bold text-slate-900 text-base">
                          {formatBRL(order.total_price)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Corpo Pedido */}
                  <div className="px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-14 w-14 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                        <Package className="w-7 h-7 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-800 text-sm">Resumo dos itens</h4>
                        <p className="text-sm text-slate-600 line-clamp-2 max-w-lg mt-0.5" title={itemsSummary}>
                          {itemsSummary}
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3 border-t md:border-0 border-slate-100 pt-4 md:pt-0 shrink-0">
                      <div
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-semibold text-xs border ${statusBadge.className}`}
                      >
                        <StatusIcon variant={statusBadge.variant} />
                        {statusBadge.label}
                      </div>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-full sm:w-auto text-[var(--color-primary-600)] bg-[var(--color-primary-50)] hover:bg-[var(--color-primary-100)] px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap cursor-pointer text-center"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Receipt className="w-5 h-5 text-[var(--color-primary-600)]" />
                Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Realizado em {formatOrderDateTime(selectedOrder.created_at).date} às{" "}
                {formatOrderDateTime(selectedOrder.created_at).time}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Status do pedido */}
              <div className="bg-slate-50 p-3.5 rounded-xl flex items-center justify-between border border-slate-100">
                <span className="text-xs font-semibold text-slate-600 uppercase">Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    getOrderStatusBadge(selectedOrder.status).className
                  }`}
                >
                  <StatusIcon variant={getOrderStatusBadge(selectedOrder.status).variant} />
                  {getOrderStatusBadge(selectedOrder.status).label}
                </span>
              </div>

              {/* Loja parceira */}
              {selectedOrder.provider?.business_name && (
                <div className="flex items-center gap-2.5 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Store className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Loja Parceira</p>
                    <p className="font-semibold text-slate-800">
                      {selectedOrder.provider.business_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Itens do pedido */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Itens Comprados
                </h4>
                <div className="space-y-2 border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product?.name || "Produto"}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">
                              {item.product?.name || "Produto"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {item.quantity}x {formatBRL(item.unit_price)}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">
                          {formatBRL(item.line_total || Number(item.unit_price) * item.quantity)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-sm text-slate-500 text-center">Nenhum detalhe de itens disponível.</p>
                  )}
                </div>
              </div>

              {/* Resumo financeiro */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700">Total Pago</span>
                <span className="text-xl font-extrabold text-slate-900">
                  {formatBRL(selectedOrder.total_price)}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
