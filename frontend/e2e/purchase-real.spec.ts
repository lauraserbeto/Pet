import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

/**
 * Jornada de compra ponta a ponta contra API e Postgres reais (QA-2).
 *
 * Os specs existentes cobriam trechos: `payment.spec.ts` mocka as rotas e
 * `checkout-recovery-real.spec.ts` começa no checkout com o carrinho já
 * semeado. Faltava o percurso inteiro — catálogo → carrinho → checkout →
 * sucesso → pedido visível ao tutor —, que é o que o DoD da QA-2 pede.
 */

const file = process.env.PUR_E2E_FIXTURE;
const api = process.env.PUR_E2E_API;
const casos = file ? JSON.parse(readFileSync(file, "utf8")) : null;

const money = (value: number) =>
  value.toFixed(2).replace(".", ",");

for (const width of [1280, 390]) {
  test(`compra ponta a ponta ${width}px: catálogo, carrinho, checkout e pedido`, async ({
    page,
  }, info) => {
    test.skip(!casos || !api, "Exige fixture descartável e backend local de teste.");
    if (!api || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(api))
      throw Error("API deve ser local de teste.");

    // Conta própria por viewport: o carrinho vive no banco e os casos rodam em
    // paralelo — compartilhar o tutor faria um teste somar itens do outro.
    const fixture = casos.find((caso: { width: number }) => caso.width === width);

    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(
      ({ user, token }) => {
        localStorage.setItem("petplus_user", JSON.stringify(user));
        localStorage.setItem("petplus_token", token);
      },
      { user: fixture.user, token: fixture.token }
    );
    // Fontes externas atrasam o teste sem acrescentar cobertura.
    await page.route(/^https:\/\/fonts\./, (route) => route.abort());

    // O build aponta para uma API só; cada cenário roda na sua. Redirecionar
    // aqui mantém este teste no banco dele, sem massa de outro cenário.
    await page.route("**/api/v1/**", async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({
        url: api.replace(/\/api\/v1$/, "") + url.pathname + url.search,
      });
      await route.fulfill({ response });
    });

    const total = fixture.product.price;

    // --- 1. Catálogo: o produto semeado aparece ---
    await page.goto("/shopping", { waitUntil: "domcontentloaded" });
    const card = page.getByText(fixture.product.name, { exact: true }).first();
    await expect(card).toBeVisible();

    // --- 2. Adicionar ao carrinho ---
    await page
      .getByRole("button", { name: `Adicionar ao carrinho: ${fixture.product.name}` })
      .click();

    // --- 3. Carrinho com o item e o preço corretos ---
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(fixture.product.name).first()).toBeVisible();
    await expect(page.getByText(new RegExp(money(total))).first()).toBeVisible();
    await page.screenshot({ path: info.outputPath(`carrinho-${width}.png`), fullPage: true });

    // --- 4. Checkout: endereço → pagamento → confirmação ---
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Continuar para Pagamento", exact: true }).click();
    await page.getByRole("button", { name: "Revisar Pedido", exact: true }).click();
    await page.getByRole("button", { name: /Confirmar Pedido/ }).click();

    // --- 5. Sucesso com o pedido criado de verdade ---
    await expect(page).toHaveURL(/checkout\/success\?orders=/);
    await expect(page.getByRole("heading", { name: "Pagamento confirmado" })).toBeVisible();
    await expect(page.getByText(new RegExp(money(total))).first()).toBeVisible();
    await page.screenshot({ path: info.outputPath(`sucesso-${width}.png`), fullPage: true });

    // --- 6. O pedido aparece para o tutor ---
    await page.goto("/tutor/pedidos", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Meus Pedidos" })).toBeVisible();
    await expect(page.getByText("Nenhum pedido encontrado")).toHaveCount(0);
    await expect(page.getByText(new RegExp(money(total))).first()).toBeVisible();
    await page.screenshot({ path: info.outputPath(`pedidos-${width}.png`), fullPage: true });
  });
}
