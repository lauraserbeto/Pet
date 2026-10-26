import { afterEach, test, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { CartPage } from './CartPage';
import { CartProvider } from '../components/cart/CartContext';
import { cartService, type CartDTO } from '../lib/services/cartService';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'token', isAuthenticated: true, user: { id: 'tutor', role_id: 5 } }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

const item = (id: string, unit_price: number, quantity: number) => ({
  id,
  product_id: `p-${id}`,
  quantity,
  unit_price,
  current_unit_price: unit_price,
  price_changed: false,
  line_total: Number((unit_price * quantity).toFixed(2)),
  added_at: '2026-10-25T10:00:00Z',
  product: { id: `p-${id}`, name: `Produto ${id}`, image_url: null, stock_quantity: 10, status: 'ACTIVE', provider: null },
});

let client: QueryClient;
function show(dto: CartDTO) {
  vi.spyOn(cartService, 'get').mockResolvedValue(dto);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CartProvider>
          <CartPage />
        </CartProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  client?.clear();
  vi.restoreAllMocks();
});

test('o total exibido é o totals.total do carrinho no servidor (DEC-C)', async () => {
  show({
    id: 'cart',
    updated_at: '2026-10-25T10:00:00Z',
    warnings: [],
    items: [item('a', 29.9, 2), item('b', 30.2, 1)],
    totals: { subtotal: 90, discount: 0, total: 90, total_items: 3 },
  } as CartDTO);

  const total = (await screen.findByText('Total')).nextElementSibling;
  expect(total?.textContent?.trim()).toBe('R$ 90,00');
});

test('a tela usa o total do servidor, não uma conta própria', async () => {
  // Total diferente da soma local de propósito: prova a origem do valor exibido.
  show({
    id: 'cart',
    updated_at: '2026-10-25T10:00:00Z',
    warnings: [],
    items: [item('a', 45, 2)],
    totals: { subtotal: 91, discount: 0, total: 91, total_items: 2 },
  } as CartDTO);

  const total = (await screen.findByText('Total')).nextElementSibling;
  expect(total?.textContent?.trim()).toBe('R$ 91,00');
});

test('não tem cupom nem frete no resumo', async () => {
  show({
    id: 'cart',
    updated_at: '2026-10-25T10:00:00Z',
    warnings: [],
    items: [item('a', 45, 2)],
    totals: { subtotal: 90, discount: 0, total: 90, total_items: 2 },
  } as CartDTO);

  await screen.findByText('Resumo do Pedido');
  expect(screen.queryByPlaceholderText('Cupom de desconto')).toBeNull();
  expect(screen.queryByText(/frete/i)).toBeNull();
  expect(screen.queryByText(/PETMAIS15/)).toBeNull();
});
