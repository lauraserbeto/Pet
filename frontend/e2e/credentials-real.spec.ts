import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
const fixturePath = process.env.AUTH_E2E_FIXTURE;
const base = process.env.AUTH_E2E_API;
const outbox = process.env.QA_AUTH_OUTBOX_FILE;
const fixture = fixturePath ? JSON.parse(readFileSync(fixturePath, "utf8")) : null;
for (const width of [1280, 390]) {
  test(`E-09 integrado ${width}px: recuperação, senha repetida, reset e login normalizado`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    test.skip(!fixture || !base || !outbox, "Exige fixture, outbox e API locais de teste.");
    if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(base) || !outbox)
      throw Error("Exige API local de teste.");
    const ctx = fixture.cases.find((item: { width: number }) => item.width === width);
    await page.setViewportSize({ width, height: 900 });
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    let resets = 0;
    await page.route("**/api/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/reset-password")) resets++;
      await route.fulfill({
        response: await route.fetch({
          url: base + url.pathname.replace(/^\/api\/v1/, "") + url.search,
          timeout: 90_000,
        }),
      });
    });
    await page.goto("/recuperar-senha", { waitUntil: "domcontentloaded" });
    await page.getByLabel(/^e-mail cadastrado$/i).fill(ctx.email.toUpperCase());
    await page.getByRole("button", { name: "Enviar link de recuperação" }).click();
    await expect(page.getByText("Verifique seu e-mail")).toBeVisible();
    let resetUrl = "";
    await expect
      .poll(() => {
        const messages = JSON.parse(readFileSync(outbox, "utf8"));
        resetUrl = messages.find((item: { to: string }) => item.to === ctx.email)?.url ?? "";
        return Boolean(resetUrl);
      })
      .toBe(true);
    const link = new URL(resetUrl);
    await page.goto(link.pathname + link.search, { waitUntil: "domcontentloaded" });
    const fill = async (password: string) => {
      await page.getByLabel(/^Nova senha$/i).fill(password);
      await page.getByLabel(/^Confirmar senha$/i).fill(password);
    };
    await fill("novasenha1");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(page.getByText(/ao menos uma letra maiúscula/)).toBeVisible();
    expect(resets).toBe(0);
    await fill(ctx.currentPassword);
    const repeated = page.waitForResponse((response) =>
      response.url().includes("/auth/reset-password")
    );
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    expect((await repeated).status()).toBe(422);
    await expect(
      page.getByText("A nova senha deve ser diferente da senha atual.", { exact: true }).first()
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("senha-repetida.png"),
      animations: "disabled",
    });
    await fill("NovaSenha123");
    const saved = page.waitForResponse(
      (response) => response.url().includes("/auth/reset-password"),
      { timeout: 90_000 }
    );
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    expect((await saved).status()).toBe(200);
    await expect(page.getByText("Senha atualizada!", { exact: true })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("senha-atualizada.png"),
      animations: "disabled",
    });
    await page.waitForURL("**/login", { timeout: 15_000 });
    await page.getByLabel(/^e-mail$/i).fill(ctx.email.toUpperCase());
    await page.getByLabel(/^senha$/i).fill("NovaSenha123");
    const logged = page.waitForResponse((response) => response.url().includes("/auth/login"), {
      timeout: 90_000,
    });
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    expect((await logged).status()).toBe(200);
    await expect
      .poll(() => page.evaluate(() => Boolean(localStorage.getItem("petplus_token"))))
      .toBe(true);
    expect(
      (
        await page.request.post(base + "/auth/login", {
          data: { email: ctx.email, password: ctx.currentPassword },
        })
      ).status()
    ).toBe(401);
    expect(
      (
        await page.request.post(base + "/auth/reset-password", {
          data: { token: link.searchParams.get("token"), password: "OutraSenha123" },
        })
      ).status()
    ).toBe(400);
  });
}
