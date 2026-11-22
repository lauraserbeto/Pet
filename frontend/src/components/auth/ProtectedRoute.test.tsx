import { it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ProtectedRoute } from "./ProtectedRoute";

const auth = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => auth.value }));
const toastInfo = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { info: toastInfo } }));

const signIn = (user: Record<string, unknown>) => {
  auth.value = { user, isAuthenticated: true, isLoading: false };
};

const renderAt = (path: string, guarded: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>Home pública</p>} />
        <Route path="/tutor/perfil" element={<p>Área do tutor</p>} />
        <Route path="/parceiro/corrigir-cadastro" element={<p>Correção do cadastro</p>} />
        <Route path="/onboarding/sitter" element={<p>Candidatura do sitter</p>} />
        <Route path="/alvo" element={guarded} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  toastInfo.mockReset();
  sessionStorage.clear();
});

it("no painel, perfil fora da lista vê Acesso Negado em vez de ir para a home (G08)", () => {
  signIn({ role_id: 4, provider_status: "APROVADO", onboarding_step: "COMPLETED" });
  renderAt(
    "/alvo",
    <ProtectedRoute allowedRoles={[2]} deniedView="inline">
      <p>Pedidos da loja</p>
    </ProtectedRoute>
  );

  expect(screen.getByRole("alert")).toBeTruthy();
  expect(screen.getByText("Acesso Negado")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Voltar para Visão Geral" }).getAttribute("href")).toBe(
    "/dashboard"
  );
  expect(screen.queryByText("Pedidos da loja")).toBeNull();
});

it("Tutor que abre o painel é levado à própria área", () => {
  signIn({ role_id: 5 });
  renderAt(
    "/alvo",
    <ProtectedRoute allowedRoles={[1, 2, 3, 4]} deniedRedirectTo="/tutor/perfil">
      <p>Painel</p>
    </ProtectedRoute>
  );

  expect(screen.getByText("Área do tutor")).toBeTruthy();
});

it("parceiro recusado vai direto para a correção do cadastro (G06)", () => {
  signIn({ role_id: 3, provider_status: "REJEITADO" });
  renderAt(
    "/alvo",
    <ProtectedRoute>
      <p>Painel</p>
    </ProtectedRoute>
  );

  expect(screen.getByText("Correção do cadastro")).toBeTruthy();
  expect(toastInfo).not.toHaveBeenCalled();
});

it("parceiro pendente volta à home com a explicação do estado (G06)", () => {
  signIn({ role_id: 2, provider_status: "PENDENTE" });
  renderAt(
    "/alvo",
    <ProtectedRoute>
      <p>Painel</p>
    </ProtectedRoute>
  );

  expect(screen.getByText("Home pública")).toBeTruthy();
  expect(toastInfo).toHaveBeenCalledWith(
    "Seu cadastro de parceiro ainda está em análise.",
    expect.objectContaining({ id: "provider-pending-access" })
  );
});

it("perfil permitido continua vendo a tela", () => {
  signIn({ role_id: 1 });
  renderAt(
    "/alvo",
    <ProtectedRoute allowedRoles={[1]} deniedView="inline">
      <p>Configurações</p>
    </ProtectedRoute>
  );

  expect(screen.getByText("Configurações")).toBeTruthy();
});

it.each(["INCOMPLETE", "IN_REVIEW", "REJECTED", "LEGADO_DESCONHECIDO"])(
  "sitter em %s não monta a tela protegida antes do onboarding",
  (onboarding_step) => {
    signIn({ role_id: 4, provider_status: "PENDENTE", onboarding_step });
    const mounted = vi.fn();
    function SensitivePage() {
      useEffect(mounted, []);
      return <p>Serviços privados</p>;
    }
    renderAt(
      "/alvo",
      <ProtectedRoute>
        <SensitivePage />
      </ProtectedRoute>
    );
    expect(screen.getByText("Candidatura do sitter")).toBeTruthy();
    expect(mounted).not.toHaveBeenCalled();
  }
);

it("estado COMPLETED sem parceiro aprovado não libera o painel do sitter", () => {
  signIn({ role_id: 4, provider_status: "PENDENTE", onboarding_step: "COMPLETED" });
  renderAt(
    "/alvo",
    <ProtectedRoute>
      <p>Painel privado</p>
    </ProtectedRoute>
  );
  expect(screen.getByText("Candidatura do sitter")).toBeTruthy();
  expect(screen.queryByText("Painel privado")).toBeNull();
});

it("usuário deslogado preserva query e fragmento do destino", () => {
  auth.value = { user: null, isAuthenticated: false, isLoading: false };
  renderAt(
    "/alvo?pagina=2#lista",
    <ProtectedRoute>
      <p>Privado</p>
    </ProtectedRoute>
  );
  expect(JSON.parse(sessionStorage.getItem("petplus_post_login_redirect")!)).toEqual({
    returnTo: "/alvo?pagina=2#lista",
  });
});
