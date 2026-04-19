import { API_URL, getHeaders } from "../api";

export const petService = {
  // Lista pets do tutor logado
  async listMyPets() {
    const response = await fetch(`${API_URL}/users/me/pets`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao buscar seus pets.");
    }

    return data;
  },

  // Adiciona um novo pet
  async createPet(payload: any) {
    const response = await fetch(`${API_URL}/users/me/pets`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao cadastrar pet.");
    }

    return data;
  },

  // Remove um pet
  async deletePet(id: string) {
    const response = await fetch(`${API_URL}/users/me/pets/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao remover pet.");
    }

    return true;
  }
};
