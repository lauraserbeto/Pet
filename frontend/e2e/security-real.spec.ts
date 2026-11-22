import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
const path = process.env.SEC_E2E_FIXTURE,
  base = process.env.SEC_E2E_API;
const fixture = path ? JSON.parse(readFileSync(path, "utf8")) : null;
for (const width of [1280, 390])
  test(`SEC-2 integrado ${width}px: privacidade, métricas e conflito real no checkout`, async ({
    page,
  }, testInfo) => {
    test.skip(!fixture || !base, "Exige fixture/API/PostgreSQL locais.");
    test.setTimeout(120_000);
    if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(base))
      throw Error("Exige API local.");
    const ctx = fixture.cases.find((row: { width: number }) => row.width === width);
    // Restabelece somente o produto desta fixture para permitir repetição local.
    expect(
      (
        await page.request.put(base + "/products/" + ctx.productId, {
          headers: { Authorization: "Bearer " + ctx.partnerToken },
          data: { stock_quantity: 10 },
        })
      ).status()
    ).toBe(200);
    await page.setViewportSize({ width, height: 900 });
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    await page.addInitScript(({ user, token }) => {
      localStorage.setItem("petplus_user", JSON.stringify(user));
      localStorage.setItem("petplus_token", token);
    }, ctx);
    await page.route("**/api/v1/**", async (route) => {
      const url = new URL(route.request().url());
      await route.fulfill({
        response: await route.fetch({
          url: base + url.pathname.replace(/^\/api\/v1/, "") + url.search,
        }),
      });
    });
    const publicResponse = page.waitForResponse((r) =>
      r.url().endsWith("/providers/" + fixture.sitterId)
    );
    await page.goto("/walkers/" + fixture.sitterId, { waitUntil: "domcontentloaded" });
    const provider = await (await publicResponse).json();
    for (const field of ["phone", "address_line", "zip_code", "document", "user_id"])
      expect(provider[field]).toBeUndefined();
    expect(provider.user.email).toBeUndefined();
    await expect(page.getByText("Anápolis, GO", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Ligar", exact: true })).toHaveCount(0);
    await expect(page.getByText(/Telefone e endereço completo não são exibidos/)).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("perfil-publico-minimo.png"),
      fullPage: true,
      animations: "disabled",
    });
    const metrics = new URL(base).origin + "/api/metrics";
    expect((await page.request.get(metrics)).status()).toBe(401);
    expect(
      (
        await page.request.get(metrics, { headers: { Authorization: "Bearer " + ctx.token } })
      ).status()
    ).toBe(403);
    expect(
      (
        await page.request.get(metrics, {
          headers: { Authorization: "Bearer " + fixture.adminToken },
        })
      ).status()
    ).toBe(200);
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Continuar para Pagamento", exact: true }).click();
    await page.getByRole("button", { name: "Revisar Pedido", exact: true }).click();
    const change = await page.request.put(base + "/products/" + ctx.productId, {
      headers: { Authorization: "Bearer " + ctx.partnerToken },
      data: { stock_quantity: 1 },
    });
    expect(change.status()).toBe(200);
    const created = page.waitForResponse(
      (r) => r.url().endsWith("/orders") && r.request().method() === "POST"
    );
    await page.getByRole("button", { name: /Confirmar Pedido/ }).click();
    expect((await created).status()).toBe(409);
    await expect(page.getByText("Estoque insuficiente", { exact: true })).toBeVisible();
    await expect(
      page.getByText(`Estoque insuficiente para o produto "${ctx.productName}"`, { exact: true })
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("checkout-conflito-real.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Ir para o Carrinho", exact: true }).click();
    await expect(page).toHaveURL(/\/cart$/);
    const orders = await page.request.get(base + "/orders", {
      headers: { Authorization: "Bearer " + ctx.token },
    });
    expect(orders.status()).toBe(200);
    expect(await orders.json()).toHaveLength(0);
    expect(
      (await (await page.request.get(base + "/products/" + ctx.productId)).json()).stock_quantity
    ).toBe(1);
  });
