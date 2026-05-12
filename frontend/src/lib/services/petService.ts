import { httpClient } from "../httpClient";

export type PetSpecies = "DOG" | "CAT" | "OTHER";

export type Pet = {
  id: string;
  tutor_id: string;
  name: string;
  species: PetSpecies;
  breed?: string | null;
  weight_kg?: number | null;
  birth_date?: string | null;
  medical_notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type PetInput = {
  name: string;
  species: PetSpecies;
  breed?: string;
  weight_kg?: number | null;
  birth_date?: string | null;
  medical_notes?: string;
};

const BASE = "/users/me/pets";

export const petService = {
  list() {
    return httpClient.get<Pet[]>(BASE);
  },
  get(id: string) {
    return httpClient.get<Pet>(`${BASE}/${id}`);
  },
  create(payload: PetInput) {
    return httpClient.post<Pet>(BASE, payload);
  },
  update(id: string, payload: Partial<PetInput>) {
    return httpClient.put<Pet>(`${BASE}/${id}`, payload);
  },
  remove(id: string) {
    return httpClient.delete<void>(`${BASE}/${id}`);
  },
};

export const SPECIES_LABEL: Record<PetSpecies, string> = {
  DOG: "Cachorro",
  CAT: "Gato",
  OTHER: "Outro",
};
