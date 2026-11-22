import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Products } from "./Products";
import { productService } from "../../lib/services/productService";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const options = { categories: ["ALIMENTO"], petTypes: ["DOG"] };

afterEach(() => vi.restoreAllMocks());

it("falha ao carregar não vira catálogo vazio e permite repetir (G10)", async () => {
  const fetchProducts = vi
    .spyOn(productService, "fetchProducts")
    .mockRejectedValueOnce(new Error("HTTP 500"))
    .mockResolvedValueOnce([]);
  vi.spyOn(productService, "fetchOptions").mockResolvedValue(options);

  render(<Products />);

  expect(await screen.findByText("Não foi possível carregar seus produtos")).toBeTruthy();
  expect(screen.queryByText(/Cadastrar Primeiro Produto/)).toBeNull();
  expect(screen.queryByText("R$ 0,00")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

  await waitFor(() => expect(fetchProducts).toHaveBeenCalledTimes(2));
  expect(await screen.findByText("Você ainda não tem produtos")).toBeTruthy();
});

it("catálogo realmente vazio continua convidando a cadastrar", async () => {
  vi.spyOn(productService, "fetchProducts").mockResolvedValue([]);
  vi.spyOn(productService, "fetchOptions").mockResolvedValue(options);

  render(<Products />);

  expect(await screen.findByText("Você ainda não tem produtos")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Cadastrar Primeiro Produto/ })).toBeTruthy();
});
