import { test, expect } from '@playwright/test';

const orderId = '11111111-1111-4111-8111-111111111111';
const secondId = '22222222-2222-4222-8222-222222222222';
const tutor = { id: 'test-tutor', full_name: 'Tutor de teste', email: 'teste@petplus.test', role_id: 5 };

for (const provider of ['SIMULATED', 'MERCADO_PAGO']) {
  test(`checkout ${provider}: cria uma vez e processa todos os pedidos`, async ({ page }) => {
    let created = 0;
    const payments: string[] = [];
    await page.addInitScript((user) => {
      localStorage.setItem('petplus_token', 'test-token');
      localStorage.setItem('petplus_user', JSON.stringify(user));
    }, tutor);
    const orders = [orderId, secondId].map((id) => ({
      id, status: 'AGUARDANDO_PAGAMENTO', total_price: 45, items: [],
      provider: { id: 'store', business_name: 'Loja Pet+' },
    }));
    const cart = (empty = false) => ({
      id: 'cart', updated_at: '', warnings: [],
      totals: { subtotal: empty ? 0 : 90, discount: 0, total: empty ? 0 : 90, total_items: empty ? 0 : 2 },
      items: empty ? [] : [{
        id: 'cart-item', product_id: 'product', quantity: 2, unit_price: 45, current_unit_price: 45, line_total: 90,
        product: { id: 'product', name: 'Ração Pet+', image_url: null, stock_quantity: 10, status: 'ACTIVE' },
      }],
    });
    await page.route('**/api/v1/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/users/me')) return route.fulfill({ json: tutor });
      if (url.pathname.endsWith('/cart')) return route.fulfill({ json: cart(route.request().method() === 'DELETE') });
      if (url.pathname.endsWith('/addresses')) return route.fulfill({ json: [{ id: 'address', rua: 'Rua Teste', numero: '10', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01001000', is_default: true }] });
      if (url.pathname.endsWith('/payment-config')) return route.fulfill({ json: { provider, sandbox: provider === 'MERCADO_PAGO' } });
      if (url.pathname.endsWith('/orders') && route.request().method() === 'POST') {
        created++;
        expect(route.request().postDataJSON()).not.toHaveProperty('cardData');
        return route.fulfill({ json: { order: orders[0], orders } });
      }
      if (url.pathname.endsWith('/pay')) {
        payments.push(url.pathname.split('/').at(-2)!);
        return route.fulfill({ json: {} });
      }
      if (url.pathname.endsWith('/payment-status')) return route.fulfill({ json: { order: orders.find((order) => url.pathname.includes(order.id)), paymentStatus: 'CREATED' } });
      return route.fulfill({ json: {} });
    });
    await page.goto('/checkout');
    await page.getByRole('button', { name: 'Continuar para Pagamento' }).click();
    if (provider === 'SIMULATED') await page.getByRole('button', { name: 'PIX', exact: true }).click();
    else await expect(page.getByPlaceholder('0000 0000 0000 0000')).toHaveCount(0);
    await page.getByRole('button', { name: 'Revisar Pedido' }).click();
    await page.getByRole('button', { name: /Confirmar Pedido/ }).click();
    if (provider === 'SIMULATED') {
      await expect(page).toHaveURL(/checkout\/success/);
      expect(payments).toEqual([orderId, secondId]);
    } else {
      await expect(page).toHaveURL(/checkout\/payment\?orders=/);
      expect(payments).toEqual([]);
      await expect(page.getByRole('button', { name: 'Pagar no Mercado Pago' })).toHaveCount(2);
    }
    expect(created).toBe(1);
  });
}

test('pagamento de múltiplos lojistas: desktop/mobile, retorno e link hospedado', async ({ page }, testInfo) => {
  let paid = false;
  await page.addInitScript((user) => {
    localStorage.setItem('petplus_token', 'test-token');
    localStorage.setItem('petplus_user', JSON.stringify(user));
  }, tutor);
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/users/me')) return route.fulfill({ json: tutor });
    if (url.pathname.endsWith('/payment-config')) return route.fulfill({ json: { provider: 'MERCADO_PAGO', sandbox: true } });
    if (url.pathname.endsWith('/payment-preference')) return route.fulfill({ json: { preferenceId: 'test-pref', initPoint: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test-pref' } });
    if (url.pathname.endsWith('/payment-status')) {
      const id = url.pathname.split('/').at(-2);
      return route.fulfill({ json: { paymentStatus: paid ? 'APPROVED' : 'CREATED', order: {
        id, provider_id: 'store', customer_id: tutor.id, total_price: 90,
        status: paid ? 'PAGO' : 'AGUARDANDO_PAGAMENTO', items: [],
        provider: { id: 'store', business_name: id === orderId ? 'Loja Pet+ Jardins' : 'Loja Pet+ Centro' },
      } } });
    }
    return route.fulfill({ json: { items: [] } });
  });
  await page.route('https://www.mercadopago.com.br/**', (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Checkout de teste hospedado</h1>' }));
  await page.goto(`/checkout/payment?orders=${orderId},${secondId}`);
  await expect(page.getByRole('heading', { name: 'Pagamento do pedido' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pagar no Mercado Pago' })).toHaveCount(2);
  await expect(page.locator('input[name="cvv"]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('payment-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Pagar no Mercado Pago' }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('payment-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Pagar no Mercado Pago' }).first().click();
  await expect(page).toHaveURL(/www\.mercadopago\.com\.br\/checkout/);
  await page.goto(`/checkout/payment?orderId=${orderId}&status=approved`);
  await expect(page.getByText('Aguardando confirmação do pagamento').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toHaveCount(0);
  paid = true;
  await page.getByRole('button', { name: 'Atualizar pagamento' }).click();
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible();
});
