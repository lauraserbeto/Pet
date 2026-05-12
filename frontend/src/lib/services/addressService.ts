import { httpClient } from "../httpClient";

export type Address = {
  id: string;
  user_id: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  is_default: boolean;
  created_at: string;
};

export type AddressInput = {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export const addressService = {
  list() {
    return httpClient.get<Address[]>("/addresses");
  },
  create(payload: AddressInput) {
    return httpClient.post<Address>("/addresses", payload);
  },
  update(id: string, payload: Partial<AddressInput>) {
    return httpClient.put<Address>(`/addresses/${id}`, payload);
  },
  setDefault(id: string) {
    return httpClient.patch<Address>(`/addresses/${id}/default`);
  },
  remove(id: string) {
    return httpClient.delete<void>(`/addresses/${id}`);
  },
};
