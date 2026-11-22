import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { PartnerMetricsPage } from "./PartnerMetricsPage";
import { AdminOverview } from "../../pages/dashboard/admin/AdminOverview";
import { providerService } from "../../lib/services/providerService";
import { adminService } from "../../lib/services/adminService";
import type { ProviderMetrics } from "../../lib/services/commerceMetrics";

const auth = vi.hoisted(() => ({
  user: { id: "a", role_id: 2, full_name: "Laura" },
  token: "test",
}));
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => auth }));
let client: QueryClient;
const fixture = (): ProviderMetrics => ({
  generated_at: "2026-11-19T18:00:00Z",
  provider: { id: "own", business_name: "Loja da Laura" },
  commerce: {
    range: {
      days: 30,
      since: "2026-10-21T03:00:00Z",
      until: "2026-11-19T18:00:00Z",
      time_zone: "America/Sao_Paulo",
      date_basis: "CREATED_AT",
    },
    orders: { total: 3, by_status: { CONCLUIDO: 2, CANCELADO: 1 } },
    appointments: { total: 2, by_status: { CONFIRMADO: 1, CANCELADO: 1 } },
    revenue: {
      orders_amount: 60.6,
      paid_orders: 2,
      average_order: 30.3,
      gateway_orders_amount: 20.2,
      basis: "PAID_ORDER_STATUS",
      environment: "SIMULATED_OR_SANDBOX",
      daily: [{ date: "2026-11-19", amount: 60.6 }],
    },
    appointment_payments: {
      gross_amount: 50.1,
      refunded_amount: 90.1,
      net_amount: -40,
      paid_count: 1,
      refunded_count: 1,
      mode: "SIMULATED",
    },
    service_mix: [{ id: "s", name: "Hospedagem real", count: 2 }],
    recent_orders: [
      {
        id: "order-real",
        status: "CONCLUIDO",
        total_price: 60.6,
        created_at: "2026-11-19T10:00:00Z",
      },
    ],
    recent_appointments: [
      {
        id: "appt",
        status: "CONFIRMADO",
        total_price: 50.1,
        created_at: "2026-11-19T10:00:00Z",
        start_time: "2026-11-20T10:00:00Z",
        service: { name: "Hospedagem real" },
      },
    ],
  },
});
function display(element = <PartnerMetricsPage />) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{element}</MemoryRouter>
    </QueryClientProvider>
  );
}
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  auth.user = { id: "a", role_id: 2, full_name: "Laura" };
  vi.spyOn(providerService, "getMetrics").mockResolvedValue(fixture());
});
afterEach(() => {
  cleanup();
  client?.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("DSH parceiro exibe os valores da API e atalhos reais, sem saques ou dados fabricados", async () => {
  display();
  await screen.findByText("Loja da Laura");
  expect(screen.getByText("Pedidos no período")).toBeTruthy();
  expect(screen.getAllByText(/R\$\s*60,60/).length).toBeGreaterThan(0);
  expect(screen.getByRole("link", { name: "Ver financeiro" }).getAttribute("href")).toBe(
    "/dashboard/financeiro"
  );
  expect(screen.getByRole("link", { name: "Ver pedidos" }).getAttribute("href")).toBe(
    "/dashboard/orders"
  );
  expect(screen.queryByRole("button", { name: /Saque|Exportar/ })).toBeNull();
  expect(screen.queryByText(/12.450|18.700/)).toBeNull();
});
test("DSH financeiro oferece valores diários acessíveis e preserva a definição do período", async () => {
  display(<PartnerMetricsPage financial />);
  await screen.findByText("Loja da Laura");
  fireEvent.click(screen.getByText("Consultar valores diários"));
  const table = screen.getByRole("table", { name: "Vendas reconhecidas por dia em reais" });
  expect(within(table).getByText("19/11")).toBeTruthy();
  expect(screen.getByText(/A data de criação não é a data do recebimento/)).toBeTruthy();
});
for (const role of [3, 4])
  test(`DSH perfil ${role} mostra pagamentos de reserva separados e saldo negativo honesto`, async () => {
    auth.user.role_id = role;
    display(<PartnerMetricsPage financial />);
    await screen.findByText("Loja da Laura");
    expect(screen.getByText("Pré-pagamentos simulados")).toBeTruthy();
    expect(screen.getByText(/-R\$\s*40,00/)).toBeTruthy();
    expect(screen.queryByText("Vendas reconhecidas")).toBeNull();
    expect(screen.getAllByText("Hospedagem real").length).toBe(2);
    expect(screen.getByRole("link", { name: "Abrir agenda" }).getAttribute("href")).toBe(
      "/dashboard/schedule"
    );
  });
test("DSH trocar janela consulta a API e botão atualizar faz nova leitura", async () => {
  display();
  await screen.findByText("Loja da Laura");
  fireEvent.change(screen.getByLabelText("Período das métricas"), { target: { value: "7" } });
  await waitFor(() => expect(providerService.getMetrics).toHaveBeenLastCalledWith(7));
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "Atualizar métricas" }) as HTMLButtonElement).disabled
    ).toBe(false)
  );
  fireEvent.click(screen.getByRole("button", { name: "Atualizar métricas" }));
  await waitFor(() => expect(providerService.getMetrics).toHaveBeenCalledTimes(3));
});
test("DSH carregamento e falha não mostram zeros fictícios; retry recupera", async () => {
  vi.mocked(providerService.getMetrics).mockRejectedValueOnce(new Error("API indisponível"));
  display();
  expect(screen.getByText("Carregando métricas...")).toBeTruthy();
  await screen.findByText("API indisponível");
  expect(screen.queryByText("Vendas reconhecidas")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Loja da Laura");
});
test("DSH parceiro sem operações apresenta zeros e ausência de registros", async () => {
  const result = fixture();
  result.commerce.orders = { total: 0, by_status: {} };
  result.commerce.revenue = {
    ...result.commerce.revenue,
    orders_amount: 0,
    paid_orders: 0,
    average_order: 0,
    gateway_orders_amount: 0,
    daily: [{ date: "2026-11-19", amount: 0 }],
  };
  result.commerce.recent_orders = [];
  vi.mocked(providerService.getMetrics).mockResolvedValue(result);
  display(<PartnerMetricsPage financial />);
  await screen.findByText("Nenhuma venda reconhecida no período.");
  expect(screen.getAllByText("Nenhum registro no período.").length).toBe(2);
});
test("DSH cache muda por conta e não mantém valores do parceiro anterior", async () => {
  const view = display();
  await screen.findByText("Loja da Laura");
  vi.mocked(providerService.getMetrics).mockResolvedValue({
    ...fixture(),
    provider: { id: "b", business_name: "Outro parceiro" },
  });
  auth.user.id = "b";
  view.rerender(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PartnerMetricsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
  await screen.findByText("Outro parceiro");
  expect(screen.queryByText("Loja da Laura")).toBeNull();
  expect(providerService.getMetrics).toHaveBeenCalledTimes(2);
});
test("DSH tutor não consulta endpoint privado de parceiros", async () => {
  auth.user.role_id = 5;
  display();
  await screen.findByText("Área exclusiva de parceiros.");
  expect(providerService.getMetrics).not.toHaveBeenCalled();
});
test("DSH admin preserva métricas institucionais e exibe comércio da mesma resposta", async () => {
  auth.user.role_id = 1;
  vi.spyOn(adminService, "getMetrics").mockResolvedValue({
    generated_at: fixture().generated_at,
    range_days: 30,
    commerce: fixture().commerce,
    users: { total: 10, new_in_range: 1, by_role: {} },
    partners: { total: 3, aprovados: 3, pendentes: 0, recusados: 0, by_type: {} },
    moderation: { partners_pending: 0, sitter_evaluations_pending: 0 },
    catalog: { products_total: 4, products_active: 4, out_of_stock: 0, by_category: {} },
    engagement: { pets: 2, favorites_by_type: {}, active_carts: 0 },
    growth: [],
  });
  display(<AdminOverview />);
  await screen.findByText("Visão Geral da Plataforma");
  expect(screen.getByText("Usuários cadastrados")).toBeTruthy();
  expect(screen.getByText("Vendas reconhecidas")).toBeTruthy();
  expect(screen.getByText("Pré-pagamentos simulados")).toBeTruthy();
  expect(providerService.getMetrics).not.toHaveBeenCalled();
});
