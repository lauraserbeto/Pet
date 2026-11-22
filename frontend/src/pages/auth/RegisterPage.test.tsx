import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { RegisterPage } from "./RegisterPage";
import { httpClient } from "../../lib/httpClient";
import { authService } from "../../lib/services/authService";
let client: QueryClient;
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.spyOn(httpClient, "get").mockResolvedValue({
    version: "2026-02-20",
    published_at: "2026-02-20",
  });
  vi.spyOn(authService, "register").mockResolvedValue({ success: true });
});
afterEach(() => {
  cleanup();
  client?.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function mount() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
function fill() {
  for (const [label, value] of [
    [/^nome completo$/i, "Pessoa QA"],
    [/^e-mail$/i, "qa@petplus.test"],
    [/^senha$/i, "Senha123"],
    [/^confirmar senha$/i, "Senha123"],
  ] as const)
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
test("cadastro envia o aceite marcado e a versão recebida da API", async () => {
  mount();
  await screen.findByText("Versão dos termos: 2026-02-20");
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Criar minha conta" }));
  expect(authService.register).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Criar minha conta" }));
  await waitFor(() =>
    expect(authService.register).toHaveBeenCalledWith(
      expect.objectContaining({ terms_accepted: true, terms_version: "2026-02-20" })
    )
  );
  expect(screen.getByRole("link", { name: "Termos de Uso" }).getAttribute("target")).toBe("_blank");
});
test("falha nos metadados bloqueia cadastro e permite tentar novamente", async () => {
  vi.mocked(httpClient.get).mockRejectedValueOnce(Error("offline"));
  mount();
  await screen.findByText(/Não foi possível carregar a versão dos termos/);
  expect(
    (screen.getByRole("button", { name: "Criar minha conta" }) as HTMLButtonElement).disabled
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Versão dos termos: 2026-02-20");
  expect(
    (screen.getByRole("button", { name: "Criar minha conta" }) as HTMLButtonElement).disabled
  ).toBe(false);
});

test("frontend com textos antigos não aceita versão diferente recebida da API", async () => {
  vi.mocked(httpClient.get).mockResolvedValue({
    version: "2099-01-01",
    published_at: "2099-01-01",
  });
  mount();
  await screen.findByText(/Não foi possível carregar a versão dos termos/);
  expect(
    (screen.getByRole("button", { name: "Criar minha conta" }) as HTMLButtonElement).disabled
  ).toBe(true);
  expect(authService.register).not.toHaveBeenCalled();
});
test("mudança da versão em cache remove o aceite anterior", async () => {
  mount();
  await screen.findByText("Versão dos termos: 2026-02-20");
  fireEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe("true");
  act(() =>
    client.setQueryData(["legal-policy"], { version: "2099-01-01", published_at: "2099-01-01" })
  );
  await waitFor(() =>
    expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe("false")
  );
});
