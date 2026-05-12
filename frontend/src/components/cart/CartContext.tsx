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
  addItem: (item: CartAddInput) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  warnings: CartWarning[];
  isLoading: boolean;
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

function clearAnon() {
  localStorage.removeItem(ANON_KEY);
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

const cartQueryKey = ["cart"] as const;

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Estado anônimo (apenas usado quando sem token)
  const [anonItems, setAnonItems] = useState<AnonItem[]>(() => readAnon());

  // Persiste localStorage em qualquer mudança quando anônimo
  useEffect(() => {
    if (!isAuthenticated) writeAnon(anonItems);
  }, [anonItems, isAuthenticated]);

  // Query do carrinho do servidor — só roda autenticado
  const serverCartQuery = useQuery({
    queryKey: cartQueryKey,
    queryFn: () => cartService.get(),
    enabled: Boolean(token),
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

  /* -------- Merge anônimo → autenticado, uma única vez ao logar -------- */
  const mergedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    if (mergedRef.current === token) return;
    mergedRef.current = token;

    const pending = readAnon();
    if (pending.length === 0) return;

    cartService
      .merge(pending.map((i) => ({ product_id: i.id, quantity: i.quantity })))
      .then((dto) => {
        queryClient.setQueryData(cartQueryKey, dto);
        clearAnon();
        setAnonItems([]);
        toast.success("Carrinho sincronizado com sua conta");
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Erro ao sincronizar carrinho";
        toast.error(message);
      });
  }, [isAuthenticated, token, queryClient]);

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
    async (input: CartAddInput) => {
      if (isAuthenticated) {
        try {
          await addMutation.mutateAsync({ product_id: input.id, quantity: 1 });
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Erro ao adicionar ao carrinho";
          toast.error(message);
        }
        return;
      }
      // Anônimo: agrega local
      setAnonItems((prev) => {
        const existing = prev.find((i) => i.id === input.id);
        if (existing) {
          return prev.map((i) =>
            i.id === input.id ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i
          );
        }
        return [...prev, { ...input, quantity: 1 }];
      });
    },
    [isAuthenticated, addMutation]
  );

  const removeItem = useCallback(
    async (id: string) => {
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
    [isAuthenticated, removeMutation]
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
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
    [isAuthenticated, updateMutation]
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await clearMutation.mutateAsync();
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Erro ao limpar carrinho";
        toast.error(message);
      }
      return;
    }
    setAnonItems([]);
  }, [isAuthenticated, clearMutation]);

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

  const totalPrice = useMemo(
    () => Number(items.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2)),
    [items]
  );

  const warnings = serverCartQuery.data?.warnings ?? [];
  const isLoading = isAuthenticated && serverCartQuery.isLoading;

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
