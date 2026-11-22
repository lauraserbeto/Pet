import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
const file = process.env.E18_FIXTURE;
const cases = file ? JSON.parse(readFileSync(file, 'utf8')) : null;
for (const width of [1280, 390]) test(`E-18 API/PostgreSQL reais ${width}px: merge perdido, checkout, reload e propriedade`, async ({ page }, info) => {
  test.skip(!cases, 'Exige fixture E18_FIXTURE e API QA local em 3318.');
  const data = cases.find((row: { width: number }) => row.width === width);
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(data => {
    // Só a primeira navegação simula o carrinho anterior ao login.
    if (!sessionStorage.getItem('e18-initialized')) {
      localStorage.setItem('petplus_user', JSON.stringify(data.user));
      localStorage.setItem('petplus_token', data.token);
      localStorage.setItem('petplus_anon_cart', JSON.stringify(data.anon));
      sessionStorage.setItem('e18-initialized', 'true');
    }
  }, data);
  await page.route(/^https:\/\/fonts\./, route => route.abort());
  let merges = 0, creations = 0, deletions = 0, statusReads = 0;
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url()), method = route.request().method();
    const response = await route.fetch({ url: 'http://localhost:3318' + url.pathname + url.search });
    if (method === 'POST' && url.pathname.endsWith('/cart/merge')) {
      merges++;
      expect(response.status()).toBe(200);
      expect((await response.json()).totals.total_items).toBe(5);
      if (merges === 1) { await route.abort('failed'); return; }
    }
    if (method === 'POST' && url.pathname.endsWith('/orders')) creations++;
    if (method === 'DELETE' && url.pathname.endsWith('/cart')) deletions++;
    if (url.pathname.endsWith('/payment-status')) statusReads++;
    await route.fulfill({ response });
  });
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Confira a sincronização do carrinho')).toBeVisible();
  expect(creations).toBe(0);
  await page.screenshot({ path: info.outputPath(`merge-perdido-${width}.png`), fullPage: true });
  await page.getByRole('button', { name: 'Tentar sincronizar novamente' }).click();
  await page.getByRole('button', { name: 'Continuar para Pagamento', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar Pedido', exact: true }).click();
  await page.getByRole('button', { name: /Confirmar Pedido/ }).click();
  await expect(page).toHaveURL(/checkout\/success\?orders=/);
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible();
  await expect(page.getByText(/50,50/)).toBeVisible();
  expect(merges).toBe(2); expect(creations).toBe(1); expect(deletions).toBe(0);
  const before = statusReads;
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible();
  expect(statusReads).toBeGreaterThan(before);
  await page.screenshot({ path: info.outputPath(`confirmacao-real-${width}.png`), fullPage: true });
  await page.goto('/checkout/success?orders=' + data.pending, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Aguardando Pagamento', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toHaveCount(0);
  await page.goto('/checkout/success?orders=' + data.cancelled, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Cancelado', { exact: true })).toBeVisible();
  await page.goto('/checkout/success?orders=' + data.alien, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Pedido não encontrado ou indisponível para esta conta.')).toBeVisible();
  await page.screenshot({ path: info.outputPath(`pedido-alheio-${width}.png`), fullPage: true });
  expect(creations).toBe(1);
});
