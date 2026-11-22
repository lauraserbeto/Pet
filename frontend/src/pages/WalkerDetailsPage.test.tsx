import { it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { WalkerDetailsPage } from "./WalkerDetailsPage";
import { providerService } from "../lib/services/providerService";

vi.mock("../components/reviews/ReviewsPanel", () => ({ ReviewsPanel: () => null }));
vi.mock("../contexts/FavoritesContext", () => ({
  useFavorites: () => ({ isFavorite: () => false, toggle: vi.fn() }),
}));

const renderTela = () =>
  render(
    <MemoryRouter initialEntries={["/walkers/sitter-1"]}>
      <Routes>
        <Route path="/walkers/:id" element={<WalkerDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );

afterEach(() => vi.restoreAllMocks());

it("preço inicial usa a unidade do serviço mais barato e o CTA abre o agendamento (G21)", async () => {
  vi.spyOn(providerService, "fetchProviderDetails").mockResolvedValue({
    id: "sitter-1",
    created_at: "2026-11-01T00:00:00Z",
    user: { full_name: "Sitter Teste", role_id: 4 },
    business_name: "Sitter Teste",
    status: "APROVADO",
    city: "São Paulo",
    state: "SP",
    services: [
      { id: "a", name: "Hospedagem", price: "120", is_active: true, billing_unit: "DIARIA", description: null },
      { id: "b", name: "Passeio", price: "50", is_active: true, billing_unit: "HORA", description: null },
    ],
  });

  renderTela();

  expect(await screen.findByText("a partir de · por hora")).toBeTruthy();
  expect(screen.queryByText("a partir de /hora")).toBeNull();
  expect(screen.getByRole("button", { name: /Agendar/ })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Ver serviços/ })).toBeNull();
});
