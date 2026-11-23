import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LandingPage } from "./LandingPage";
import { HotelDetailsPage } from "./HotelDetailsPage";
import { ProductDetailPage } from "./ProductDetailPage";
import { providerService } from "../lib/services/providerService";
import { productService } from "../lib/services/productService";

const addItem = vi.hoisted(() => vi.fn());
vi.mock("../components/cart/CartContext", () => ({ useCart: () => ({ addItem }) }));
vi.mock("../contexts/FavoritesContext", () => ({ useFavorites: () => ({ isFavorite: () => false, toggle: vi.fn() }) }));
vi.mock("../components/layout/AnimatedHeroIllustration", () => ({ AnimatedHeroIllustration: () => null }));
vi.mock("../components/layout/HeroSearch", () => ({ HeroSearch: () => null }));
vi.mock("../components/reviews/ReviewsPanel", () => ({ ReviewsPanel: () => null }));
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  addItem.mockReset();
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { client.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function mount(path: string, element: React.ReactNode) {
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path={path.startsWith("/hotels") ? "/hotels/:id" : path.startsWith("/shopping") ? "/shopping/:id" : "/"} element={element} />
  </Routes></MemoryRouter></QueryClientProvider>);
}

it("falha do catálogo não é apresentada como ausência de produtos e permite retry", async () => {
  const fetch = vi.spyOn(productService, "fetchAllPublicProducts").mockRejectedValueOnce(Error("offline")).mockResolvedValueOnce([]);
  mount("/", <LandingPage />);
  expect(await screen.findByText("Não foi possível carregar os produtos em destaque.")).toBeTruthy();
  expect(screen.queryByText("Nenhum produto em destaque disponível no momento.")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Nenhum produto em destaque disponível no momento.")).toBeTruthy();
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("destaque sem foto usa placeholder e avaliação sem nota não ganha estrelas inventadas", async () => {
  vi.spyOn(productService, "fetchAllPublicProducts").mockResolvedValue([{ id: "p", name: "Produto QA", price: "23.40", status: "ACTIVE", stock_quantity: 2, rating_count: 0, rating_avg: null } as never]);
  mount("/", <LandingPage />);
  await screen.findAllByText("Produto QA");
  expect(screen.getByLabelText("Produto sem foto cadastrada")).toBeTruthy();
  expect(screen.getByText("Ainda sem avaliações")).toBeTruthy();
  expect(screen.queryByText("Os produtos mais procurados pelos nossos clientes.")).toBeNull();
});

const hotel = { id: "h", status: "APROVADO", created_at: "2026-11-01", business_name: "Hotel QA", user: { full_name: "QA", role_id: 3 }, rating_avg: null, rating_count: 0, services: [] };
it("hotel usa preço e unidade do serviço ativo mais barato e não inventa restrição de animais", async () => {
  vi.spyOn(providerService, "fetchProviderDetails").mockResolvedValue({ ...hotel, services: [
    { id: "a", name: "Diária QA", price: "100", is_active: true, billing_unit: "DIARIA" },
    { id: "b", name: "Hora QA", price: "25", is_active: true, billing_unit: "HORA" },
    { id: "c", name: "Oculto QA", price: "1", is_active: false, billing_unit: "DIARIA" },
  ] });
  mount("/hotels/h", <HotelDetailsPage />);
  expect(await screen.findByText("a partir de · por hora")).toBeTruthy();
  expect(screen.getByText("Animais aceitos não informados")).toBeTruthy();
  expect(screen.queryByText("Não aceita Cães")).toBeNull();
  expect(screen.queryByText("menor preço por diária")).toBeNull();
  expect(screen.queryByText("Oculto QA")).toBeNull();
});

it("hotel sem serviços não recebe preço padrão", async () => {
  vi.spyOn(providerService, "fetchProviderDetails").mockResolvedValue(hotel);
  mount("/hotels/h", <HotelDetailsPage />);
  await screen.findByText("Hotel QA");
  expect(screen.queryByText("menor preço por diária")).toBeNull();
  expect(screen.queryByText(/150,00/)).toBeNull();
});

it("produto sem estoque não anuncia disponibilidade nem permite adicionar", async () => {
  vi.spyOn(productService, "fetchProductDetails").mockResolvedValue({ id: "p", name: "Sem estoque QA", price: "23", status: "ACTIVE", stock_quantity: 0, rating_count: 0, rating_avg: null } as never);
  mount("/shopping/p", <ProductDetailPage />);
  await screen.findByRole("heading", { name: "Sem estoque QA" });
  expect(screen.getByText("Produto indisponível")).toBeTruthy();
  const button = screen.getByRole("button", { name: "Adicionar ao Carrinho" }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Comprar" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(button);
  await waitFor(() => expect(addItem).not.toHaveBeenCalled());
});

it("barra fixa do hotel separa preço e unidade (revisão E-17)", async () => {
  vi.spyOn(providerService, "fetchProviderDetails").mockResolvedValue({ ...hotel, services: [
    { id: "b", name: "Hora QA", price: "25", is_active: true, billing_unit: "HORA" },
  ] });
  mount("/hotels/h", <HotelDetailsPage />);
  await screen.findByText("a partir de · por hora");
  const bar = Array.from(document.querySelectorAll("p")).find((p) => /25,00/.test(p.textContent || "") && /por hora/.test(p.textContent || ""));
  expect(bar?.textContent).toMatch(/25,00\s+por hora/);
});

it("destaque esgotado na landing não oferece adicionar (revisão E-17)", async () => {
  vi.spyOn(productService, "fetchAllPublicProducts").mockResolvedValue([
    { id: "x", name: "Esgotado QA", price: "10", status: "ACTIVE", stock_quantity: 0, rating_count: 0, rating_avg: null },
  ] as never);
  mount("/", <LandingPage />);
  await screen.findAllByText("Esgotado QA");
  const button = screen.getByRole("button", { name: /Esgotado$/ }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  await waitFor(() => expect(addItem).not.toHaveBeenCalled());
});
