import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
const fixturePath = process.env.DEL_E2E_FIXTURE;
const base = process.env.DEL_E2E_API;
const fixture = fixturePath ? JSON.parse(readFileSync(fixturePath, "utf8")) : null;
for (const width of [1280, 390])
  test(`E-12 integrado ${width}px: bloqueios, remoção e histórico preservado`, async ({
    page,
  }, testInfo) => {
    test.skip(!fixture || !base, "Exige fixture e API/PostgreSQL locais.");
    test.setTimeout(120_000);
    if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(base))
      throw Error("Exige API local de teste.");
    const ctx = fixture.cases.find((row: { width: number }) => row.width === width);
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
    // Confirmação no diálogo do app (G22), não mais window.confirm().
    const answer = (label: string) => page.getByRole("dialog").getByRole("button", { name: label, exact: true }).click();
    await page.goto("/tutor/pets", { waitUntil: "domcontentloaded" });
    const activeButton = page.getByRole("button", {
      name: `Excluir pet ${ctx.active.name}`,
      exact: true,
    });
    await activeButton.click();
    await answer("Voltar");
    await expect(activeButton).toBeVisible();
    const blocked = page.waitForResponse(
      (r) => r.request().method() === "DELETE" && r.url().endsWith(ctx.active.id)
    );
    await activeButton.click();
    await answer("Remover pet");
    expect((await blocked).status()).toBe(409);
    await expect(page.getByText(/Não é possível remover este pet enquanto/)).toBeVisible();
    await expect(activeButton).toBeEnabled();
    for (const pet of [ctx.history, ctx.free]) {
      const removed = page.waitForResponse(
        (r) => r.request().method() === "DELETE" && r.url().endsWith(pet.id)
      );
      await page.getByRole("button", { name: `Excluir pet ${pet.name}`, exact: true }).click();
      await answer("Remover pet");
      expect((await removed).status()).toBe(204);
      await expect(page.getByRole("heading", { name: pet.name, exact: true })).toHaveCount(0);
    }
    await page.screenshot({
      path: testInfo.outputPath("pet-ativo-preservado.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("/tutor/agendamentos", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(ctx.history.name, { exact: false }).first()).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("historico-preservado.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("/tutor/perfil", { waitUntil: "domcontentloaded" });
    const firstButton = page.getByRole("button", {
      name: `Excluir endereço ${ctx.first.rua}, ${ctx.first.numero}`,
      exact: true,
    });
    const deleted = page.waitForResponse(
      (r) => r.request().method() === "DELETE" && r.url().endsWith(ctx.first.id)
    );
    await firstButton.click();
    await answer("Excluir endereço");
    expect((await deleted).status()).toBe(204);
    await expect(firstButton).toHaveCount(0);
    await expect(page.getByText("Principal", { exact: true })).toBeVisible();
    const lastButton = page.getByRole("button", {
      name: `Excluir endereço ${ctx.second.rua}, ${ctx.second.numero}`,
      exact: true,
    });
    const last = page.waitForResponse(
      (r) => r.request().method() === "DELETE" && r.url().endsWith(ctx.second.id)
    );
    await lastButton.click();
    await answer("Excluir endereço");
    expect((await last).status()).toBe(409);
    await expect(page.getByText(/Não é possível excluir o único endereço/)).toBeVisible();
    await expect(lastButton).toBeEnabled();
    await page.screenshot({
      path: testInfo.outputPath("ultimo-endereco-preservado.png"),
      fullPage: true,
      animations: "disabled",
    });
    const headers = { Authorization: `Bearer ${ctx.token}` };
    const orders = await (await page.request.get(base + "/orders", { headers })).json();
    const list = Array.isArray(orders) ? orders : orders.orders;
    expect(list.find((row: { id: string }) => row.id === ctx.orderId).shipping_address).toEqual(
      ctx.snapshot
    );
    const pets = await (await page.request.get(base + "/users/me/pets", { headers })).json();
    expect(pets.map((pet: { id: string }) => pet.id)).toEqual([ctx.active.id]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });
