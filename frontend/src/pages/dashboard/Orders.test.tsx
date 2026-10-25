import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Orders } from "./Orders";
import { orderService, type Order } from "../../lib/services/orderService";

const pedido = (overrides: Partial<Order> = {}): Order => ({
  id: "abcdef12-0000-4000-8000-000000000001",
  provider_id: "p1",
  customer_id: "c1",
  total_price: 89.9,
  status: "PAGO",
  created_at: "2026-10-20T14:00:00Z",
  updated_at: "2026-10-20T14:00:00Z",
  customer: { id: "c1", full_name: "Maria Tutora", email: "maria@petplus.test", phone: null },
  items: [],
  ...overrides,
});

const renderTela = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Orders />
    </QueryClientProvider>
  );
};

const abrirDetalhe = async () => {
  fireEvent.click(await screen.findByTitle("Ver Detalhes"));
  return screen.findByRole("dialog");
};

afterEach(() => vi.restoreAllMocks());

it("mostra ao lojista o endereço de entrega gravado no pedido (E-05)", async () => {
  vi.spyOn(orderService, "listProviderOrders").mockResolvedValue([
    pedido({
      shipping_address: {
        cep: "01001-000",
        rua: "Praça da Sé",
        numero: "100",
        complemento: "Apto 12",
        bairro: "Sé",
        cidade: "São Paulo",
        estado: "SP",
      },
    }),
  ]);

  renderTela();
  const detalhe = within(await abrirDetalhe());

  expect(detalhe.getByText("Endereço de Entrega")).toBeTruthy();
  expect(detalhe.getByText("Praça da Sé, 100 — Apto 12")).toBeTruthy();
  expect(detalhe.getByText("Sé, São Paulo/SP")).toBeTruthy();
  expect(detalhe.getByText("CEP 01001-000")).toBeTruthy();
});

it("pedido antigo, sem endereço gravado, avisa em vez de quebrar", async () => {
  vi.spyOn(orderService, "listProviderOrders").mockResolvedValue([pedido({ shipping_address: null })]);

  renderTela();
  const detalhe = within(await abrirDetalhe());

  expect(detalhe.getByText("Endereço não registrado neste pedido.")).toBeTruthy();
});
