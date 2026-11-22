import { Link, useLocation, useSearchParams } from 'react-router';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { HamsterLoader } from '../components/ui/HamsterLoader';
import { paymentService, paymentConfirmed, paymentUrl } from '../lib/services/paymentService';
import { formatBRL, getOrderStatusBadge } from '../lib/services/orderService';
import { checkoutOrderIds } from '../lib/checkoutOrders';
import { ApiError } from '../lib/httpClient';

export function CheckoutSuccessPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const explicit = params.get('orders');
  const ids = checkoutOrderIds(explicit !== null ? explicit.split(',') : location.state?.orderIds ?? (location.state?.orderId ? [location.state.orderId] : []));
  const orders = useQuery({
    queryKey: ['checkout-success', user?.id, ...ids],
    queryFn: async () => {
      const results = await Promise.all(ids.map(id => paymentService.status(id)));
      if (results.some((result, i) => result.order.id !== ids[i])) throw new Error('Resposta de pedido inválida.');
      return results;
    },
    enabled: !!user && ids.length > 0,
    retry: false,
    refetchOnMount: 'always',
    refetchInterval: query => query.state.data?.some(({ order }) => order.status === 'AGUARDANDO_PAGAMENTO') ? 4000 : false,
  });
  // Preserva links antigos enviados por state, tornando o endereço recarregável.
  const joined = ids.join(',');
  useEffect(() => { if (explicit === null && joined) setParams({ orders: joined }, { replace: true }); }, [explicit, joined, setParams]);
  const paid = !!orders.data?.length && orders.data.every(({ order }) => paymentConfirmed(order.status));
  return <main className="max-w-2xl mx-auto px-4 py-12 space-y-6">
    {!ids.length ? <div role="alert"><h1 className="text-2xl font-bold">Pedido não identificado</h1><p>Abra um pedido pelo seu histórico para conferir os dados.</p></div> : <>
      {orders.isPending && <HamsterLoader message="Consultando seus pedidos..." size="sm" />}
      {orders.isError && <div role="alert" className="bg-rose-50 rounded-xl p-4 space-y-3">
        <h1 className="text-xl font-bold">Não foi possível conferir os pedidos</h1>
        <p>{orders.error instanceof ApiError && orders.error.status === 404 ? 'Pedido não encontrado ou indisponível para esta conta.' : 'Confira sua conexão e tente novamente. Nenhuma nova compra será criada.'}</p>
        <Button variant="outline" disabled={orders.isFetching} onClick={() => void orders.refetch()}>Tentar novamente</Button>
      </div>}
      {!orders.isError && orders.data && <>
        <div className="flex gap-3 items-start">
          {paid ? <CheckCircle2 className="size-8 text-emerald-700" /> : <Package className="size-8 text-sky-700" />}
          <div><h1 className="text-2xl font-bold">{paid ? 'Pagamento confirmado' : 'Confira seus pedidos'}</h1><p className="text-slate-600">O status abaixo foi consultado na sua conta.</p></div>
        </div>
        {orders.data.map(({ order }) => {
          const status = getOrderStatusBadge(order.status);
          return <section key={order.id} className="bg-white border rounded-xl p-5 space-y-3">
            <h2 className="font-semibold">{order.provider?.business_name || 'Pet+ Shopping'}</h2>
            <p className="text-sm break-all">Pedido {order.id}</p>
            <p className="font-bold">{formatBRL(order.total_price)}</p>
            <p role="status" className={'inline-block rounded-full px-3 py-1 text-sm ' + status.className}>{status.label}</p>
            {order.status === 'AGUARDANDO_PAGAMENTO' && <Button asChild variant="outline"><Link to={paymentUrl([order.id])}>Acompanhar pagamento</Link></Button>}
          </section>;
        })}
        <Button variant="outline" disabled={orders.isFetching} onClick={() => void orders.refetch()}>Atualizar status</Button>
      </>}
    </>}
    <div className="flex flex-wrap gap-3"><Button asChild><Link to="/tutor/pedidos">Ver meus pedidos</Link></Button><Button asChild variant="outline"><Link to="/shopping">Continuar comprando</Link></Button></div>
  </main>;
}
