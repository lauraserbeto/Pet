import { httpClient, ApiError } from "../httpClient";

export interface RatingSummary {
  rating_avg?: number | null;
  rating_count?: number;
}
export type ReviewTarget =
  { product_id: string; provider_id?: never } | { provider_id: string; product_id?: never };
export type ReviewOrigin =
  | { product_id: string; order_id: string; provider_id?: never; appointment_id?: never }
  | { provider_id: string; appointment_id: string; product_id?: never; order_id?: never };
export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author: { id: string; full_name: string; avatar_url?: string | null };
}
export interface ReviewSummary extends RatingSummary {
  rating_avg: number | null;
  rating_count: number;
  distribution: { rating: number; count: number }[];
}
export const reviewService = {
  create: (origin: ReviewOrigin, values: { rating: number; comment?: string }) =>
    httpClient.post<{ review: Review }>("/reviews", { ...origin, ...values }),
  mine: (origin: ReviewOrigin) =>
    httpClient.get<{ review: Review | null }>("/reviews/mine", { query: origin }),
  summary: (target: ReviewTarget) =>
    httpClient.get<ReviewSummary>("/reviews/summary", { auth: false, query: target }),
  list: async (target: ReviewTarget, page: number, limit = 5) => {
    const { data, headers } = await httpClient.getWithHeaders<Review[]>("/reviews", {
      auth: false,
      query: { ...target, page, limit },
    });
    const number = (name: string) => {
      const raw = headers.get(name),
        value = Number(raw);
      if (raw === null || !Number.isSafeInteger(value) || value < 0)
        throw new ApiError(
          502,
          "INVALID_PAGINATION",
          "Não foi possível consultar a paginação das avaliações."
        );
      return value;
    };
    if (!Array.isArray(data))
      throw new ApiError(502, "INVALID_RESPONSE", "Não foi possível carregar as avaliações.");
    return { data, total: number("X-Total-Count"), pages: number("X-Total-Pages") };
  },
};
