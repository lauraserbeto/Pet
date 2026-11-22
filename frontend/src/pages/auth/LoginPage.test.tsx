import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { LoginPage } from "./LoginPage";
import { getPostLoginRedirect, rememberPostLoginRedirect } from "../../lib/postLoginRedirect";
import { ApiError } from "../../lib/httpClient";

const mocks = vi.hoisted(() => ({ login: vi.fn(), navigate: vi.fn() }));
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => ({ login: mocks.login }) }));
vi.mock("react-router", async (original) => ({
  ...(await original<typeof import("react-router")>()),
  useNavigate: () => mocks.navigate,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

function submit() {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByLabelText(/^e-mail$/i), { target: { value: "qa@petplus.test" } });
  fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: "SenhaTeste123" } });
  fireEvent.click(screen.getByRole("button", { name: /^Entrar$/ }));
}

it.each([2, 3])(
  "perfil %i recusado vai diretamente à correção, mesmo com destino de compra antigo",
  async (role_id) => {
    rememberPostLoginRedirect({ returnTo: "/checkout", intent: "checkout" });
    mocks.login.mockResolvedValue({ role_id, provider_status: "REJEITADO" });
    submit();
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith("/parceiro/corrigir-cadastro", { replace: true })
    );
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
    expect(getPostLoginRedirect()).toBeNull();
  }
);

it.each([2, 3])("perfil %i recusado retoma o link do e-mail após autenticar", async (role_id) => {
  rememberPostLoginRedirect({ returnTo: "/parceiro/corrigir-cadastro" });
  mocks.login.mockResolvedValue({ role_id, provider_status: "REJEITADO" });
  submit();
  await waitFor(() =>
    expect(mocks.navigate).toHaveBeenCalledWith("/parceiro/corrigir-cadastro", { replace: true })
  );
});

it("preserva a avaliação do sitter recusado como caminho de onboarding", async () => {
  mocks.login.mockResolvedValue({
    role_id: 4,
    provider_status: "REJEITADO",
    onboarding_step: "REJECTED",
  });
  submit();
  await waitFor(() =>
    expect(mocks.navigate).toHaveBeenCalledWith("/onboarding/sitter", { replace: true })
  );
});

it("mantém o retorno do tutor ao checkout", async () => {
  rememberPostLoginRedirect({ returnTo: "/checkout", intent: "checkout" });
  mocks.login.mockResolvedValue({ role_id: 5 });
  submit();
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/checkout", { replace: true }));
});

it("mantém o painel como destino do parceiro aprovado", async () => {
  mocks.login.mockResolvedValue({ role_id: 2, provider_status: "APROVADO" });
  submit();
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/dashboard", { replace: true }));
});

it.each([
  [1, "/dashboard/usuarios?pagina=2#lista"],
  [2, "/dashboard/orders?pagina=2#lista"],
  [3, "/dashboard/schedule?dia=2026-11-22"],
  [4, "/dashboard/servicos"],
])("perfil %i retoma um destino permitido após o login", async (role_id, returnTo) => {
  rememberPostLoginRedirect({ returnTo: returnTo as string });
  mocks.login.mockResolvedValue({
    role_id,
    provider_status: "APROVADO",
    onboarding_step: "COMPLETED",
  });
  submit();
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith(returnTo, { replace: true }));
  expect(getPostLoginRedirect()).toBeNull();
});

it("destino de admin deixado por outra conta não envia o tutor ao painel", async () => {
  rememberPostLoginRedirect({ returnTo: "/dashboard/usuarios" });
  mocks.login.mockResolvedValue({ role_id: 5 });
  submit();
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
  expect(mocks.navigate).not.toHaveBeenCalledWith("/dashboard/usuarios", expect.anything());
});

it("conta desativada mostra o erro real e não é apresentada como conta em análise", async () => {
  mocks.login.mockRejectedValue(
    new ApiError(403, "FORBIDDEN", "Conta desativada. Entre em contato com o suporte.")
  );
  submit();
  expect(await screen.findByText("Conta desativada. Entre em contato com o suporte.")).toBeTruthy();
  expect(mocks.navigate).not.toHaveBeenCalled();
});
