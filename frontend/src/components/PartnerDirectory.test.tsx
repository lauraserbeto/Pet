import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { PartnerDirectory } from "./PartnerDirectory";
import { providerService } from "../lib/services/providerService";

const toggle = vi.fn();
vi.mock("../contexts/FavoritesContext", () => ({
  useFavorites: () => ({ isFavorite: () => false, toggle }),
}));
const fixtures = [
  {
    id: "a",
    business_name: "Alfa",
    city: "Anápolis",
    starting_price: "60",
    daily_rate: 999,
    hourly_rate: 999,
    rating_avg: 4.2,
    rating_count: 3,
    services: [{ id: "1", name: "Hospedagem", is_active: true }],
  },
  {
    id: "b",
    business_name: "Beta",
    starting_price: 30,
    rating_avg: null,
    rating_count: 0,
    services: [{ id: "2", name: "Passeio", is_active: true }],
  },
  {
    id: "c",
    business_name: "Oculto",
    starting_price: 10,
    services: [{ id: "3", name: "Inativo", is_active: false }],
  },
];
beforeEach(() => {
  vi.spyOn(providerService, "fetchHotels").mockResolvedValue(fixtures);
  vi.spyOn(providerService, "fetchSitters").mockResolvedValue(fixtures);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  toggle.mockReset();
});

describe.each(["HOTEL", "SITTER"] as const)("vitrine %s", (kind) => {
  const open = () =>
    render(
      <MemoryRouter>
        <PartnerDirectory kind={kind} />
      </MemoryRouter>
    );
  it("usa preço da API e omite indicadores fabricados e serviços inativos", async () => {
    open();
    const article = await screen.findByRole("article", { name: "Alfa" });
    expect(within(article).getByText(/A partir de R\$\s*60,00/)).toBeTruthy();
    expect(screen.queryByText(/999/)).toBeNull();
    expect(screen.queryByRole("article", { name: "Oculto" })).toBeNull();
    expect(screen.queryByText(/km|anos|verificado/i)).toBeNull();
    expect(within(article).getByText("4,2")).toBeTruthy();
    expect(screen.getByText("Ainda sem avaliações")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Melhor avaliados" })).toBeTruthy();
  });
  it("busca por local, filtra serviços e ordena por preço", async () => {
    open();
    await screen.findByRole("article", { name: "Alfa" });
    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "price" } });
    expect(screen.getAllByRole("article")[0].getAttribute("aria-label")).toBe("Beta");
    fireEvent.change(screen.getByLabelText("Buscar por nome, local ou serviço"), {
      target: { value: "Anápolis" },
    });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Buscar por nome, local ou serviço"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Serviço"), { target: { value: "Passeio" } });
    expect(screen.getByRole("article", { name: "Beta" })).toBeTruthy();
    expect(screen.queryByRole("article", { name: "Alfa" })).toBeNull();
  });
  it("mantém favoritos e navegação", async () => {
    open();
    const article = await screen.findByRole("article", { name: "Alfa" });
    fireEvent.click(within(article).getByRole("button", { name: "Adicionar aos favoritos" }));
    expect(toggle).toHaveBeenCalledWith(kind, "a");
    expect(within(article).getByRole("link", { name: "Alfa" }).getAttribute("href")).toBe(
      `${kind === "HOTEL" ? "/hotels" : "/walkers"}/a`
    );
  });
  it("distingue erro de vazio e permite tentar novamente", async () => {
    const fetch = kind === "HOTEL" ? providerService.fetchHotels : providerService.fetchSitters;
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([]);
    open();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByText(/Nenhum .* encontrado/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByText(
        kind === "HOTEL" ? "Nenhum hotel encontrado" : "Nenhum profissional encontrado"
      )
    ).toBeTruthy();
  });
  it("não inventa preço ausente", async () => {
    const fetch = kind === "HOTEL" ? providerService.fetchHotels : providerService.fetchSitters;
    vi.mocked(fetch).mockResolvedValueOnce([{ ...fixtures[0], starting_price: null }]);
    open();
    expect(await screen.findByText("Preço não informado")).toBeTruthy();
  });
  it("ordena por avaliação real e deixa alvos sem nota por último", async () => {
    const fetch = kind === "HOTEL" ? providerService.fetchHotels : providerService.fetchSitters;
    vi.mocked(fetch).mockResolvedValueOnce([
      { ...fixtures[0], rating_avg: null, rating_count: 0 },
      { ...fixtures[1], rating_avg: 4.8, rating_count: 2 },
    ]);
    open();
    await screen.findByRole("article", { name: "Alfa" });
    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "rating" } });
    expect(screen.getAllByRole("article")[0].getAttribute("aria-label")).toBe("Beta");
    expect(screen.getByText("4,8")).toBeTruthy();
  });
});
