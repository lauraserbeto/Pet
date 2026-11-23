import { test, expect } from "@playwright/test";

test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });
for (const width of [1280, 390]) test(`E17 dados públicos e falha de catálogo em ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await page.route(/^https:\/\/fonts\./, route => route.abort());
  const product = { id: "11111111-1111-4111-8111-111111111111", name: "Produto de teste", price: "23.40", status: "ACTIVE", stock_quantity: 0, rating_count: 0, rating_avg: null };
  const partner = { id: "22222222-2222-4222-8222-222222222222", business_name: "Hotel de teste", status: "APROVADO", user: { full_name: "Parceiro de teste", role_id: 3 }, rating_count: 0, rating_avg: null, services: [
    { id: "a", name: "Diária cadastrada", price: "100", is_active: true, billing_unit: "DIARIA" },
    { id: "b", name: "Hora cadastrada", price: "25", is_active: true, billing_unit: "HORA" },
  ] };
  let failures = 1;
  await page.route("**/api/v1/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/products") {
      if (failures > 0) { failures -= 1; return route.fulfill({ status: 503, json: { message: "Catálogo temporariamente indisponível" } }); }
      return route.fulfill({ json: [product] });
    }
    if (path === "/api/v1/products/" + product.id) return route.fulfill({ json: product });
    if (path === "/api/v1/providers/" + partner.id) return route.fulfill({ json: partner });
    if (path === "/api/v1/reviews/summary") return route.fulfill({ json: { rating_count: 0, rating_avg: null, distribution: [] } });
    return route.fulfill({ json: [], headers: { "X-Total-Count": "0", "X-Page": "1", "X-Limit": "10", "X-Total-Pages": "1", "Access-Control-Expose-Headers": "X-Total-Count, X-Total-Pages" } });
  });
  await page.goto("/");
  await expect(page.getByText("Não foi possível carregar os produtos em destaque.")).toBeVisible();
  await expect(page.getByText("Nenhum produto em destaque disponível no momento.")).toHaveCount(0);
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByLabel("Produto sem foto cadastrada")).toBeVisible();
  await expect(page.getByText("Ainda sem avaliações")).toBeVisible();
  await expect(page.getByText("Os produtos mais procurados pelos nossos clientes.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Esgotado", exact: true })).toBeDisabled();
  failures = 1;
  await page.goto("/shopping");
  await expect(page.getByText("Não foi possível carregar o catálogo")).toBeVisible();
  await expect(page.getByText("Nenhum produto encontrado")).toHaveCount(0);
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("link", { name: "Produto sem foto cadastrada" }).or(page.getByLabel("Produto sem foto cadastrada")).first()).toBeVisible();
  await expect(page.locator('img[src*="unsplash"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Esgotado: Produto de teste" })).toBeDisabled();
  await page.screenshot({ path: info.outputPath("shopping-esgotado-sem-foto.png"), fullPage: true, animations: "disabled" });
  await page.goto("/shopping/" + product.id);
  await expect(page.getByText("Produto indisponível")).toBeVisible();
  await expect(page.getByRole("button", { name: "Adicionar ao Carrinho" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Comprar", exact: true, includeHidden: true })).toBeDisabled();
  await page.goto("/hotels/" + partner.id);
  await expect(page.getByText("a partir de · por hora")).toBeVisible();
  await expect(page.getByText("Animais aceitos não informados")).toBeVisible();
  await expect(page.getByText("menor preço por diária")).toHaveCount(0);
  if (width >= 640) await expect(page.getByText(/25,00\s+por hora/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Avaliações de clientes" }).getByText("Ainda sem avaliações")).toBeVisible();
  await expect(page.getByText("Carregando avaliações...", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Não foi possível carregar esta página de avaliações.")).toHaveCount(0);
  await page.getByText("a partir de · por hora").scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("hotel-dados-informados.png"), fullPage: true, animations: "disabled" });
  await page.goto("/contact");
  await page.getByRole("button", { name: "Como funciona o cancelamento de uma reserva?" }).click();
  await expect(page.getByText(/estorno integral simulado/)).toBeVisible();
  await expect(page.getByText(/reembolso é de 50%/)).toHaveCount(0);
  await page.goto("/about");
  await expect(page.getByText(/webcam ao vivo|milhares de pets felizes/)).toHaveCount(0);
  await page.goto("/store/" + partner.id);
  await expect(page.getByLabel("Loja sem foto cadastrada")).toBeVisible();
});
