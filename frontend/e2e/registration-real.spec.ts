import { test, expect, type Page } from "@playwright/test";
const base = process.env.REG_E2E_API;
function validateBase() {
  if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(base))
    throw Error("Exige API local de teste.");
}
async function connect(page: Page) {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({
      response: await route.fetch({
        url: base + url.pathname.replace(/^\/api\/v1/, "") + url.search,
        timeout: 90_000,
      }),
    });
  });
}
async function fill(page: Page, email: string) {
  await page.getByLabel(/^nome completo$/i).fill("Pessoa QA");
  await page.getByLabel(/^e-mail$/i).fill(email);
  await page.getByLabel(/^senha$/i).fill("Senha123");
  await page.getByLabel(/^confirmar senha$/i).fill("Senha123");
}
for (const width of [1280, 390])
  test(`E-10 integrado ${width}px: tutor, parceiro e textos legais`, async ({ page }, testInfo) => {
    test.skip(!base, "Exige API/PostgreSQL locais.");
    test.setTimeout(180_000);
    validateBase();
    await page.setViewportSize({ width, height: 900 });
    await connect(page);
    let submitted = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/auth/register")) submitted++;
    });
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Versão dos termos: 2026-02-20")).toBeVisible();
    await fill(page, `e10-tutor-${width}@petplus.test`);
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(
      page.getByText("Aceite os Termos de Uso para continuar.", { exact: true })
    ).toBeVisible();
    expect(submitted).toBe(0);
    await expect(page.getByRole("link", { name: "Termos de Uso", exact: true })).toHaveAttribute(
      "target",
      "_blank"
    );
    await page.getByRole("checkbox").check();
    const tutorResponse = page.waitForResponse((response) =>
      response.url().endsWith("/auth/register")
    );
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    const tutor = await tutorResponse;
    expect(tutor.status()).toBe(201);
    const user = (await tutor.json()).user;
    expect(user.terms_accepted).toBe(true);
    expect(user.terms_version).toBe("2026-02-20");
    expect(user.terms_accepted_at).toBeTruthy();
    expect(user.password_hash).toBeUndefined();
    await page.waitForURL("**/login");
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Sou Parceiro" }).click();
    await page.getByLabel(/^Tipo$/i).click();
    await page
      .getByRole("option", { name: width === 1280 ? "Hotel" : "Lojista", exact: true })
      .click();
    await page.locator("#businessName").fill("Parceiro QA");
    await fill(page, `e10-parceiro-${width}@petplus.test`);
    await page.getByLabel(/^Documento$/i).fill("12ABC34501DE34");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(page.getByText("Confira o CNPJ", { exact: true })).toBeVisible();
    expect(submitted).toBe(1);
    const formatted = width === 1280 ? "11.222.333/0001-81" : "12.ABC.345/01DE-35";
    await page
      .getByLabel(/^Documento$/i)
      .fill(width === 1280 ? "11222333000181" : "12abc34501de35");
    await expect(page.getByLabel(/^Documento$/i)).toHaveValue(formatted);
    await expect(page.getByLabel(/^Documento$/i)).toHaveAttribute("inputmode", "text");
    if (width === 390) {
      const documentBox = await page.getByLabel(/^Documento$/i).boundingBox();
      const emailBox = await page.getByLabel(/^e-mail$/i).boundingBox();
      expect(documentBox!.width).toBeGreaterThan(180);
      expect(emailBox!.y).toBeGreaterThan(documentBox!.y);
    }
    // Sonner pausa o fechamento enquanto o ponteiro está sobre a notificação.
    await page.mouse.move(0, 0);
    await expect(page.getByText("Confira o CNPJ", { exact: true })).toBeHidden({ timeout: 10000 });
    await page.getByText("Versão dos termos: 2026-02-20").click();
    await page.screenshot({
      path: testInfo.outputPath("cadastro-parceiro.png"),
      fullPage: true,
      animations: "disabled",
    });
    const partnerResponse = page.waitForResponse((response) =>
      response.url().endsWith("/auth/register")
    );
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    expect((await partnerResponse).status()).toBe(201);
    await page.waitForURL("**/login");
    expect(submitted).toBe(2);
    for (const path of ["/terms", "/privacy"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Versão: 2026-02-20", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      await page.screenshot({
        path: testInfo.outputPath(path === "/terms" ? "termos.png" : "privacidade.png"),
        animations: "disabled",
      });
    }
  });
test("E-10: falha de metadados bloqueia cadastro e retry consulta a API local", async ({
  page,
}) => {
  test.skip(!base, "Exige API local.");
  validateBase();
  await connect(page);
  let fail = true;
  await page.route("**/legal/policy", async (route) => {
    if (fail)
      await route.fulfill({ status: 503, json: { message: "Indisponibilidade controlada QA" } });
    else await route.fallback();
  });
  await page.goto("/register", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Não foi possível carregar a versão dos termos/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar minha conta" })).toBeDisabled();
  fail = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByText("Versão dos termos: 2026-02-20")).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar minha conta" })).toBeEnabled();
});
test("E-10: versão diferente do texto incluído no build impede cadastro", async ({ page }) => {
  test.skip(!base, "Exige QA local.");
  validateBase();
  await connect(page);
  await page.route("**/legal/policy", (route) =>
    route.fulfill({ json: { version: "2099-01-01", published_at: "2099-01-01" } })
  );
  await page.goto("/register", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Não foi possível carregar a versão dos termos/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar minha conta" })).toBeDisabled();
  await expect(page.getByRole("checkbox")).toBeDisabled();
});

test("E-10 integrado: Pet Sitter cadastra CPF com máscara e aceite versionado", async ({
  page,
}) => {
  test.skip(!base, "Exige API/PostgreSQL locais.");
  validateBase();
  await connect(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/register", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Sou Parceiro" }).click();
  await page.getByLabel(/^Tipo$/i).click();
  await page.getByRole("option", { name: "Pet Sitter", exact: true }).click();
  await page.locator("#businessName").fill("Sitter QA");
  await page.locator("#documentTypeSelect").click();
  await page.getByRole("option", { name: "CPF", exact: true }).click();
  await page.getByLabel(/^Documento$/i).fill("529a98224725");
  await expect(page.getByLabel(/^Documento$/i)).toHaveValue("529.982.247-25");
  await fill(page, "e10-sitter-cpf@petplus.test");
  await expect(page.getByText("Versão dos termos: 2026-02-20")).toBeVisible();
  await page.getByRole("checkbox").check();
  const saved = page.waitForResponse((response) => response.url().endsWith("/auth/register"));
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  const response = await saved;
  expect(response.status()).toBe(201);
  expect((await response.json()).user.role_id).toBe(4);
});
