import { useCartSync } from '../../lib/hooks/useCartSync';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../lib/httpClient";
import {
  cartService,
  type CartDTO,
  type CartItemDTO,
  type CartWarning,
} from "../../lib/services/cartService";

/* ===========================================================
   Tipos públicos — mantém a API antiga em uso por CartPage,
   CheckoutPage, Navbar, LandingPage. O `id` é opaco para o
   chamador: representa o cart_item.id quando autenticado e o
   product_id quando anônimo.
   =========================================================== */

export type CartItem = {
  id: string;
  product_id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
};

export type CartAddInput = {
  id: string; // product_id
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  image: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartAddInput, quantity?: number) => Promise<boolean>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<boolean>;
  totalItems: number;
  totalPrice: number;
  warnings: CartWarning[];
  isLoading: boolean;
  cartError: string;
  isSyncing: boolean;
  syncError: string;
  syncBlocked: boolean;
  retrySync: () => Promise<void>;
  acceptServerCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

/* ===========================================================
   Anonymous cart (localStorage) — usado antes do login
   =========================================================== */

const ANON_KEY = "petplus_anon_cart";

type AnonItem = CartAddInput & { quantity: number };

function readAnon(): AnonItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ANON_KEY);
    return raw ? (JSON.parse(raw) as AnonItem[]) : [];
  } catch {
    return [];
  }
}

function writeAnon(items: AnonItem[]) {
  localStorage.setItem(ANON_KEY, JSON.stringify(items));
}


/* ===========================================================
   Mappers — DTO do servidor → CartItem público
   =========================================================== */

function fromServerItem(item: CartItemDTO): CartItem {
  return {
    id: item.id,
    product_id: item.product_id,
    name: item.product.name,
    brand: item.product.provider?.business_name ?? "",
    price: item.unit_price,
    originalPrice: item.price_changed ? item.current_unit_price : undefined,
    image: item.product.image_url ?? "",
    quantity: item.quantity,
  };
}

function fromAnonItem(item: AnonItem): CartItem {
  return {
    id: item.id, // = product_id no modo anônimo
    product_id: item.id,
    name: item.name,
    brand: item.brand ?? "",
    price: item.price,
    originalPrice: item.originalPrice,
    image: item.image,
    quantity: item.quantity,
  };
}

/* ===========================================================
   Provider
   =========================================================== */



