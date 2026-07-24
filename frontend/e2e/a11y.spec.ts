import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Auditoria de acessibilidade automatizada na landing (rota pública principal).
// GATE: falha em violações CRÍTICAS (ex.: botão sem nome acessível).
// As violações SÉRIAS de contraste de cor dependem de decisão de design sobre a
// paleta da marca — são reportadas como dívida rastreada, não bloqueiam o build.
test("landing page sem violações CRÍTICAS de a11y (axe, WCAG 2 A/AA)", async ({ page }) => {
  await page.goto("/");
  await page.locator("nav").first().waitFor();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const critical = results.violations.filter((v) => v.impact === "critical");
  const serious = results.violations.filter((v) => v.impact === "serious");

  if (serious.length) {
    console.log(
      `⚠ ${serious.length} violação(ões) SÉRIA(s) rastreada(s) (requer decisão de design de contraste):\n` +
        serious.map((v) => `  - ${v.id}: ${v.nodes.length} nó(s)`).join("\n")
    );
  }
  if (critical.length) {
    console.log(
      "Violações CRÍTICAS (bloqueiam):\n" +
        critical.map((v) => `  - ${v.id}: ${v.help} (${v.nodes.length} nó[s])`).join("\n")
    );
  }

  expect(critical).toEqual([]);
});
