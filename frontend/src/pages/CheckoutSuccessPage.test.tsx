import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { CheckoutSuccessPage } from './CheckoutSuccessPage';
import { paymentService } from '../lib/services/paymentService';
import { ApiError } from '../lib/httpClient';
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'tutor' } }) }));
const id = '11111111-1111-4111-8111-111111111111';
let client: QueryClient;
function show(url = `/checkout/success?orders=${id}`) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(<MemoryRouter initialEntries={[url]}><QueryClientProvider client={client}><CheckoutSuccessPage /></QueryClientProvider></MemoryRouter>);
}
const result = (status: string) => ({ order: { id, status, provider_id: 'p', customer_id: 'tutor', total_price: 42.5, created_at: '', updated_at: '', items: [] }, paymentStatus: null });
afterEach(() => { cleanup(); client?.clear(); vi.restoreAllMocks(); });
test('URL sem ID ou inválida não anuncia sucesso nem consulta pedido', async () => {
  const request = vi.spyOn(paymentService, 'status');
  show('/checkout/success?orders=invalido');
  expect(screen.getByText('Pedido não identificado')).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
  expect(screen.queryByText('Pagamento confirmado')).toBeNull();
});
test('Recarregamento por URL consulta API e mostra valor/status reais', async () => {
  const request = vi.spyOn(paymentService, 'status').mockResolvedValue(result('PREPARANDO'));
  show();
  await screen.findByText('Pagamento confirmado');
  expect(screen.getByText('Em Preparação')).toBeTruthy();
  expect(screen.getByText(/42,50/)).toBeTruthy();
  expect(request).toHaveBeenCalledWith(id);
  expect(screen.queryByText(/dias úteis/)).toBeNull();
});
test('Pedido pendente e cancelado não são apresentados como pagos', async () => {
  vi.spyOn(paymentService, 'status').mockResolvedValue(result('CANCELADO'));
  show(); await screen.findByText('Cancelado');
  expect(screen.queryByText('Pagamento confirmado')).toBeNull();
});
test('404/conta alheia gera erro sem comprovar pagamento', async () => {
  vi.spyOn(paymentService, 'status').mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Pedido não encontrado'));
  show(); await screen.findByText('Pedido não encontrado ou indisponível para esta conta.');
  expect(screen.queryByText('Pagamento confirmado')).toBeNull();
});
test('Um pedido pendente entre várias lojas impede confirmação global', async () => {
  const second = '22222222-2222-4222-8222-222222222222';
  vi.spyOn(paymentService, 'status').mockImplementation(async key => ({ ...result(key === id ? 'PAGO' : 'AGUARDANDO_PAGAMENTO'), order: { ...result('PAGO').order, id: key, status: key === id ? 'PAGO' : 'AGUARDANDO_PAGAMENTO' } }));
  show(`/checkout/success?orders=${id},${second}`);
  await screen.findByText('Aguardando Pagamento');
  expect(screen.queryByText('Pagamento confirmado')).toBeNull();
  expect(screen.getByRole('link', { name: 'Acompanhar pagamento' })).toBeTruthy();
});
