import { test, expect } from "@playwright/test";

/**
 * Smoke E2E "Olá Mundo" — o menor teste ponta a ponta útil.
 * Garante que a aplicação sobe e a landing page renderiza (não é tela branca).
 * Serve de base/gate para os cenários de negócio priorizados (PET-06).
 */
test("landing page carrega e renderiza a navegação", async ({ page }) => {
  await page.goto("/");

  // Título estável definido em index.html.
  await expect(page).toHaveTitle(/Pet\+/i);

  // Landmark de navegação visível → o app renderizou de fato.
  await expect(page.locator("nav").first()).toBeVisible();

  // Usuário deslogado enxerga o acesso ao login.
  await expect(page.getByRole("link", { name: /entrar/i }).first()).toBeVisible();
});

// Garante que o code splitting (React.lazy) funciona nos dois caminhos de Suspense:
test("rota lazy standalone (/login) carrega o formulário", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
});

test("rota lazy sob layout (/products) renderiza sem cair no ErrorBoundary", async ({ page }) => {
  await page.goto("/products");
  await expect(page.locator("nav").first()).toBeVisible();
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
});
