import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatBRL,
  formatOrderDate,
  formatOrderDateTime,
  getOrderStatusLabel,
  getOrderStatusBadge,
  orderService,
} from "./orderService";
import { httpClient } from "../httpClient";

vi.mock("../httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("orderService helpers", () => {
  it("formata valores monetários em BRL corretamente", () => {
    expect(formatBRL(100)).toMatch(/R\$\s?100,00/);
    expect(formatBRL("380.50")).toMatch(/R\$\s?380,50/);
    expect(formatBRL(0)).toMatch(/R\$\s?0,00/);
    expect(formatBRL(null)).toMatch(/R\$\s?0,00/);
    expect(formatBRL(undefined)).toMatch(/R\$\s?0,00/);
  });

  it("formata data ISO corretamente em pt-BR", () => {
    const formatted = formatOrderDate("2026-03-08T14:30:00.000Z");
    expect(formatted).toMatch(/08\/03\/2026/);
    expect(formatOrderDate("")).toBe("-");
    expect(formatOrderDate("invalid-date")).toBe("-");
  });

  it("formata data e hora para exibição em tabelas", () => {
    const res = formatOrderDateTime("2026-03-08T14:30:00.000Z");
    expect(res.date).toMatch(/08\/03\/2026/);
    expect(typeof res.time).toBe("string");
    expect(res.time.length).toBeGreaterThan(0);
  });

  it("mapeia status canônicos do Order para rótulos legíveis", () => {
    expect(getOrderStatusLabel("AGUARDANDO_PAGAMENTO")).toBe("Aguardando Pagamento");
    expect(getOrderStatusLabel("PAGO")).toBe("Pago");
    expect(getOrderStatusLabel("PREPARANDO")).toBe("Em Preparação");
    expect(getOrderStatusLabel("ENVIADO")).toBe("Enviado");
    expect(getOrderStatusLabel("CONCLUIDO")).toBe("Concluído");
    expect(getOrderStatusLabel("CANCELADO")).toBe("Cancelado");
  });

  it("fornece badges e variantes semânticas apropriadas", () => {
    const awaiting = getOrderStatusBadge("AGUARDANDO_PAGAMENTO");
    expect(awaiting.variant).toBe("pending");
    expect(awaiting.className).toContain("amber");

    const paid = getOrderStatusBadge("PAGO");
    expect(paid.variant).toBe("paid");
    expect(paid.className).toContain("blue");

    const preparing = getOrderStatusBadge("PREPARANDO");
    expect(preparing.variant).toBe("preparing");
    expect(preparing.className).toContain("purple");

    const shipped = getOrderStatusBadge("ENVIADO");
    expect(shipped.variant).toBe("shipped");
    expect(shipped.className).toContain("indigo");

    const completed = getOrderStatusBadge("CONCLUIDO");
    expect(completed.variant).toBe("completed");
    expect(completed.className).toContain("green");

    const cancelled = getOrderStatusBadge("CANCELADO");
    expect(cancelled.variant).toBe("cancelled");
    expect(cancelled.className).toContain("rose");
  });
});

describe("orderService API methods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listMyOrders chama GET /orders e desempacota lista", async () => {
    const mockList = [
      { id: "ped-1", total_price: 150, status: "PAGO", items: [] },
    ];
    vi.mocked(httpClient.get).mockResolvedValueOnce(mockList);

    const result = await orderService.listMyOrders({ page: 1, limit: 10 });
    expect(httpClient.get).toHaveBeenCalledWith("/orders", { query: { page: 1, limit: 10 } });
    expect(result).toEqual(mockList);
  });

  it("listProviderOrders chama GET /providers/orders e desempacota lista", async () => {
    const mockList = [
      { id: "ped-2", total_price: 320, status: "PREPARANDO", items: [] },
    ];
    vi.mocked(httpClient.get).mockResolvedValueOnce({ orders: mockList });

    const result = await orderService.listProviderOrders();
    expect(httpClient.get).toHaveBeenCalledWith("/providers/orders", { query: undefined });
    expect(result).toEqual(mockList);
  });
});
