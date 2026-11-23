// E-31 (AUD-22): falha de rede não vira "não encontrado", e "não encontrado" não
// oferece nova tentativa inútil. Conta não exibe status antigo quando a API falha.
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HotelDetailsPage } from "./HotelDetailsPage";
import { WalkerDetailsPage } from "./WalkerDetailsPage";
import { StorePage } from "./StorePage";
import { ProductDetailPage } from "./ProductDetailPage";
import { Account } from "./dashboard/Account";
import { providerService } from "../lib/services/providerService";
import { productService } from "../lib/services/productService";
import { ApiError, isMissingResourceError } from "../lib/httpClient";

vi.mock("../components/reviews/ReviewsPanel", () => ({ ReviewsPanel: () => null }));
vi.mock("../contexts/FavoritesContext", () => ({
  useFavorites: () => ({ isFavorite: () => false, toggle: vi.fn() }),
}));
vi.mock("../components/cart/CartContext", () => ({ useCart: () => ({ addItem: vi.fn() }) }));
const auth = vi.hoisted(() => ({ user: { role_id: 3, full_name: "Hotel QA", email: "hotel@petplus.test" } }));
vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retryDelay: 0 } } });
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  client.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function mount(path: string, pattern: string, element: React.ReactNode) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={pattern} element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const notFound = () => new ApiError(404, "NOT_FOUND", "Parceiro não encontrado.");
const invalidId = () => new ApiError(422, "VALIDATION_ERROR", "Dados inválidos");
const offline = () => new ApiError(0, "NETWORK", "Falha de conexão com o servidor. Verifique sua internet e tente novamente.");
const provider = (extra: object = {}) =>
  ({
    id: "p1",
    status: "APROVADO",
    created_at: "2026-11-01",
    business_name: "Parceiro QA",
    user: { full_name: "Parceiro QA", role_id: 3 },
    rating_avg: null,
    rating_count: 0,
    services: [],
    products: [],
    ...extra,
  }) as never;

it("isMissingResourceError: só 404 e ID inválido contam como inexistente", () => {
  expect(isMissingResourceError(notFound())).toBe(true);
  expect(isMissingResourceError(invalidId())).toBe(true);
  expect(isMissingResourceError(new ApiError(422, "INVALID_PROVIDER_TRANSITION", "x"))).toBe(false);
  expect(isMissingResourceError(offline())).toBe(false);
  expect(isMissingResourceError(new ApiError(503, "SERVICE_UNAVAILABLE", "x"))).toBe(false);
  expect(isMissingResourceError(new Error("x"))).toBe(false);
});

for (const [name, path, pattern, Page, notFoundTitle, errorTitle] of [
  ["hotel", "/hotels/p1", "/hotels/:id", HotelDetailsPage, "Hotel não encontrado", "Não foi possível carregar o hotel"],
  ["sitter", "/walkers/p1", "/walkers/:id", WalkerDetailsPage, "Profissional não encontrado", "Não foi possível carregar o profissional"],
  ["loja", "/store/p1", "/store/:id", StorePage, "Loja não encontrada", "Não foi possível carregar a loja"],
] as const) {
  it(`${name}: 404 mostra "não encontrado" sem nova tentativa`, async () => {
    vi.spyOn(providerService, "fetchProviderDetails").mockRejectedValue(notFound());
    mount(path, pattern, <Page />);
    expect(await screen.findByRole("heading", { name: notFoundTitle })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Tentar novamente/ })).toBeNull();
  });

  it(`${name}: falha de rede não vira "não encontrado" e a nova tentativa carrega`, async () => {
    const fetch = vi
      .spyOn(providerService, "fetchProviderDetails")
      .mockRejectedValueOnce(offline())
      .mockResolvedValueOnce(provider());
    mount(path, pattern, <Page />);
    expect(await screen.findByRole("heading", { name: errorTitle })).toBeTruthy();
    expect(screen.queryByText(notFoundTitle)).toBeNull();
    expect(screen.getByText(/Falha de conexão com o servidor/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/ }));
    expect((await screen.findAllByText("Parceiro QA")).length).toBeGreaterThan(0);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
}

it("produto inexistente: título correto, sem nova tentativa nem repetição automática", async () => {
  const fetch = vi.spyOn(productService, "fetchProductDetails").mockRejectedValue(notFound());
  mount("/shopping/p1", "/shopping/:id", <ProductDetailPage />);
  expect(await screen.findByRole("heading", { name: "Produto não encontrado" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Tentar novamente/ })).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("produto com falha temporária oferece nova tentativa", async () => {
  vi.spyOn(productService, "fetchProductDetails").mockRejectedValue(new ApiError(503, "SERVICE_UNAVAILABLE", "Serviço indisponível."));
  mount("/shopping/p1", "/shopping/:id", <ProductDetailPage />);
  expect(await screen.findByRole("heading", { name: "Não foi possível carregar o produto" }, { timeout: 3000 })).toBeTruthy();
  expect(screen.getByRole("button", { name: /Tentar novamente/ })).toBeTruthy();
});

it("Conta: falha da API não mostra status antigo da sessão nem 'Pendente'", async () => {
  localStorage.setItem("petplus_user", JSON.stringify({ full_name: "Sessão antiga", role_id: 3, provider_status: "APROVADO" }));
  const fetchMe = vi
    .spyOn(providerService, "fetchMe")
    .mockRejectedValueOnce(offline())
    .mockResolvedValueOnce({ status: "EM_REVISAO", document: "1", user: { role_id: 3, full_name: "Hotel QA", email: "hotel@petplus.test" } });
  render(
    <MemoryRouter>
      <Account />
    </MemoryRouter>
  );
  expect(await screen.findByText("Não foi possível carregar os dados da sua conta.")).toBeTruthy();
  expect(screen.queryByText("Ativo")).toBeNull();
  expect(screen.queryByText("Pendente")).toBeNull();
  expect(screen.queryByText("Sessão antiga")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Em revisão")).toBeTruthy();
  await waitFor(() => expect(fetchMe).toHaveBeenCalledTimes(2));
});
