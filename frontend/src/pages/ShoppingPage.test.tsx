import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ShoppingPage } from "./ShoppingPage";
import { productService } from "../lib/services/productService";

const addItem = vi.hoisted(() => vi.fn());
vi.mock("../components/cart/CartContext", () => ({ useCart: () => ({ addItem }) }));
vi.mock("../contexts/FavoritesContext", () => ({
  useFavorites: () => ({ isFavorite: () => false, toggle: vi.fn() }),
}));

beforeEach(() => {
  addItem.mockReset();
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const mount = () =>
  render(
    <MemoryRouter initialEntries={["/shopping"]}>
      <ShoppingPage />
    </MemoryRouter>
  );

it("falha do catálogo mostra erro com nova tentativa, não 'nenhum produto' (revisão E-17)", async () => {
  const fetch = vi
    .spyOn(productService, "fetchAllPublicProducts")
    .mockRejectedValueOnce(Error("offline"))
    .mockResolvedValueOnce([
      { id: "p", name: "Produto QA", price: "10", status: "ACTIVE", stock_quantity: 3 },
    ] as never);
  mount();
  expect(await screen.findByText("Não foi possível carregar o catálogo")).toBeTruthy();
  expect(screen.queryByText("Nenhum produto encontrado")).toBeNull();
  expect(screen.queryByText(/^0 produtos/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Produto QA")).toBeTruthy();
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("produto sem foto usa placeholder e esgotado não pode ser adicionado (revisão E-17)", async () => {
  vi.spyOn(productService, "fetchAllPublicProducts").mockResolvedValue([
    { id: "a", name: "Sem foto QA", price: "10", status: "ACTIVE", stock_quantity: 2, image_url: null },
    { id: "b", name: "Esgotado QA", price: "12", status: "ACTIVE", stock_quantity: 0, image_url: null },
  ] as never);
  mount();
  await screen.findByText("Sem foto QA");
  expect(screen.getAllByLabelText("Produto sem foto cadastrada")).toHaveLength(2);
  expect(document.querySelector('img[src*="unsplash"]')).toBeNull();

  const soldOut = screen.getByRole("button", { name: "Esgotado: Esgotado QA" }) as HTMLButtonElement;
  expect(soldOut.disabled).toBe(true);
  fireEvent.click(soldOut);
  await waitFor(() => expect(addItem).not.toHaveBeenCalled());

  addItem.mockResolvedValue(false);
  fireEvent.click(screen.getByRole("button", { name: "Adicionar ao carrinho: Sem foto QA" }));
  await waitFor(() => expect(addItem).toHaveBeenCalledTimes(1));
});
