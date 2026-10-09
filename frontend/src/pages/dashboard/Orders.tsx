import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Package, 
  Clock, 
  DollarSign, 
  Eye, 
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Truck,
  XCircle,
  User,
  Mail,
  Phone,
  Receipt
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HamsterLoader } from "../../components/ui/HamsterLoader";
import {
  orderService,
  formatBRL,
  formatOrderDateTime,
  getOrderStatusBadge,
  type Order,
} from "../../lib/services/orderService";
import { ApiError } from "../../lib/httpClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";

function StatusIcon({ variant }: { variant: string }) {
  switch (variant) {
    case 'completed':
      return <CheckCircle className="w-3.5 h-3.5" />;
    case 'shipped':
      return <Truck className="w-3.5 h-3.5" />;
    case 'preparing':
      return <Package className="w-3.5 h-3.5" />;
    case 'paid':
      return <CheckCircle className="w-3.5 h-3.5" />;
    case 'cancelled':
      return <XCircle className="w-3.5 h-3.5" />;
    case 'pending':
    default:
      return <Clock className="w-3.5 h-3.5" />;
  }
}

export function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['provider-orders'],
    queryFn: () => orderService.listProviderOrders(),
  });

  // KPIs derivados dos dados reais
  const kpis = useMemo(() => {
    const totalOrders = orders.length;

    // Pedidos pendentes de processamento/finalização
    const pendingOrders = orders.filter((o) => {
      const norm = o.status?.toUpperCase() || '';
      return norm !== 'CONCLUIDO' && norm !== 'COMPLETED' && norm !== 'CANCELADO' && norm !== 'CANCELLED';
    }).length;

    // Receita do mês corrente com base nos pedidos faturados / não cancelados
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRevenue = orders
      .filter((o) => {
        const d = new Date(o.created_at);
        const isThisMonth =
          !isNaN(d.getTime()) &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear;
        const norm = o.status?.toUpperCase() || '';
        const isRevenueStatus = norm !== 'CANCELADO' && norm !== 'CANCELLED' && norm !== 'AGUARDANDO_PAGAMENTO';
        return isThisMonth && isRevenueStatus;
      })
      .reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      monthlyRevenue,
    };
  }, [orders]);

  // Busca e filtro por ID ou Cliente
  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return orders;

    return orders.filter((order) => {
      const idMatch = order.id.toLowerCase().includes(term);
      const customerNameMatch = order.customer?.full_name?.toLowerCase().includes(term) ?? false;
      const customerEmailMatch = order.customer?.email?.toLowerCase().includes(term) ?? false;
      return idMatch || customerNameMatch || customerEmailMatch;
    });
  }, [orders, searchTerm]);

  // Tratamento específico de erro de parceiro não cadastrado (403)
  const isForbiddenError =
    error instanceof ApiError && (error.status === 403 || error.code === 'FORBIDDEN');

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Meus Pedidos</h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie e acompanhe os pedidos da sua loja.
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por ID ou Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading || isError}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:border-transparent transition-colors sm:text-sm disabled:opacity-50"
              style={{ '--tw-ring-color': 'var(--color-primary-500, #3b82f6)' } as React.CSSProperties}
            />
          </div>
        </header>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total de Pedidos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
              <ShoppingBag className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 ring-4 ring-blue-50/50">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total de Pedidos</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  {isLoading ? '...' : kpis.totalOrders}
                </h3>
              </div>
            </div>
          </div>

          {/* Pedidos Pendentes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
              <Clock className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-500 ring-4 ring-amber-50/50">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Pedidos Pendentes</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  {isLoading ? '...' : kpis.pendingOrders}
                </h3>
              </div>
            </div>
          </div>

          {/* Receita do Mês */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 rounded-xl ring-4" style={{ backgroundColor: 'var(--color-primary-50, #eff6ff)', color: 'var(--color-primary-500, #3b82f6)', boxShadow: '0 0 0 4px var(--color-primary-50, #eff6ff)' }}>
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Receita do Mês</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  {isLoading ? '...' : formatBRL(kpis.monthlyRevenue)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Loading */}
        {isLoading && (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-200 flex justify-center items-center">
            <HamsterLoader message="Carregando pedidos da loja..." size="sm" />
          </div>
        )}

        {/* Estado de Erro */}
        {!isLoading && isError && (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-rose-100 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {isForbiddenError ? 'Acesso restrito' : 'Falha ao carregar pedidos'}
            </h3>
            <p className="text-slate-500 max-w-md mb-6 text-sm">
              {isForbiddenError
                ? 'Esta área é exclusiva para parceiros comerciais cadastrados e aprovados.'
                : error instanceof Error
                ? error.message
                : 'Não foi possível carregar os pedidos da loja. Verifique sua conexão e tente novamente.'}
            </p>
            {!isForbiddenError && (
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Tentar Novamente
              </button>
            )}
          </div>
        )}

        {/* Orders Table Area */}
        {!isLoading && !isError && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-400" />
                <h2 className="text-base font-semibold text-slate-800">Lista de Pedidos</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} no total
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="font-semibold p-4 pl-6">ID Pedido</th>
                    <th className="font-semibold p-4">Data</th>
                    <th className="font-semibold p-4">Cliente</th>
                    <th className="font-semibold p-4">Itens</th>
                    <th className="font-semibold p-4">Total</th>
                    <th className="font-semibold p-4">Status</th>
                    <th className="font-semibold p-4 pr-6 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const { date, time } = formatOrderDateTime(order.created_at);
                      const statusBadge = getOrderStatusBadge(order.status);
                      const itemsSummary =
                        order.items && order.items.length > 0
                          ? order.items
                              .map((i) => `${i.quantity}x ${i.product?.name || 'Item'}`)
                              .join(', ')
                          : 'Sem itens';
                      const customerName = order.customer?.full_name || order.customer?.email || 'Cliente';
                      
                      return (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-4 pl-6">
                            <span className="text-sm font-bold text-slate-700" title={order.id}>
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-slate-800 font-medium">{date}</div>
                            <div className="text-xs text-slate-400">{time}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-slate-800 font-medium">{customerName}</div>
                            {order.customer?.email && (
                              <div className="text-xs text-slate-400">{order.customer.email}</div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-slate-600 max-w-[220px] truncate" title={itemsSummary}>
                              {itemsSummary}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-bold text-slate-800">
                              {formatBRL(order.total_price)}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
                              <StatusIcon variant={statusBadge.variant} />
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-center">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors group-hover:text-slate-600 cursor-pointer"
                              title="Ver Detalhes"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500">
                        {searchTerm ? (
                          <>Nenhum pedido encontrado com "{searchTerm}".</>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <ShoppingBag className="w-10 h-10 text-slate-300" />
                            <p className="font-medium text-slate-600">Nenhum pedido recebido ainda.</p>
                            <p className="text-xs text-slate-400">Os pedidos feitos no Shopping aparecerão aqui.</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer of Table */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
              <span>Mostrando {filteredOrders.length} de {orders.length} pedidos</span>
              <div className="flex items-center gap-2">
                <button disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-400 cursor-not-allowed">Anterior</button>
                <button disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-400 cursor-not-allowed">Próximo</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal de Detalhes do Pedido Recebido */}
      {selectedOrder && (
        <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Receipt className="w-5 h-5 text-[var(--color-primary-600)]" />
                Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Recebido em {formatOrderDateTime(selectedOrder.created_at).date} às{' '}
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

              {/* Informações do Cliente */}
              {selectedOrder.customer && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Dados do Cliente
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium">{selectedOrder.customer.full_name || 'Nome não informado'}</span>
                  </div>
                  {selectedOrder.customer.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{selectedOrder.customer.email}</span>
                    </div>
                  )}
                  {selectedOrder.customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{selectedOrder.customer.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Itens do Pedido */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Itens do Pedido
                </h4>
                <div className="space-y-2 border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product?.name || 'Produto'}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">
                              {item.product?.name || 'Produto'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {item.quantity}x {formatBRL(item.unit_price)}
                              {item.product?.sku ? ` · SKU: ${item.product.sku}` : ''}
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

              {/* Resumo Financeiro */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700">Valor Total</span>
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

export default Orders;
