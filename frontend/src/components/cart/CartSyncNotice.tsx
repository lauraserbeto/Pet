import { Link } from 'react-router';
import { useCart } from './CartContext';
import { Button } from '../ui/button';
export function CartSyncNotice({ checkout = false }: { checkout?: boolean }) {
  const { isSyncing, syncError, retrySync, acceptServerCart, cartError, refreshCart } = useCart();
  if (isSyncing) return <div role="status" className="max-w-3xl mx-auto p-6">Sincronizando seu carrinho com a conta. Aguarde para continuar.</div>;
  if (!syncError) return cartError ? <div role="alert" className="max-w-3xl mx-auto p-6 space-y-4"><p>{cartError}</p><Button onClick={() => void refreshCart()}>Consultar carrinho novamente</Button></div> : null;
  return <div role="alert" className="max-w-3xl mx-auto p-6 my-6 rounded-xl bg-amber-50 space-y-4">
    <h1 className="text-xl font-semibold">Confira a sincronização do carrinho</h1>
    <p>{syncError}</p><p>Os itens anteriores continuam preservados. A compra ficará bloqueada até você resolver esta etapa.</p>
    <div className="flex flex-wrap gap-3"><Button onClick={() => void retrySync()}>Tentar sincronizar novamente</Button>
    {checkout ? <Button variant="outline" asChild><Link to="/cart">Revisar carrinho</Link></Button> : <Button variant="outline" onClick={() => void acceptServerCart()}>Usar apenas o carrinho da conta</Button>}</div>
  </div>;
}
