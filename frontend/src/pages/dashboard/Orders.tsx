import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OrdersPagination } from '../../components/orders/OrdersPagination';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { StatCard } from '../../components/dashboard/StatCard';
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
import { OrderShippingAddress } from "../../components/orders/OrderShippingAddress";
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

function OrderStatusPill({ status, className }: { status: string; className: string }) {
  const badge = getOrderStatusBadge(status);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      <StatusIcon variant={badge.variant} />
      {badge.label}
    </span>
  );
}

function itemsSummary(order: Order) {
  return order.items && order.items.length > 0
    ? order.items.map((i) => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ')
    : 'Sem itens';
}

function customerLabel(order: Order) {
  return order.customer?.full_name || order.customer?.email || 'Cliente';
}

export function Orders() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['provider-orders', user?.id, page, query],
    queryFn: ({ signal }) => orderService.listProviderOrdersPage(page, query, signal),
    enabled: !!user,
  });
  const orders = data?.orders ?? [];
  const filteredOrders = orders;
  const kpis = data?.summary;
  useEffect(() => {
    if (data && page > Math.max(1, data.totalPages)) setPage(Math.max(1, data.totalPages));
  }, [data, page]);
  function search() { setQuery(searchTerm.trim()); setPage(1); }

  // Tratamento específico de erro de parceiro não cadastrado (403)
  const isForbiddenError =
    error instanceof ApiError && (error.status === 403 || error.code === 'FORBIDDEN');

  const summaryHint = kpis
    ? 'Pedidos pagos ou em etapa posterior criados neste mês (horário de São Paulo).'
    : undefined;

  return (
    <div className="space-y-6 pb-8 min-w-0">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
          <p className="mt-1 text-slate-600">Gerencie e acompanhe os pedidos da sua loja.</p>
        </div>

        <form
          role="search"
          className="flex w-full gap-2 md:w-auto"
          onSubmit={(e) => { e.preventDefault(); search(); }}
        >
          <div className="relative flex-1 md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <Input
              type="search"
              placeholder="ID do pedido ou cliente"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); if (!e.target.value) { setQuery(''); setPage(1); } }}
              aria-label="Buscar pedidos por ID ou cliente"
              maxLength={100}
              disabled={isLoading || isError}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={isLoading || isError}>Buscar</Button>
        </form>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        <StatCard title="Total de pedidos" value={isError || !kpis ? '—' : kpis.totalOrders} icon={ShoppingBag} />
        <StatCard
          title="Em andamento"
          value={isError || !kpis ? '—' : kpis.pendingOrders}
          icon={Clock}
          tone="warning"
          hint="Aguardando pagamento, pagos, em preparação ou enviados."
        />
        <StatCard
          title="Vendas reconhecidas no mês"
          value={isError || !kpis ? '—' : formatBRL(kpis.monthlyRevenue)}
          icon={DollarSign}
          tone="action"
          hint={summaryHint}
        />
      </div>

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center p-16">
            <HamsterLoader message="Carregando pedidos da loja..." size="sm" />
          </CardContent>
        </Card>
      )}

      {!isLoading && isError && (
        <Card role="alert" className="border-red-200">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-red-600" aria-hidden="true" />
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              {isForbiddenError ? 'Acesso restrito' : 'Falha ao carregar pedidos'}
            </h2>
            <p className="mb-6 max-w-md text-sm text-slate-600">
              {isForbiddenError
                ? 'Esta área é exclusiva para parceiros comerciais cadastrados e aprovados.'
                : error instanceof Error
                ? error.message
                : 'Não foi possível carregar os pedidos da loja. Verifique sua conexão e tente novamente.'}
            </p>
            {!isForbiddenError && (
              <Button onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
                Tentar novamente
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-slate-100">
            <CardTitle className="text-lg">Lista de pedidos</CardTitle>
            <Badge variant="outline">
              {data?.total ?? 0} {query ? 'encontrados' : 'no total'}
            </Badge>
          </CardHeader>

          {filteredOrders.length === 0 ? (
            <CardContent className="p-12 text-center text-slate-600">
              {query ? (
                <p>Nenhum pedido encontrado para "{query}".</p>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <ShoppingBag className="h-10 w-10 text-slate-400" aria-hidden="true" />
                  <p className="font-medium text-slate-700">Nenhum pedido recebido ainda.</p>
                  <p className="text-sm text-slate-600">Os pedidos feitos no Shopping aparecerão aqui.</p>
                </div>
              )}
            </CardContent>
          ) : (
            <>
              {/* Celular: lista em cartões, sem rolagem horizontal */}
              <ul className="divide-y divide-slate-100 md:hidden" aria-label="Pedidos">
                {filteredOrders.map((order) => {
                  const { date, time } = formatOrderDateTime(order.created_at);
                  const statusBadge = getOrderStatusBadge(order.status);
                  const code = order.id.slice(0, 8).toUpperCase();
                  return (
                    <li key={order.id} className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">#{code}</p>
                          <p className="text-sm text-slate-600">{date} · {time}</p>
                        </div>
                        <OrderStatusPill status={order.status} className={statusBadge.className} />
                      </div>
                      <p className="truncate text-sm text-slate-700">{customerLabel(order)}</p>
                      <p className="truncate text-sm text-slate-600">{itemsSummary(order)}</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-900">{formatBRL(order.total_price)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          aria-label={`Detalhes do pedido #${code}`}
                        >
                          <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
                          Detalhes
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Desktop/tablet: tabela do design system */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-slate-50/80 text-xs uppercase">
                    <TableRow>
                      <TableHead className="pl-6 font-semibold">Pedido</TableHead>
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">Itens</TableHead>
                      <TableHead className="text-right font-semibold">Total</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="pr-6 text-right font-semibold">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const { date, time } = formatOrderDateTime(order.created_at);
                      const statusBadge = getOrderStatusBadge(order.status);
                      const code = order.id.slice(0, 8).toUpperCase();
                      const items = itemsSummary(order);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="pl-6 font-semibold text-slate-900" title={order.id}>#{code}</TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900">{date}</div>
                            <div className="text-xs text-slate-600">{time}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900">{order.customer?.full_name || 'Cliente'}</div>
                            {order.customer?.email && (
                              <div className="text-xs text-slate-600">{order.customer.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[220px] truncate text-slate-700" title={items}>{items}</div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900">{formatBRL(order.total_price)}</TableCell>
                          <TableCell>
                            <OrderStatusPill status={order.status} className={statusBadge.className} />
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedOrder(order)}
                              aria-label={`Ver detalhes do pedido #${code}`}
                              title="Ver detalhes"
                            >
                              <Eye className="h-5 w-5 text-slate-600" aria-hidden="true" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {data && <OrdersPagination page={page} totalPages={data.totalPages} total={data.total} busy={isFetching} onPage={setPage} />}
        </Card>
      )}

      {/* Modal de Detalhes do Pedido Recebido */}
      {selectedOrder && (
        <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Receipt className="w-5 h-5 text-[var(--color-primary-700)]" />
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

              {/* Endereço de entrega (cópia gravada no pedido) */}
              <OrderShippingAddress address={selectedOrder.shipping_address} />

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
                            <p className="text-xs text-slate-600">
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
