import { httpClient } from "../httpClient";

export type FavoriteTargetType = "PRODUCT" | "HOTEL" | "SITTER";

export type FavoriteIdPair = {
  target_type: FavoriteTargetType;
  target_id: string;
};

export type FavoriteHydrated = FavoriteIdPair & {
  id: string;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any;
};

export const favoriteService = {
  listIds() {
    return httpClient.get<FavoriteIdPair[]>("/favorites/ids");
  },
  list(type?: FavoriteTargetType) {
    return httpClient.get<FavoriteHydrated[]>("/favorites", { query: { type } });
  },
  add(payload: FavoriteIdPair) {
    return httpClient.post<FavoriteHydrated>("/favorites", payload);
  },
  remove(payload: FavoriteIdPair) {
    return httpClient.delete<void>(`/favorites/${payload.target_type}/${payload.target_id}`);
  },
};
