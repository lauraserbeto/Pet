import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Orders } from "./Orders";
import { orderService, type Order } from "../../lib/services/orderService";
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'store-qa', role_id: 2 } }) }));
const pageOf = (orders: Order[]) => ({ orders, page: 1, limit: 20, total: orders.length, totalPages: 1,
  summary: { totalOrders: orders.length, pendingOrders: orders.length, monthlyRevenue: 0 } });

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
  fireEvent.click(await screen.findByRole("button", { name: /^Ver detalhes do pedido #/ }));
  return screen.findByRole("dialog");
};

afterEach(() => vi.restoreAllMocks());

it("mostra ao lojista o endereço de entrega gravado no pedido (E-05)", async () => {
  vi.spyOn(orderService, "listProviderOrdersPage").mockResolvedValue(pageOf([
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
  ]));

  renderTela();
  const detalhe = within(await abrirDetalhe());

  expect(detalhe.getByText("Endereço de Entrega")).toBeTruthy();
  expect(detalhe.getByText("Praça da Sé, 100 — Apto 12")).toBeTruthy();
  expect(detalhe.getByText("Sé, São Paulo/SP")).toBeTruthy();
  expect(detalhe.getByText("CEP 01001-000")).toBeTruthy();
});

it("pedido antigo, sem endereço gravado, avisa em vez de quebrar", async () => {
  vi.spyOn(orderService, "listProviderOrdersPage").mockResolvedValue(pageOf([pedido({ shipping_address: null })]));

  renderTela();
  const detalhe = within(await abrirDetalhe());

  expect(detalhe.getByText("Endereço não registrado neste pedido.")).toBeTruthy();
});

it("usa componentes do design system: indicadores, sem cor crua inline e ação com nome acessível (E-23)", async () => {
  vi.spyOn(orderService, "listProviderOrdersPage").mockResolvedValue(pageOf([pedido()]));
  const { container } = renderTela();
  expect(await screen.findByText("Vendas reconhecidas no mês")).toBeTruthy();
  expect(screen.queryByText("Receita do Mês")).toBeNull();
  expect(container.querySelector('[style*="#3b82f6"], [style*="#eff6ff"]')).toBeNull();
  expect(await screen.findByRole("table")).toBeTruthy();
  // Cartões do celular e tabela compartilham o mesmo pedido, cada um com rótulo próprio.
  expect(screen.getByRole("button", { name: "Detalhes do pedido #ABCDEF12" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Ver detalhes do pedido #ABCDEF12" })).toBeTruthy();
});

it("mensagem de busca vazia mostra o termo aplicado, não o que ainda está sendo digitado (E-23)", async () => {
  const list = vi.spyOn(orderService, "listProviderOrdersPage").mockResolvedValue(pageOf([]));
  renderTela();
  const campo = await screen.findByRole("searchbox", { name: "Buscar pedidos por ID ou cliente" });
  await waitFor(() => expect((campo as HTMLInputElement).disabled).toBe(false));
  fireEvent.change(campo, { target: { value: "maria" } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  expect(await screen.findByText('Nenhum pedido encontrado para "maria".')).toBeTruthy();
  expect(list).toHaveBeenLastCalledWith(1, "maria", expect.anything());
  fireEvent.change(campo, { target: { value: "joão" } });
  expect(screen.getByText('Nenhum pedido encontrado para "maria".')).toBeTruthy();
});
