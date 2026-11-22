import { test, expect, vi, afterEach } from 'vitest';
import { orderService } from './orderService';
afterEach(() => vi.unstubAllGlobals());
test('Página de pedidos solicita metadados sem alterar o contrato legado', async () => {
  const payload = { orders: [], page: 2, limit: 20, total: 21, totalPages: 2 };
  const fetcher = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify(payload), { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  expect(await orderService.listMyOrdersPage(2)).toEqual(payload);
  const url = new URL(String(fetcher.mock.calls[0][0]));
  expect(url.searchParams.get('page')).toBe('2');
  expect(url.searchParams.get('view')).toBe('page');
});
test('Resposta antiga/inválida não se transforma em histórico vazio', async () => {
  for (const payload of [[], { orders: [], total: 10 }, { orders: [], page: 1, total: 0, limit: 20, totalPages: 0 }]) {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 })));
    await expect(orderService.listProviderOrdersPage(1, '')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  }
});
