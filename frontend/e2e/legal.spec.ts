import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Cobre as páginas legais (Termos e Política): estrutura semântica, navegação
// por âncora/deep-link e acessibilidade.

for (const { path, title } of [
  { path: "/terms", title: "Termos de Uso" },
  { path: "/privacy", title: "Política de Privacidade" },
]) {
  test(`${path} — leitura linear, headings e listas reais`, async ({ page }) => {
    await page.goto(path);

    // Um h1 e as 12 seções como h2 reais (antes eram <span> dentro de <button>).
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(12);

    // Conteúdo visível sem precisar expandir nada (permite Ctrl+F e impressão).
    await expect(page.locator("section#contato")).toBeVisible();

    // Bullets viraram listas semânticas de verdade.
    expect(await page.locator("main ul li").count()).toBeGreaterThan(10);

    // Sumário com uma âncora por seção.
    await expect(page.locator('nav[aria-label="Índice do documento"] a')).toHaveCount(12);
  });

  test(`${path} — deep-link por âncora posiciona na cláusula`, async ({ page }) => {
    await page.goto(`${path}#contato`);
    const section = page.locator("section#contato");
    await expect(section).toBeInViewport({ timeout: 10000 });
  });

  test(`${path} — sem violações CRÍTICAS de a11y (axe)`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole("heading", { level: 1 }).waitFor();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    if (critical.length) {
      console.log(critical.map((v) => `  - ${v.id}: ${v.help} (${v.nodes.length})`).join("\n"));
    }
    expect(critical).toEqual([]);
  });
}
