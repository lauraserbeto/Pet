import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
const path = process.env.ORD_E2E_FIXTURE;
const base = process.env.ORD_E2E_API;
const fixture = path ? JSON.parse(readFileSync(path, "utf8")) : null;
for (const width of [1280, 390]) {
  test(`E-08 integrado ${width}px: checkout, pagamento e cancelamento preservam pedido e estoque`, async ({
    page,
  }, testInfo) => {
    test.skip(!fixture || !base, "Exige fixture e API locais de teste.");
    if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(base))
      throw Error("API deve ser local de teste.");
    const ctx = fixture.cases.find((item: { width: number }) => item.width === width);
    await page.setViewportSize({ width, height: 900 });
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    await page.addInitScript(({ user, token }) => {
      localStorage.setItem("petplus_user", JSON.stringify(user));
      localStorage.setItem("petplus_token", token);
    }, ctx);
    let created = 0;
    await page.route("**/api/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/orders") && route.request().method() === "POST") created++;
      await route.fulfill({
        response: await route.fetch({
          url: base + url.pathname.replace(/^\/api\/v1/, "") + url.search,
        }),
      });
    });
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Continuar para Pagamento", exact: true }).click();
    await expect(page.getByText("Pagamento simulado — nenhum valor real é cobrado.")).toBeVisible();
    const createdResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname.endsWith("/orders") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Revisar Pedido", exact: true }).click();
    await page.getByRole("button", { name: /Confirmar Pedido/ }).click();
    const creation = await createdResponse;
    expect(creation.status()).toBe(201);
    const order = (await creation.json()).order;
    expect(order.total_price).toBe(20.2);
    expect(order.items[0].unit_price).toBe(10.1);
    expect(order.shipping_address.cep).toBe("01001-000");
    await expect(page).toHaveURL(/checkout\/success/);
    expect(created).toBe(1);
    const readStock = async () =>
      (await (await page.request.get(`${base}/products/${ctx.productId}`)).json()).stock_quantity;
    expect(await readStock()).toBe(8);
    const cancellation = await page.request.patch(`${base}/orders/${order.id}/status`, {
      headers: { Authorization: `Bearer ${ctx.partnerToken}` },
      data: { status: "CANCELADO" },
    });
    expect(cancellation.status()).toBe(200);
    expect(await readStock()).toBe(10);
    const repeated = await page.request.patch(`${base}/orders/${order.id}/status`, {
      headers: { Authorization: `Bearer ${ctx.partnerToken}` },
      data: { status: "CANCELADO" },
    });
    expect(repeated.status()).toBe(200);
    expect(await readStock()).toBe(10);
    await page.goto("/tutor/pedidos", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Cancelado", { exact: true }).first()).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("pedido-cancelado.png"),
      animations: "disabled",
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });
}
