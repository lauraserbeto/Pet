import { httpClient } from "../httpClient";
import type { ProfileCompleteness } from "../profileCompleteness";
import type { RatingSummary } from "./reviewService";
import type { ProviderMetrics } from "./commerceMetrics";

export interface ProviderDetails extends RatingSummary {
  id: string;
  business_name: string;
  document?: string;
  status: string;
  payment_policy?: "PRESENCIAL" | "PRE_PAGO";
  description?: string;
  phone?: string;
  created_at: string;
  user: {
    full_name: string;
    email?: string;
    avatar_url?: string;
    role_id: number;
    phone?: string;
  };
  products?: any[];
  services?: any[];
  hourly_rate?: number | string;
  daily_rate?: number | string;
  gallery_images?: string[];
  highlights?: string[];
  amenities?: string[];
  allowed_animals?: string[];
  operating_hours?: any;
  rules_policies?: string;
  sitter_roles?: string[];
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export const providerService = {
  getMetrics(days = 30) {
    return httpClient.get<ProviderMetrics>("/providers/me/metrics", { query: { days } });
  },
  async fetchCompleteness(): Promise<ProfileCompleteness> {
    return httpClient.get("/providers/completeness");
  },

  async fetchProviderDetails(id: string): Promise<ProviderDetails> {
    return httpClient.get<ProviderDetails>(`/providers/${id}`, { auth: false });
  },

  async fetchMe(): Promise<any> {
    return httpClient.get("/providers/me");
  },

  async updateMe(updateData: any): Promise<any> {
    return httpClient.put("/providers/me", updateData);
  },

  /**
   * Reenvia o cadastro corrigido para análise (REC-2).
   *
   * O endpoint só troca o status REJEITADO → EM_REVISAO; não grava dados. As
   * correções precisam ter sido salvas antes, via `updateMe`.
   *
   * Erros: 400 se o parceiro não estiver REJEITADO, 404 se não houver perfil.
   */
  async resubmit(): Promise<unknown> {
    return httpClient.post("/providers/me/resubmit");
  },

  async updatePublicProfile(updateData: any): Promise<any> {
    return httpClient.put("/providers/profile", updateData);
  },

  async fetchHotels(): Promise<any[]> {
    return httpClient.get<any[]>("/providers/hotels", { auth: false });
  },

  async fetchSitters(): Promise<any[]> {
    return httpClient.get<any[]>("/providers/sitters", { auth: false });
  },

  async fetchStores(): Promise<any[]> {
    return httpClient.get<any[]>("/providers/stores", { auth: false });
  },
};
