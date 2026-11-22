import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cartService, type MergeItemInput } from '../services/cartService';
import { ApiError } from '../httpClient';

const ANON = 'petplus_anon_cart';
function hasPending(key: string) {
  try { const items = JSON.parse(localStorage.getItem(ANON) || '[]'); return !!localStorage.getItem(key) || !Array.isArray(items) || items.length > 0; }
  catch { return true; }
}
type Batch = { id: string; items: MergeItemInput[]; baseline: MergeItemInput[] };
export function useCartSync(userId: string | undefined, token: string | null, tutor: boolean, onClaim: () => void) {
  const client = useQueryClient();
  const key = `petplus-cart-sync:${userId}`;
  const session = `${userId}:${token}`;
  const active = useRef(session); active.current = session;
  const alive = useRef(true);
  const running = useRef(new Set<string>());
  const [state, setState] = useState({ session: '', busy: false, error: '' });
  const enabled = !!userId && !!token && tutor;
  const pending = enabled && hasPending(key);
  const own = state.session === session ? state : { busy: false, error: '' };
  const retrySync = useCallback(async () => {
    if (!enabled || running.current.has(session)) return;
    if (!hasPending(key)) {
      setState(previous => previous.session === session && previous.error ? { session, busy: false, error: '' } : previous);
      return;
    }
    const current = () => alive.current && active.current === session;
    running.current.add(session);
    setState({ session, busy: true, error: '' });
    try {
      let batch: Batch | null = JSON.parse(localStorage.getItem(key) || 'null');
      if (!batch) {
        const pendingItems = JSON.parse(localStorage.getItem(ANON) || '[]');
        if (!Array.isArray(pendingItems)) throw new Error('invalid-local-cart');
        if (!pendingItems.length) { if (current()) setState({ session, busy: false, error: '' }); return; }
        await client.cancelQueries({ queryKey: ['cart', userId] });
        const before = await cartService.get();
        if (!current()) return;
        batch = { id: crypto.randomUUID(), items: pendingItems.map((i: { id: string; quantity: number }) => ({ product_id: i.id, quantity: i.quantity })),
          baseline: before.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })) };
        // Persistir antes do POST permite repetir o mesmo alvo após timeout/reload.
        localStorage.setItem(key, JSON.stringify(batch));
        localStorage.removeItem(ANON);
        onClaim();
      }
      await client.cancelQueries({ queryKey: ['cart', userId] });
      const dto = await cartService.merge(batch.items, batch.baseline);
      if (!current()) return;
      client.setQueryData(['cart', userId], dto);
      localStorage.removeItem(key);
      setState({ session, busy: false, error: '' });
      toast.success('Carrinho sincronizado com sua conta');
    } catch (error) {
      if (current()) setState({ session, busy: false, error: error instanceof ApiError ? error.message : 'Não foi possível sincronizar o carrinho. Os itens anteriores estão preservados.' });
    } finally { running.current.delete(session); }
  }, [client, enabled, key, onClaim, session, userId]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, [session]);
  useEffect(() => { if (pending && !own.busy && !own.error) void retrySync(); }, [pending, own.busy, own.error, retrySync]);
  const acceptServerCart = useCallback(async () => {
    if (running.current.has(session) || !window.confirm('Usar apenas o carrinho atual da conta? Os itens pendentes do carrinho anterior deixarão de ser sincronizados.')) return;
    try {
      localStorage.removeItem(key); localStorage.removeItem(ANON); onClaim();
      setState({ session, busy: false, error: '' });
      await client.invalidateQueries({ queryKey: ['cart', userId] });
    } catch { setState({ session, busy: false, error: 'Não foi possível acessar o armazenamento do carrinho. Os dados da conta não foram apagados.' }); }
  }, [client, key, onClaim, session, userId]);
  return { isSyncing: enabled && (own.busy || (pending && !own.error)), syncError: enabled ? own.error : '',
    syncBlocked: enabled && (pending || own.busy || !!own.error), retrySync, acceptServerCart };
}
