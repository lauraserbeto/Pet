import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

const path = process.env.DSH_E2E_FIXTURE;
const base = process.env.DSH_E2E_API;
const fixture = path ? JSON.parse(readFileSync(path, "utf8")) : null;
test.use({ timezoneId: "America/Sao_Paulo" });
for (const kind of ["store", "hotel", "sitter", "empty", "admin"]) {
  test(`DSH integrado: ${kind} confere painel, financeiro e período`, async ({
    page,
  }, testInfo) => {
    test.skip(!fixture || !base, "Exige fixture e API locais de teste.");
    if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(base))
      throw Error("API deve ser local de teste.");
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    await page.setViewportSize({
      width: ["hotel", "sitter", "empty"].includes(kind) ? 390 : 1280,
      height: 900,
    });
    await page.addInitScript(({ user, token }) => {
      localStorage.setItem("petplus_user", JSON.stringify(user));
      localStorage.setItem("petplus_token", token);
    }, fixture.accounts[kind]);
    await page.route("**/api/v1/**", async (route) => {
      const url = new URL(route.request().url());
      await route.fulfill({
        response: await route.fetch({
          url: base + url.pathname.replace(/^\/api\/v1/, "") + url.search,
        }),
      });
    });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const panel = page.getByRole("region", { name: "Indicadores de pedidos e agendamentos" });
    await expect(panel).toBeVisible();
    const kpi = (name: string) => panel.getByText(name, { exact: true }).locator("..");
    if (kind === "store" || kind === "admin") {
      await expect(kpi("Vendas reconhecidas")).toContainText(kind === "store" ? /60,60/ : /90,90/);
      await expect(kpi("Pedidos no período")).toContainText(kind === "store" ? "7" : "8");
    } else if (kind === "empty") {
      await expect(kpi("Vendas reconhecidas")).toContainText(/0,00/);
      await expect(panel.getByText("Nenhum registro no período.")).toHaveCount(2);
    } else {
      await expect(kpi("Pré-pagamentos simulados")).toContainText(
        kind === "hotel" ? /130,10/ : /0,00/
      );
      await expect(kpi("Estornos simulados")).toContainText(kind === "hotel" ? /50,10/ : /0,00/);
      await expect(panel.getByText("Vendas reconhecidas", { exact: true })).toHaveCount(0);
    }
    await expect(page.getByText("Saldo Disponível", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Solicitar Saque" })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("overview.png"), animations: "disabled" });
    if (kind !== "admin") {
      await page.getByRole("link", { name: "Ver financeiro", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Financeiro", exact: true })).toBeVisible();
      await expect(panel).toBeVisible();
      const changed = page.waitForResponse(response => response.url().includes('/metrics') && new URL(response.url()).searchParams.get('days') === '7');
      await page.getByLabel("Período das métricas").selectOption("7");
      expect((await changed).status()).toBe(200);
    } else {
      await expect(page.getByText("Usuários cadastrados", { exact: true })).toBeVisible();
      const changed = page.waitForResponse(response => response.url().includes('/metrics') && new URL(response.url()).searchParams.get('days') === '7');
      await page.getByLabel("Período das métricas").click();
      await page.getByRole("option", { name: "Últimos 7 dias", exact: true }).click();
      expect((await changed).status()).toBe(200);
    }
    await expect(panel.getByText(/Período:/)).toBeVisible();
    await page.getByRole("button", { name: "Atualizar métricas", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Atualizar métricas", exact: true })
    ).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({ path: testInfo.outputPath("financeiro.png"), animations: "disabled" });
    if (kind === "store" || kind === "admin") {
      const chart = panel.getByLabel("Gráfico de vendas reconhecidas");
      await chart.scrollIntoViewIfNeeded();
      await expect(chart.locator(".recharts-area-curve")).toHaveAttribute("d", /M/);
      await panel.getByText("Consultar valores diários", { exact: true }).click();
      const table = panel.getByRole("table", { name: "Vendas reconhecidas por dia em reais" });
      await expect(table).toContainText(kind === "store" ? /60,60/ : /90,90/);
      await page.screenshot({ path: testInfo.outputPath("serie-diaria.png"), animations: "disabled" });
    }
  });
}
