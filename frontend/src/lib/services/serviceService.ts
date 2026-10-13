import { httpClient } from "../httpClient";

/** Categorias aceitas pelo backend (SRV-1, `serviceSchemas.js`). */
export const SERVICE_CATEGORIES = ["BOARDING", "DAYCARE", "SITTING", "WALKING"] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  BOARDING: "Hospedagem",
  DAYCARE: "Creche (day care)",
  SITTING: "Pet sitting",
  WALKING: "Passeio",
};

/**
 * Unidade de cobrança. Vem do backend, derivada do papel do parceiro
 * (hotel = DIARIA, sitter = HORA) — o front não a fabrica.
 */
export type BillingUnit = "DIARIA" | "HORA";

export const BILLING_UNIT_LABELS: Record<BillingUnit, string> = {
  DIARIA: "por diária",
  HORA: "por hora",
};

export type Service = {
  id: string;
  provider_id: string;
  name: string;
  category: ServiceCategory;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  billing_unit: BillingUnit;
  is_active: boolean;
  created_at: string;
};

export type ServiceInput = {
  name: string;
  category: ServiceCategory;
  /** Aceita "R$ 1.234,56" — o backend normaliza vírgula e prefixo. */
  price: string | number;
  description?: string | null;
  duration_minutes?: number | null;
};

export const serviceService = {
  list() {
    return httpClient.get<Service[]>("/providers/services");
  },
  create(payload: ServiceInput) {
    return httpClient.post<Service>("/providers/services", payload);
  },
  update(id: string, payload: Partial<ServiceInput>) {
    return httpClient.put<Service>(`/providers/services/${id}`, payload);
  },
  remove(id: string) {
    return httpClient.delete<void>(`/providers/services/${id}`);
  },
};
