import { test, expect, type Page } from "@playwright/test";

// E-35 (AUD-41): CSP EFETIVA no build de produção (vite preview lê vercel.json).
// Exige o cabeçalho que bloqueia, nenhuma violação nas rotas principais e
// bloqueio real de script injetado. API controlada: roda no CI sem backend.

const LIST_HEADERS = { "X-Total-Count": "0", "X-Page": "1", "X-Limit": "20", "X-Total-Pages": "1", "Access-Control-Expose-Headers": "X-Total-Count, X-Page, X-Limit, X-Total-Pages" };

async function watchViolations(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      (window as unknown as { __csp: string[] }).__csp.push(`${e.effectiveDirective} ← ${e.blockedURI}`),
    );
  });
  // Fontes e imagens externas: a CSP é avaliada antes; a rede é cortada depois.
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|images\.unsplash\.com)\//, (r) => r.abort());
  await page.route("**/api/v1/**", (r) => r.fulfill({ json: [], headers: LIST_HEADERS }));
}
const violations = (page: Page) => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

test("cabeçalho é Content-Security-Policy efetivo, sem Report-Only", async ({ request }) => {
  const res = await request.get("/");
  const headers = res.headers();
  expect(headers["content-security-policy-report-only"]).toBeUndefined();
  const csp = headers["content-security-policy"] ?? "";
  expect(csp).toContain("script-src 'self'");
  expect(csp).not.toContain("unsafe-eval");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
});

test("rotas principais carregam sem violações de CSP", async ({ page }) => {
  await watchViolations(page);
  for (const route of ["/", "/login", "/register", "/shopping", "/hotels", "/walkers", "/about", "/contact", "/partners", "/terms", "/privacy"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page.getByText("Algo deu errado")).toHaveCount(0);
    expect(await violations(page), route).toEqual([]);
  }
});

test("formulário validado pelo Zod não dispara eval bloqueado (jitless)", async ({ page }) => {
  const tutor = { id: "tutor-csp", full_name: "Tutora CSP", email: "tutora@petplus.test", role_id: 5 };
  await page.addInitScript((u) => {
    localStorage.setItem("petplus_token", "test-token");
    localStorage.setItem("petplus_user", JSON.stringify(u));
  }, tutor);
  await watchViolations(page);
  // Rotas registradas por último têm prioridade no Playwright.
  await page.route("**/api/v1/users/me", (r) => r.fulfill({ json: tutor }));
  await page.goto("/tutor/pets");
  await page.getByRole("button", { name: /Adicionar Pet/ }).click();
  // Envio vazio: o zodResolver valida e mostra erros, sem tentar compilar com new Function.
  await page.getByRole("button", { name: "Cadastrar Pet" }).click();
  await expect(page.locator("#pet-name-error")).toBeVisible();
  expect(await violations(page)).toEqual([]);
});

test("script injetado na página é bloqueado pela CSP", async ({ page }) => {
  await watchViolations(page);
  await page.route(/^https:\/\/evil\.example\//, (r) => r.abort());
  await page.goto("/");
  const ran = await page.evaluate(async () => {
    (window as unknown as { __ran: boolean }).__ran = false;
    const inline = document.createElement("script");
    inline.textContent = "window.__ran = true";
    document.body.appendChild(inline);
    const external = document.createElement("script");
    external.src = "https://evil.example/x.js";
    document.body.appendChild(external);
    await new Promise((r) => setTimeout(r, 300));
    return (window as unknown as { __ran: boolean }).__ran;
  });
  expect(ran).toBe(false);
  const blocked = await violations(page);
  expect(blocked.some((v) => v.startsWith("script-src-elem ← inline"))).toBe(true);
  expect(blocked.some((v) => v.includes("evil.example"))).toBe(true);
});
