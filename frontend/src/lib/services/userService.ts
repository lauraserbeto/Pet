import { API_URL, getHeaders } from "../api";

export const userService = {
  // Retorna os dados do próprio usuário
  async getMe() {
    const response = await fetch(`${API_URL}/users/me`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao buscar dados do usuário.");
    }

    return data;
  },

  // Envia avaliação para ser Sitter
  async submitSitterEvaluation(payload: {
    experience_details: any;
    environment_photos: string[];
    quiz_answers: any;
  }) {
    const response = await fetch(`${API_URL}/users/me/evaluations`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao enviar a avaliação. Tente novamente.");
    }

    return data;
  },

  // --- MÉTODOS DE ADMINISTRADOR ---

  // Busca avaliações filtradas por status
  async getEvaluations(status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING') {
    const response = await fetch(`${API_URL}/users/admin/evaluations?status=${status}`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao buscar avaliações.");
    }

    return data;
  },

  // Busca avaliações pendentes (legado, redireciona para getEvaluations)
  async getPendingEvaluations() {
    return this.getEvaluations('PENDING');
  },

  // Revisa avaliação (Aprova ou Rejeita)
  async reviewEvaluation(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    feedback?: string
  ) {
    const response = await fetch(`${API_URL}/users/admin/evaluations/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status, feedback }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao processar avaliação.");
    }

    return data;
  }
};
