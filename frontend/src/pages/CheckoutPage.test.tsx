import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { CheckoutPage } from "./CheckoutPage";
import { paymentService } from "../lib/services/paymentService";
import { orderService, type Order } from "../lib/services/orderService";
import { toast } from "sonner";
import { ApiError } from "../lib/httpClient";

// Carrinho simulado: 2 × R$ 29,90 + 1 × R$ 30,20 = R$ 90,00.
const items = [
  {
    id: "i1",
    product_id: "p1",
    name: "Ração Pet+",
    brand: "Loja A",
    price: 29.9,
    image: "",
    quantity: 2,
  },
  {
    id: "i2",
    product_id: "p2",
    name: "Petisco",
    brand: "Loja B",
    price: 30.2,
    image: "",
    quantity: 1,
  },
];
const somaDosItens = Number(items.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2));
const cartActions = vi.hoisted(() => ({ clearCart: vi.fn(), refreshCart: vi.fn(), syncBlocked: false }));

vi.mock("../components/cart/CartContext", () => ({
  useCart: () => ({
    items,
    totalItems: 3,
    totalPrice: somaDosItens,
    clearCart: cartActions.clearCart,
    refreshCart: cartActions.refreshCart,
    syncBlocked: cartActions.syncBlocked,
    isSyncing: cartActions.syncBlocked,
    isLoading: false,
  }),
}));
vi.mock("../lib/hooks/useAddresses", () => ({
  useAddresses: () => ({
    addresses: [
      {
        id: "addr-1",
        rua: "Rua A",
        numero: "10",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01001-000",
        is_default: true,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));
vi.mock("../components/ui/HamsterLoader", () => ({ HamsterLoader: () => <p>Carregando...</p> }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("../lib/services/paymentService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/services/paymentService")>()),
  paymentService: { configuration: vi.fn(), status: vi.fn(), preference: vi.fn() },
}));
vi.mock("../lib/services/orderService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/services/orderService")>()),
  orderService: { createOrder: vi.fn(), payOrder: vi.fn() },
}));

const pedido = (id: string, provider_id: string, total_price: number): Order => ({
  id,
  provider_id,
  customer_id: "tutor",
  total_price,
  status: "AGUARDANDO_PAGAMENTO",
  created_at: "",
  updated_at: "",
  items: [],
});

let client: QueryClient;
function show() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/checkout"]}>
        <CheckoutPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

async function irParaPagamento() {
  fireEvent.click(await screen.findByRole("button", { name: "Continuar para Pagamento" }));
}

async function irParaRevisao() {
  await irParaPagamento();
  const revisar = screen.getByRole("button", { name: /Revisar Pedido/ });
  await waitFor(() => expect((revisar as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(revisar);
}

beforeEach(() => {
  cartActions.syncBlocked = false;
  vi.mocked(paymentService.configuration).mockResolvedValue({
    provider: "SIMULATED",
    sandbox: false,
  });
  // Dois lojistas: R$ 59,80 + R$ 30,20 = R$ 90,00.
  vi.mocked(orderService.createOrder).mockResolvedValue({
    order: pedido("o1", "loja-a", 59.8),
    orders: [pedido("o1", "loja-a", 59.8), pedido("o2", "loja-b", 30.2)],
  });
  vi.mocked(orderService.payOrder).mockResolvedValue({});
});

test('criação invalida histórico pré-carregado e atualiza carrinho sem DELETE extra', async () => {
  show();
  client.setQueryDefaults(['tutor-orders', 'tutor', 1], { gcTime: Infinity, staleTime: Infinity });
  client.setQueryData(['tutor-orders', 'tutor', 1], { orders: [] });
  await irParaRevisao();
  fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }));
  await waitFor(() => expect(cartActions.refreshCart).toHaveBeenCalled());
  expect(client.getQueryState(['tutor-orders', 'tutor', 1])?.isInvalidated).toBe(true);
  expect(cartActions.clearCart).not.toHaveBeenCalled();
});
test('checkout não cria pedido enquanto o merge está pendente', async () => {
  cartActions.syncBlocked = true;
  show();
  expect(await screen.findByText(/Sincronizando seu carrinho com a conta/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Confirmar Pedido/ })).toBeNull();
  expect(orderService.createOrder).not.toHaveBeenCalled();
});

