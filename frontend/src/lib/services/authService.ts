import { API_URL, getHeaders } from "../api";

export const authService = {
  // === FUNÇÃO DE LOGIN ===
  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      // Dispara o erro exato que o Express devolveu (ex: "E-mail ou senha inválidos")
      throw new Error(data.message || "Erro ao realizar login.");
    }

    // Salva o token e o usuário no localStorage
    localStorage.setItem("petplus_token", data.token);
    localStorage.setItem("petplus_user", JSON.stringify(data.user));

    return data;
  },

  // === FUNÇÃO DE REGISTRO ===
  async register(payload: any) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao criar conta.");
    }

    return data;
  },

  // === FUNÇÃO DE LOGOUT ===
  logout() {
    localStorage.removeItem("petplus_token");
    localStorage.removeItem("petplus_user");
    window.location.href = "/login"; // Força o redirecionamento
  }
};