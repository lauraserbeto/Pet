import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink, Package, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { HamsterLoader } from '../components/ui/HamsterLoader';
import { formatBRL, orderService } from '../lib/services/orderService';
import { paymentConfirmed, paymentService } from '../lib/services/paymentService';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function CheckoutPaymentPage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const storageKey = `petplus-payment-orders:${user?.id}`;
  const orderIds = useMemo(() => {
    const explicit = params.get('orders');
    const returned = params.get('orderId');
    let stored: string[] = [];
    try {
      const parsed: unknown = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
      if (Array.isArray(parsed)) stored = parsed.filter((id): id is string => typeof id === 'string' && uuid.test(id));
    } catch { /* Sessão inválida: usar apenas o ID recebido na URL. */ }
    const ids = explicit ? explicit.split(',') : returned && stored.includes(returned) ? stored : [returned || ''];
    return Array.from(new Set(ids.filter((id) => uuid.test(id))));
  }, [params, storageKey]);

  const configuration = useQuery({
    queryKey: ['payment-config'], queryFn: paymentService.configuration, staleTime: 30000,
  });
  const payments = useQuery({
    queryKey: ['checkout-payments', user?.id, ...orderIds],
    queryFn: () => Promise.all(orderIds.map((orderId) => paymentService.status(orderId))),
    enabled: orderIds.length > 0,
    refetchInterval: (query) => query.state.data?.some(({ order }) => order.status === 'AGUARDANDO_PAGAMENTO') ? 4000 : false,
    retry: 1,
  });
  const allPaid = !!payments.data?.length && payments.data.every(({ order }) => paymentConfirmed(order.status));

  async function pay(orderId: string) {
    if (busyOrder) return;
    setBusyOrder(orderId);
    setActionError('');
    try {
      // Confere o modo novamente antes de iniciar uma nova cobrança.
      const config = await paymentService.configuration();
      if (config.provider === 'MERCADO_PAGO') {
        const preference = await paymentService.preference(orderId);
        const url = new URL(preference.initPoint);
        if (url.protocol !== 'https:' || url.hostname !== 'www.mercadopago.com.br') {
          throw new Error('Não foi possível abrir o pagamento. Tente novamente.');
        }
        try { sessionStorage.setItem(storageKey, JSON.stringify(orderIds)); }
        catch { /* O pedido individual continua acessível pelo link de retorno. */ }
        window.location.assign(url.toString());
      } else {
        await orderService.payOrder(orderId);
        await payments.refetch();
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível iniciar o pagamento.');
    } finally {
      setBusyOrder(null);
    }
  }

  if (!orderIds.length) {
    return <div className="max-w-3xl mx-auto px-4 py-12 space-y-4"><h1 className="text-2xl font-bold">Pedido não identificado</h1><Button asChild><Link to="/tutor/pedidos">Ver meus pedidos</Link></Button></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <div className="flex items-start gap-3">
        {allPaid ? <CheckCircle2 className="size-7 shrink-0 text-emerald-600" /> : <CreditCard className="size-7 shrink-0 text-sky-600" />}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{allPaid ? 'Pagamento confirmado' : 'Pagamento do pedido'}</h1>
          <p className="text-sm text-slate-600 mt-2">{allPaid ? 'Seus pedidos já estão disponíveis em Meus Pedidos.' : 'Seu pedido foi salvo. Confira o valor e finalize o pagamento.'}</p>
          {configuration.data?.sandbox && !allPaid && <p className="text-sm text-amber-800 mt-2">Ambiente de teste: use apenas a conta e os cartões de teste do Mercado Pago.</p>}
          {orderIds.length > 1 && <p className="text-sm text-slate-600 mt-2">Cada loja possui um pedido e um pagamento separado.</p>}
        </div>
      </div>
      {payments.isPending && <HamsterLoader message="Consultando pagamento..." size="sm" />}
      {(payments.isError || configuration.isError || actionError) && (
        <div role="alert" className="border-l-4 border-rose-500 bg-rose-50 p-4 text-sm text-rose-800 space-y-3">
          <p className="flex gap-2"><AlertCircle className="size-4 shrink-0" />{actionError || 'Não foi possível consultar o pagamento. Seu pedido continua salvo.'}</p>
          <Button variant="outline" onClick={() => { void payments.refetch(); void configuration.refetch(); }}><RefreshCw className="size-4" />Tentar novamente</Button>
        </div>
      )}
      <div className="divide-y divide-slate-200">
        {payments.data?.map(({ order, paymentStatus }) => {
          const paid = paymentConfirmed(order.status);
          const awaiting = order.status === 'AGUARDANDO_PAGAMENTO';
          const returnedAwaitingWebhook = params.get('orderId') === order.id &&
            ['approved', 'pending', 'in_process'].includes(params.get('collection_status') || params.get('status') || '') &&
            (!paymentStatus || paymentStatus === 'CREATED');
          const processing = returnedAwaitingWebhook || ['PENDING', 'IN_PROCESS', 'AUTHORIZED', 'APPROVED', 'REVIEW_REQUIRED'].includes(paymentStatus || '');
          const rejected = ['REJECTED', 'CANCELLED'].includes(paymentStatus || '');
          return (
            <div key={order.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-slate-900 break-words">{order.provider?.business_name || 'Pet+ Shopping'}</p>
                <p className="text-xs text-slate-500 break-all">Pedido {order.id}</p>
                <p className="font-semibold">{formatBRL(order.total_price)}</p>
                <p className={`text-sm ${paid ? 'text-emerald-700' : 'text-slate-600'}`} role="status">{paid ? 'Pago' : !awaiting ? 'Pedido indisponível para pagamento' : paymentStatus === 'REVIEW_REQUIRED' ? 'Pagamento em análise' : processing ? 'Aguardando confirmação do pagamento' : rejected ? 'Pagamento recusado. Você pode tentar novamente.' : 'Aguardando pagamento'}</p>
              </div>
              {awaiting && !processing && <Button disabled={!!busyOrder || !configuration.data || configuration.isError} onClick={() => void pay(order.id)} className="w-full sm:w-auto gap-2 shrink-0">
                {configuration.data?.provider === 'MERCADO_PAGO' ? <ExternalLink className="size-4" /> : <CreditCard className="size-4" />}
                {busyOrder === order.id ? 'Abrindo pagamento...' : configuration.data?.provider === 'MERCADO_PAGO' ? 'Pagar no Mercado Pago' : 'Confirmar pagamento simulado'}
              </Button>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
        <Button variant="outline" asChild><Link to="/tutor/pedidos"><Package className="size-4" />Ver meus pedidos</Link></Button>
        {!allPaid && <Button variant="ghost" onClick={() => void payments.refetch()} disabled={payments.isFetching}><RefreshCw className={`size-4 ${payments.isFetching ? 'animate-spin' : ''}`} />Atualizar pagamento</Button>}
      </div>
    </div>
  );
}