test('criação incerta não permite reenvio automático ou novo POST na mesma tela', async () => {
  vi.mocked(orderService.createOrder).mockRejectedValueOnce(new ApiError(0, 'TIMEOUT', 'Timeout QA'));
  show(); await irParaRevisao();
  fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }));
  await screen.findByText('Confira se o pedido foi criado');
  expect(orderService.createOrder).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: /Confirmar Pedido/ })).toBeNull();
  expect(screen.getByRole('link', { name: 'Ver meus pedidos' })).toBeTruthy();
});
afterEach(() => {
  cleanup();
  client?.clear();
  vi.clearAllMocks();
});

test("o botão de confirmar mostra a soma dos itens, igual ao total cobrado nos pedidos (DEC-C)", async () => {
  show();
  await irParaRevisao();

  const confirmar = await screen.findByRole("button", { name: /Confirmar Pedido/ });
  expect(confirmar.textContent).toContain("R$ 90,00");
  expect(somaDosItens).toBe(90);

  fireEvent.click(confirmar);
  await waitFor(() => expect(orderService.payOrder).toHaveBeenCalledTimes(2));
  const { orders } = await vi.mocked(orderService.createOrder).mock.results[0].value;
  const cobrado = orders.reduce((acc: number, o: Order) => acc + Number(o.total_price), 0);
  expect(cobrado.toFixed(2)).toBe(somaDosItens.toFixed(2));
  expect(orderService.createOrder).toHaveBeenCalledWith({ address_id: "addr-1" });
});

test("não exibe frete, desconto no PIX, cupom nem selo de SSL", async () => {
  show();
  await irParaPagamento();
  fireEvent.click(screen.getByRole("button", { name: "PIX" }));

  const texto = document.body.textContent ?? "";
  expect(texto).not.toMatch(/frete/i);
  expect(texto).not.toMatch(/desconto/i);
  expect(texto).not.toMatch(/cupom/i);
  expect(texto).not.toMatch(/SSL/);
});

test("modo simulado: avisa que nada é cobrado e não pede dados de cartão (P5)", async () => {
  show();
  await irParaPagamento();

  expect(await screen.findByText("Pagamento simulado — nenhum valor real é cobrado.")).toBeTruthy();
  expect(screen.queryByPlaceholderText("0000 0000 0000 0000")).toBeNull();
  expect(screen.queryByText("CVV")).toBeNull();
});

test("modo Mercado Pago: sem o aviso de pagamento simulado", async () => {
  vi.mocked(paymentService.configuration).mockResolvedValue({
    provider: "MERCADO_PAGO",
    sandbox: true,
  });
  show();
  await irParaRevisao();

  expect(await screen.findByRole("button", { name: /Confirmar Pedido — R\$ 90,00/ })).toBeTruthy();
  expect(screen.queryByText("Pagamento simulado — nenhum valor real é cobrado.")).toBeNull();
});

test("conflito de estoque da API mostra motivo específico e ação para o carrinho", async () => {
  vi.mocked(orderService.createOrder).mockRejectedValueOnce(
    new ApiError(409, "CONFLICT", "Estoque insuficiente para o produto X")
  );
  show();
  await irParaRevisao();
  fireEvent.click(screen.getByRole("button", { name: /Confirmar Pedido/ }));
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "Estoque insuficiente",
      expect.objectContaining({
        description: "Estoque insuficiente para o produto X",
        action: expect.objectContaining({
          label: "Ir para o Carrinho",
          onClick: expect.any(Function),
        }),
      })
    )
  );
  expect(orderService.payOrder).not.toHaveBeenCalled();
});
