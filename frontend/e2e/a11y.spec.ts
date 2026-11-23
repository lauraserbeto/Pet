import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// E-34 (AUD-40): portão de acessibilidade. Reprova violações SÉRIAS e CRÍTICAS
// (WCAG 2.0/2.1 A e AA) em rotas públicas, checkout e painel, em 1280 e 390 px,
// e confere que os modais são diálogos de verdade (foco dentro, Esc fecha).
// Respostas da API são controladas: não dependem de backend no CI.

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const LIST_HEADERS = {
  "X-Total-Count": "0", "X-Page": "1", "X-Limit": "20", "X-Total-Pages": "1",
  "Access-Control-Expose-Headers": "X-Total-Count, X-Page, X-Limit, X-Total-Pages",
};

async function expectNoSeriousViolations(page: Page, label: string, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(TAGS);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  const blocking = violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(blocking, `${label}\n${blocking.join("\n")}`).toEqual([]);
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  // Espera transições (fade/zoom) terminarem: no meio delas o axe mede cores parciais.
  await page.waitForTimeout(900);
}

const tutor = { id: "tutor-a11y", full_name: "Tutora A11y", email: "tutora@petplus.test", role_id: 5 };
const cartItem = {
  id: "cart-item", product_id: "product", quantity: 1, unit_price: 45, current_unit_price: 45, line_total: 45,
  product: { id: "product", name: "Ração Pet+", image_url: null, stock_quantity: 10, status: "ACTIVE" },
};

async function mockApi(page: Page, user?: Record<string, unknown>) {
  if (user) {
    await page.addInitScript((u) => {
      localStorage.setItem("petplus_token", "test-token");
      localStorage.setItem("petplus_user", JSON.stringify(u));
    }, user);
  }
  await page.route(/^https:\/\/fonts\./, (route) => route.abort());
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/v1", "");
    if (path === "/users/me") return route.fulfill({ json: user ?? {} });
    if (path === "/cart") return route.fulfill({ json: { id: "cart", updated_at: "", warnings: [], items: [cartItem], totals: { subtotal: 45, discount: 0, total: 45, total_items: 1 } } });
    if (path === "/addresses") return route.fulfill({ json: [{ id: "address", rua: "Rua Teste", numero: "10", bairro: "Centro", cidade: "São Paulo", estado: "SP", cep: "01001000", is_default: true }] });
    if (path === "/payment-config") return route.fulfill({ json: { provider: "SIMULATED", sandbox: false } });
    if (path === "/pets") return route.fulfill({ json: [] });
    // Métricas e completude: 503 controlado mostra o estado de erro real do painel
    // (formato inválido derrubaria a tela no ErrorBoundary, o que não é o objeto do teste).
    if (/^\/(providers\/me\/metrics|admin\/metrics|providers\/completeness)/.test(path))
      return route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE", message: "Indisponível no teste" } } });
    // Demais consultas: lista vazia paginada, suficiente para renderizar estados vazios.
    return route.fulfill({ json: [], headers: LIST_HEADERS });
  });
}

for (const width of [1280, 390]) {
  test.describe(`a11y ${width}px`, () => {
    test.beforeEach(async ({ page }) => page.setViewportSize({ width, height: 900 }));

    test("rotas públicas sem violações sérias ou críticas", async ({ page }) => {
      await mockApi(page);
      for (const route of ["/", "/login", "/register", "/recuperar-senha", "/shopping", "/hotels", "/walkers", "/about", "/partners", "/contact", "/terms", "/privacy"]) {
        await page.goto(route);
        await settle(page);
        await expectNoSeriousViolations(page, `${route} @${width}`);
      }
      expect(await page.evaluate(() => document.documentElement.lang)).toBe("pt-BR");
    });

    test("checkout (endereço e pagamento) sem violações sérias ou críticas", async ({ page }) => {
      await mockApi(page, tutor);
      await page.goto("/checkout");
      await page.getByRole("button", { name: "Continuar para Pagamento" }).waitFor();
      await settle(page);
      await expectNoSeriousViolations(page, `/checkout endereço @${width}`);
      await page.getByRole("button", { name: "Continuar para Pagamento" }).click();
      await settle(page);
      await expectNoSeriousViolations(page, `/checkout pagamento @${width}`);
    });

    for (const [role, label] of [[2, "lojista"], [3, "hotel"], [1, "admin"]] as const) {
      test(`painel do ${label} sem violações sérias ou críticas`, async ({ page }) => {
        await mockApi(page, { id: `u-${role}`, full_name: `Conta ${label}`, email: `${label}@petplus.test`, role_id: role, provider_status: "APROVADO", onboarding_step: "COMPLETED" });
        await page.goto("/dashboard");
        await settle(page);
        // O painel precisa ter renderizado (não o ErrorBoundary).
        await expect(page.getByText("Algo deu errado")).toHaveCount(0);
        await expectNoSeriousViolations(page, `/dashboard ${label} @${width}`);
        if (width < 768) {
          // Menu do celular: diálogo com foco dentro e Esc fechando.
          await page.getByRole("button", { name: "Abrir menu" }).click();
          const menu = page.getByRole("dialog", { name: "Menu do painel" });
          await expect(menu).toBeVisible();
          await settle(page);
          await expectNoSeriousViolations(page, `menu do painel ${label}`, '[role="dialog"]');
          await page.keyboard.press("Escape");
          await expect(menu).toHaveCount(0);
          await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
        }
      });
    }
  });
}

test("modais do tutor são diálogos acessíveis: foco dentro e Esc fecha", async ({ page }) => {
  await mockApi(page, tutor);

  await page.goto("/tutor/pets");
  await page.getByRole("button", { name: /Adicionar Pet/ }).click();
  const petForm = page.getByRole("dialog", { name: "Novo Pet" });
  await expect(petForm).toBeVisible();
  await expect(petForm.getByLabel("Nome do Pet")).toBeVisible();
  await settle(page);
  expect(await petForm.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await expectNoSeriousViolations(page, "formulário de pet", '[role="dialog"]');
  await page.keyboard.press("Escape");
  await expect(petForm).toHaveCount(0);

  await page.goto("/cart");
  await page.getByRole("button", { name: "Remover Ração Pet+ do carrinho" }).click();
  const confirm = page.getByRole("dialog", { name: "Remover este item?" });
  await expect(confirm).toBeVisible();
  await settle(page);
  expect(await confirm.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await expectNoSeriousViolations(page, "confirmação de remoção", '[role="dialog"]');
  await page.keyboard.press("Escape");
  await expect(confirm).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remover Ração Pet+ do carrinho" })).toBeFocused();
});
