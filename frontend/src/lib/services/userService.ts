import { httpClient } from "../httpClient";
import type { AuthUser } from "../../contexts/AuthContext";

export type UpdateProfileDTO = {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
};

export type ChangePasswordDTO = {
  currentPassword: string;
  newPassword: string;
};

export type SitterEvaluationPayload = {
  experience_details: unknown;
  environment_photos: string[];
  quiz_answers: unknown;
};

export type SitterEvaluationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SitterEvaluation = {
  id: string;
  user_id: string;
  status: SitterEvaluationStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  experience_details: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  environment_photos: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quiz_answers: any;
  feedback?: string;
  created_at: string;
  user?: { full_name: string; email: string };
};

export const userService = {
  // Retorna os dados do próprio usuário
  getMe() {
    return httpClient.get<AuthUser>("/users/me");
  },

  // Atualiza nome, telefone e avatar; retorna o usuário atualizado
  updateMe(payload: UpdateProfileDTO) {
    return httpClient.put<AuthUser>("/users/me", payload);
  },

  // Atualiza a senha (requer senha atual)
  changePassword(payload: ChangePasswordDTO) {
    return httpClient.patch<void>("/users/me/password", payload);
  },

  // Envia avaliação para ser Sitter
  submitSitterEvaluation(payload: SitterEvaluationPayload) {
    return httpClient.post("/users/me/evaluations", payload);
  },

  // --- MÉTODOS DE ADMINISTRADOR ---

  getEvaluations(status: SitterEvaluationStatus = "PENDING") {
    return httpClient.get<SitterEvaluation[]>(`/users/admin/evaluations`, { query: { status } });
  },

  getPendingEvaluations() {
    return this.getEvaluations("PENDING");
  },

  reviewEvaluation(
    id: string,
    status: Exclude<SitterEvaluationStatus, "PENDING">,
    feedback?: string
  ) {
    return httpClient.patch<{ message: string }>(`/users/admin/evaluations/${id}`, {
      status,
      feedback,
    });
  },
};
