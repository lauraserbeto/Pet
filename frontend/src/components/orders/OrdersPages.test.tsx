import { test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TutorOrders } from '../../pages/tutor/TutorOrders';
import { Orders } from '../../pages/dashboard/Orders';
import { orderService, type Order } from '../../lib/services/orderService';
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'qa', role_id: 5 }, token: 'qa' }) }));
vi.mock('../reviews/ReviewComposer', () => ({ ReviewComposer: () => null }));
const order = (id: string): Order => ({ id, provider_id: 's', customer_id: 'qa', total_price: 10, status: 'PAGO', created_at: '2026-11-22T10:00:00Z', updated_at: '', items: [] });
const result = (page: number) => ({ page, limit: 20, total: 25, totalPages: 2, orders: [order(page === 1 ? 'primeiro' : 'ultimo')], summary: { totalOrders: 25, pendingOrders: 23, monthlyRevenue: 250 } });
function show(ui: React.ReactNode) { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<MemoryRouter><QueryClientProvider client={client}>{ui}</QueryClientProvider></MemoryRouter>); }
beforeEach(() => vi.restoreAllMocks());
test('Tutor navega por todas as páginas e volta preservando total', async () => {
  const list = vi.spyOn(orderService, 'listMyOrdersPage').mockImplementation(async page => result(page));
  show(<TutorOrders />);
  await screen.findByText('25 pedidos · Página 1 de 2');
  fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
  await screen.findByText('25 pedidos · Página 2 de 2');
  expect(list.mock.calls.at(-1)?.[0]).toBe(2);
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Próxima página' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
  await screen.findByText('25 pedidos · Página 1 de 2');
});
test('Parceiro usa agregado global e pesquisa no servidor voltando à primeira página', async () => {
  const list = vi.spyOn(orderService, 'listProviderOrdersPage').mockImplementation(async (page, q) => q ? { ...result(1), total: 1, totalPages: 1 } : result(page));
  show(<Orders />);
  await screen.findByText('25 pedidos · Página 1 de 2');
  expect(screen.getByText('23')).toBeTruthy();
  expect(screen.getByText(/250,00/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
  await screen.findByText('25 pedidos · Página 2 de 2');
  fireEvent.change(screen.getByRole('textbox', { name: /Buscar pedidos/ }), { target: { value: 'Cliente' } });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar pedidos' }));
  await screen.findByText('1 pedidos · Página 1 de 1');
  expect(list.mock.calls.at(-1)?.slice(0, 2)).toEqual([1, 'Cliente']);
  expect(screen.getByText('23')).toBeTruthy();
});
test('Erro na próxima página não aparece como histórico vazio e permite retry', async () => {
  let fail = true;
  vi.spyOn(orderService, 'listMyOrdersPage').mockImplementation(async page => { if(page === 2 && fail) throw Error('Falha controlada QA'); return result(page); });
  show(<TutorOrders />);
  await screen.findByText('25 pedidos · Página 1 de 2');
  fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
  await screen.findByText('Não foi possível carregar seus pedidos');
  fail = false;
  fireEvent.click(screen.getByRole('button', { name: /Tentar/i }));
  await waitFor(() => expect(screen.getByText('25 pedidos · Página 2 de 2')).toBeTruthy());
});