export function CartProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const cartQueryKey = useMemo(() => ["cart", user?.id], [user?.id]);

  // Estado anônimo (apenas usado quando sem token)
  const [anonItems, setAnonItems] = useState<AnonItem[]>(() => readAnon());

  const onClaim = useCallback(() => setAnonItems([]), []);
  const sync = useCartSync(user?.id, token, user?.role_id === 5, onClaim);
  const refreshCart = useCallback(async () => { await queryClient.invalidateQueries({ queryKey: cartQueryKey }); }, [queryClient, cartQueryKey]);

  // Persiste localStorage em qualquer mudança quando anônimo
  useEffect(() => {
    if (!isAuthenticated) writeAnon(anonItems);
  }, [anonItems, isAuthenticated]);

  // Query do carrinho do servidor — só roda autenticado
  const serverCartQuery = useQuery({
    queryKey: cartQueryKey,
    queryFn: ({ signal }) => cartService.get(signal),
    enabled: Boolean(token) && user?.role_id === 5 && !sync.syncBlocked,
    staleTime: 15_000,
  });

  // Exibe warnings vindas do servidor (uma vez por payload)
  const lastWarningStampRef = useRef<string>("");
  useEffect(() => {
    const warnings = serverCartQuery.data?.warnings ?? [];
    if (warnings.length === 0) return;
    const stamp = `${serverCartQuery.data?.updated_at}:${warnings.length}`;
    if (stamp === lastWarningStampRef.current) return;
    lastWarningStampRef.current = stamp;
    warnings.forEach((w) => toast.warning(w.message));
  }, [serverCartQuery.data]);

  /* -------- Mutations do servidor (com optimistic) -------- */

  const addMutation = useMutation({
    mutationFn: ({ product_id, quantity }: { product_id: string; quantity: number }) =>
      cartService.addItem({ product_id, quantity }),
    onSuccess: (dto) => queryClient.setQueryData(cartQueryKey, dto),
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previous = queryClient.getQueryData<CartDTO>(cartQueryKey);
      if (previous) {
        const nextItems =
          quantity === 0
            ? previous.items.filter((i) => i.id !== itemId)
            : previous.items.map((i) => (i.id === itemId ? { ...i, quantity, line_total: Number((i.unit_price * quantity).toFixed(2)) } : i));
        queryClient.setQueryData<CartDTO>(cartQueryKey, {
          ...previous,
          items: nextItems,
          totals: recalc(nextItems),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(cartQueryKey, ctx.previous);
    },
    onSuccess: (dto) => queryClient.setQueryData(cartQueryKey, dto),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previous = queryClient.getQueryData<CartDTO>(cartQueryKey);
      if (previous) {
        const nextItems = previous.items.filter((i) => i.id !== itemId);
        queryClient.setQueryData<CartDTO>(cartQueryKey, {
          ...previous,
          items: nextItems,
          totals: recalc(nextItems),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(cartQueryKey, ctx.previous);
    },
    onSuccess: (dto) => queryClient.setQueryData(cartQueryKey, dto),
  });

  const clearMutation = useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: (dto) => queryClient.setQueryData(cartQueryKey, dto),
  });

  /* -------- API pública -------- */




  const addItem = useCallback(
    async (input: CartAddInput, quantity: number = 1): Promise<boolean> => {
      if (sync.syncBlocked) { toast.warning('Resolva a sincronização do carrinho antes de alterar os itens.'); return false; }
      if (user && user.role_id !== 5) {
        toast.warning("Funcionalidade indisponível. Apenas clientes podem usar o carrinho.");
        return false;
      }

      const qty = Math.max(1, Math.min(99, Math.floor(quantity)));
      if (isAuthenticated) {
        try {
          await addMutation.mutateAsync({ product_id: input.id, quantity: qty });
          return true;
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Erro ao adicionar ao carrinho";
          toast.error(message);
          return false;
        }
      }
      // Anônimo: agrega local
      setAnonItems((prev) => {
        const existing = prev.find((i) => i.id === input.id);
        if (existing) {
          return prev.map((i) =>
            i.id === input.id ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i
          );
        }
        return [...prev, { ...input, quantity: qty }];
      });
      return true;
    },
    [isAuthenticated, addMutation, user, sync.syncBlocked]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (sync.syncBlocked) return;
      if (isAuthenticated) {
        try {
          await removeMutation.mutateAsync(id);
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Erro ao remover item";
          toast.error(message);
        }
        return;
      }
      setAnonItems((prev) => prev.filter((i) => i.id !== id));
    },
    [isAuthenticated, removeMutation, sync.syncBlocked]
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (sync.syncBlocked) return;
      const safeQty = Math.max(0, Math.min(99, quantity));
      if (isAuthenticated) {
        try {
          await updateMutation.mutateAsync({ itemId: id, quantity: safeQty });
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Erro ao atualizar item";
          toast.error(message);
        }
        return;
      }
      setAnonItems((prev) =>
        safeQty === 0
          ? prev.filter((i) => i.id !== id)
          : prev.map((i) => (i.id === id ? { ...i, quantity: safeQty } : i))
      );
    },
    [isAuthenticated, updateMutation, sync.syncBlocked]
  );

  // Devolve se limpou de fato: quem chama só confirma sucesso após a API (E-20).
  const clearCart = useCallback(async (): Promise<boolean> => {
    if (sync.syncBlocked) return false;
    if (isAuthenticated) {
      try {
        await clearMutation.mutateAsync();
        return true;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Erro ao limpar carrinho";
        toast.error(message);
        return false;
      }
    }
    setAnonItems([]);
    return true;
  }, [isAuthenticated, clearMutation, sync.syncBlocked]);

  /* -------- Derivações expostas -------- */

  const items: CartItem[] = useMemo(() => {
    if (isAuthenticated) {
      return (serverCartQuery.data?.items ?? []).map(fromServerItem);
    }
    return anonItems.map(fromAnonItem);
  }, [isAuthenticated, serverCartQuery.data, anonItems]);

  const totalItems = useMemo(
    () => items.reduce((acc, i) => acc + i.quantity, 0),
    [items]
  );

  // Logado, o total é o do carrinho no servidor — a mesma conta que o pedido
  // cobra (E-06). Sem login, a soma local do carrinho anônimo.
  const serverTotal = isAuthenticated ? serverCartQuery.data?.totals?.total : undefined;
  const totalPrice = useMemo(
    () =>
      typeof serverTotal === "number"
        ? serverTotal
        : Number(items.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2)),
    [serverTotal, items]
  );

  const warnings = useMemo(() => serverCartQuery.data?.warnings ?? [], [serverCartQuery.data]);
  const cartError = serverCartQuery.isError ? 'Não foi possível consultar o carrinho da conta. Tente novamente.' : '';
  const isLoading = isAuthenticated && (serverCartQuery.isLoading || sync.isSyncing);

  const value = useMemo<CartContextType>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      warnings,
      isLoading,
      cartError,
      ...sync,
      refreshCart,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      warnings,
      isLoading,
      cartError,
      sync,
      refreshCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/* -------- helpers -------- */

function recalc(items: CartItemDTO[]) {
  const subtotal = Number(
    items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0).toFixed(2)
  );
  return {
    subtotal,
    discount: 0,
    total: subtotal,
    total_items: items.reduce((acc, i) => acc + i.quantity, 0),
  };
}
