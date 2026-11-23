import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
const file = process.env.E19_FIXTURE;
const accounts = file ? JSON.parse(readFileSync(file, 'utf8')) : null;
for (const width of [1280, 390]) test(`E-19 API/PostgreSQL reais: paginação e totais em ${width}px`, async ({ page }, info) => {
  test.skip(!accounts, 'Exige fixture local E19_FIXTURE e API QA em 3319.');
  await page.setViewportSize({ width, height: 900 });
  await page.route(/^https:\/\/fonts\./, r => r.abort());
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    await route.fulfill({ response: await route.fetch({ url: 'http://localhost:3319' + url.pathname + url.search }) });
  });
  for (const role of [5, 2]) {
    await page.addInitScript(account => {
      localStorage.setItem('petplus_user', JSON.stringify({ ...account.user, provider_status: 'APROVADO' }));
      localStorage.setItem('petplus_token', account.token);
    }, accounts[role]);
    const total = role === 5 ? 25 : 26;
    await page.goto(role === 5 ? '/tutor/pedidos' : '/dashboard/orders', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(`${total} pedidos · Página 1 de 2`)).toBeVisible();
    await page.getByRole('button', { name: 'Próxima página' }).click();
    await expect(page.getByText(`${total} pedidos · Página 2 de 2`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Próxima página' })).toBeDisabled();
    if (role === 2) {
      await expect(page.getByText('25', { exact: true })).toBeVisible();
      await expect(page.getByText(/202,00/)).toBeVisible();
    }
    await page.evaluate(() => { window.scrollTo(0, 0); });
    await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node; while ((node = walker.nextNode())) if(node.nodeValue) node.nodeValue = node.nodeValue.replace(/[^\s@]+@[^\s@]+/g, '••••@••••');
    });
    await page.screenshot({ path: info.outputPath(`pedidos-${role}-${width}.png`), fullPage: true, animations: 'disabled' });
    if (role === 2) {
      await page.getByRole('searchbox', { name: /Buscar pedidos/ }).fill('Localizavel');
      await page.getByRole('button', { name: 'Buscar', exact: true }).click();
      await expect(page.getByText('1 pedidos · Página 1 de 1')).toBeVisible();
      await expect(page.getByText('25', { exact: true })).toBeVisible();
    }
  }
});
