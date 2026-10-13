import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { CheckoutPaymentPage } from './CheckoutPaymentPage';
import { paymentService } from '../lib/services/paymentService';
import { orderService, type Order } from '../lib/services/orderService';

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'tutor' } }) }));
vi.mock('../components/ui/HamsterLoader', () => ({ HamsterLoader: () => <p>Carregando...</p> }));
vi.mock('../lib/services/paymentService', async (importOriginal) => ({
  ...await importOriginal<typeof import('../lib/services/paymentService')>(),
  paymentService: { configuration: vi.fn(), status: vi.fn(), preference: vi.fn() },
}));
vi.mock('../lib/services/orderService', async (importOriginal) => ({
  ...await importOriginal<typeof import('../lib/services/orderService')>(),
  orderService: { payOrder: vi.fn() },
}));

const id = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const order: Order = { id, provider_id: 'store', customer_id: 'tutor', total_price: 90, status: 'AGUARDANDO_PAGAMENTO', created_at: '', updated_at: '', items: [], provider: { id: 'store', business_name: 'Loja Pet+' } };
let client: QueryClient;
function show(url = `/checkout/payment?orders=${id}`) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[url]}><CheckoutPaymentPage /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  vi.mocked(paymentService.configuration).mockResolvedValue({ provider: 'MERCADO_PAGO', sandbox: true });
  vi.mocked(paymentService.status).mockResolvedValue({ order, paymentStatus: 'CREATED' });
});
afterEach(() => { cleanup(); client?.clear(); });

test('retorno aprovado na URL aguarda webhook e não anuncia pedido pago', async () => {
  show(`/checkout/payment?orderId=${id}&status=approved`);
  expect(await screen.findByText('Aguardando confirmação do pagamento')).toBeTruthy();
  expect(screen.queryByText('Pagamento confirmado')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Pagar no Mercado Pago' })).toBeNull();
});
test('estado confirmado pelo backend anuncia pagamento, inclusive pedido em preparação', async () => {
  vi.mocked(paymentService.status).mockResolvedValue({ order: { ...order, status: 'PREPARANDO' }, paymentStatus: 'APPROVED' });
  show();
  expect(await screen.findByText('Pagamento confirmado')).toBeTruthy();
});
test('vários lojistas recebem ações separadas, sem omitir o segundo pedido', async () => {
  vi.mocked(paymentService.status).mockImplementation(async (orderId) => ({ order: { ...order, id: orderId }, paymentStatus: 'CREATED' }));
  show(`/checkout/payment?orders=${id},${other}`);
  expect(await screen.findAllByRole('button', { name: 'Pagar no Mercado Pago' })).toHaveLength(2);
});
test('pagamento recusado permite nova tentativa com link do gateway', async () => {
  vi.mocked(paymentService.status).mockResolvedValue({ order, paymentStatus: 'REJECTED' });
  vi.mocked(paymentService.preference).mockRejectedValue(new Error('Gateway indisponível'));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Pagar no Mercado Pago' }));
  expect(await screen.findByText('Gateway indisponível')).toBeTruthy();
  expect(paymentService.preference).toHaveBeenCalledWith(id);
});
test('modo simulado preserva confirmação e consulta status novamente', async () => {
  vi.mocked(paymentService.configuration).mockResolvedValue({ provider: 'SIMULATED', sandbox: false });
  vi.mocked(orderService.payOrder).mockResolvedValue({});
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar pagamento simulado' }));
  await waitFor(() => expect(orderService.payOrder).toHaveBeenCalledWith(id));
  await waitFor(() => expect(paymentService.status).toHaveBeenCalledTimes(2));
});
test('retorno recupera pedidos de vários lojistas da sessão do mesmo tutor', async () => {
  sessionStorage.setItem('petplus-payment-orders:tutor', JSON.stringify([id, other]));
  vi.mocked(paymentService.status).mockImplementation(async (orderId) => ({ order: { ...order, id: orderId }, paymentStatus: 'CREATED' }));
  show(`/checkout/payment?orderId=${id}`);
  await waitFor(() => expect(paymentService.status).toHaveBeenCalledWith(other));
});
