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
import { toast } from "sonner";
import { ApiError } from "../lib/httpClient";
import {
  favoriteService,
  type FavoriteIdPair,
  type FavoriteTargetType,
} from "../lib/services/favoriteService";
import { useAuth } from "./AuthContext";

type Key = `${FavoriteTargetType}:${string}`;

const makeKey = (type: FavoriteTargetType, id: string): Key => `${type}:${id}`;

type FavoritesContextValue = {
  isFavorite: (type: FavoriteTargetType, id: string) => boolean;
  toggle: (type: FavoriteTargetType, id: string) => Promise<void>;
  refresh: () => Promise<void>;
  isReady: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [keys, setKeys] = useState<Set<Key>>(new Set());
  const [isReady, setIsReady] = useState(false);
  const inFlightRef = useRef<Set<Key>>(new Set());

  const refresh = useCallback(async () => {
    if (!token) {
      setKeys(new Set());
      setIsReady(true);
      return;
    }
    try {
      const ids = await favoriteService.listIds();
      const set = new Set<Key>(ids.map((f) => makeKey(f.target_type, f.target_id)));
      setKeys(set);
    } catch {
      // Silencioso — usuário continua usando, só perde marcação visual
    } finally {
      setIsReady(true);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFavorite = useCallback(
    (type: FavoriteTargetType, id: string) => keys.has(makeKey(type, id)),
    [keys]
  );

  const toggle = useCallback(
    async (type: FavoriteTargetType, id: string) => {
      if (!isAuthenticated) {
        toast.info("Faça login para favoritar.");
        return;
      }
      const key = makeKey(type, id);
      if (inFlightRef.current.has(key)) return;
      inFlightRef.current.add(key);

      const wasFavorite = keys.has(key);
      // Otimismo
      setKeys((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(key);
        else next.add(key);
        return next;
      });

      const payload: FavoriteIdPair = { target_type: type, target_id: id };
      try {
        if (wasFavorite) {
          await favoriteService.remove(payload);
        } else {
          await favoriteService.add(payload);
        }
      } catch (err) {
        // Rollback
        setKeys((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(key);
          else next.delete(key);
          return next;
        });
        const message = err instanceof ApiError ? err.message : "Erro ao atualizar favorito.";
        toast.error(message);
      } finally {
        inFlightRef.current.delete(key);
      }
    },
    [isAuthenticated, keys]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ isFavorite, toggle, refresh, isReady }),
    [isFavorite, toggle, refresh, isReady]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de <FavoritesProvider>");
  return ctx;
}
