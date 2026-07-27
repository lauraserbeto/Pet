import { httpClient } from "../httpClient";

export type AdminMetrics = {
  generated_at: string;
  range_days: number;
  users: {
    total: number;
    new_in_range: number;
    by_role: Record<string, number>;
  };
  partners: {
    total: number;
    pendentes: number;
    aprovados: number;
    recusados: number;
    by_type: Record<string, number>;
  };
  moderation: {
    partners_pending: number;
    sitter_evaluations_pending: number;
  };
  catalog: {
    products_total: number;
    products_active: number;
    out_of_stock: number;
    by_category: Record<string, number>;
  };
  engagement: {
    pets: number;
    favorites_by_type: Record<string, number>;
    active_carts: number;
  };
  growth: { date: string; count: number }[];
};

export const adminService = {
  /** Métricas da plataforma para a Visão Geral do admin. */
  getMetrics(days = 30) {
    return httpClient.get<AdminMetrics>(`/admin/metrics`, { query: { days } });
  },
};
