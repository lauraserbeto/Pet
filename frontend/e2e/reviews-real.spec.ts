import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

const path = process.env.AVL_E2E_FIXTURE;
const base = process.env.AVL_E2E_API;
const fixture = path ? JSON.parse(readFileSync(path, "utf8")) : null;
test.use({ timezoneId: "America/Sao_Paulo" });
for (const kind of ["product", "hotel", "sitter"]) {
  test(`AVL integrado: ${kind} escreve, persiste e exibe avaliação real`, async ({
    page,
  }, testInfo) => {
    test.skip(!fixture || !base, "Exige fixture e API locais de teste.");
    if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(base))
      throw Error("API deve ser local de teste.");
    // Fontes remotas não fazem parte da jornada; as capturas usam o fallback local.
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    await page.setViewportSize({ width: kind === "product" ? 1280 : 390, height: 900 });
    await page.addInitScript(({ user, token }) => {
      localStorage.setItem("petplus_user", JSON.stringify(user));
      localStorage.setItem("petplus_token", token);
    }, fixture);
    await page.route("**/api/v1/**", async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({
        url: base + url.pathname.replace(/^\/api\/v1/, "") + url.search,
      });
      await route.fulfill({ response });
    });
    const selected = kind === "product" ? null : fixture.appointments[kind === "hotel" ? 0 : 1];
    await page.goto(kind === "product" ? "/tutor/pedidos" : "/tutor/agendamentos", {
      waitUntil: "domcontentloaded",
    });
    const name = kind === "product" ? "Produto Avaliações QA" : selected.name;
    const trigger = page.getByRole("button", { name: `Avaliar ${name}`, exact: true });
    await expect(trigger).toHaveCount(1);
    await trigger.click();
    await page.getByRole("radio", { name: "5 estrelas", exact: true }).check();
    await page.getByLabel("Comentário (opcional)").fill(`Minha experiência ${kind} foi positiva.`);
    await page.screenshot({ path: testInfo.outputPath("formulario.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Enviar avaliação", exact: true }).click();
    await expect(page.getByText("Avaliação enviada com sucesso.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar avaliação", exact: true })).toHaveCount(
      0
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: `Avaliar ${name}`, exact: true }).click();
    await expect(page.getByText("Você já avaliou este item.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar avaliação", exact: true })).toHaveCount(
      0
    );
    await page.goto(
      kind === "product"
        ? `/shopping/${fixture.productId}`
        : `/${selected.path}/${selected.providerId}`,
      { waitUntil: "domcontentloaded" }
    );
    const panel = page.getByRole("region", { name: "Avaliações de clientes", exact: true });
    await expect(panel.getByText("Tutora Avaliações QA", { exact: true })).toBeVisible();
    await expect(
      panel.getByText(`Minha experiência ${kind} foi positiva.`, { exact: true })
    ).toBeVisible();
    await expect(
      panel.getByText(kind === "product" ? "(13 avaliações)" : "(1 avaliação)", { exact: true })
    ).toBeVisible();
    await expect(panel.getByRole("meter", { name: "5 estrelas", exact: true })).toHaveAttribute(
      "value",
      "1"
    );
    if (kind === "product") {
      await expect(panel.getByText("4,1", { exact: true })).toBeVisible();
      await panel.getByRole("button", { name: "Próxima página", exact: true }).click();
      await expect(panel.getByText("Página 2 de 3")).toBeVisible();
      await expect(panel.getByRole("article")).toHaveCount(5);
      await panel.getByRole("button", { name: "Próxima página", exact: true }).click();
      await expect(panel.getByText("Página 3 de 3")).toBeVisible();
      await expect(panel.getByRole("article")).toHaveCount(3);
    }
    await panel.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({
      path: testInfo.outputPath("avaliacoes-publicas.png"),
      animations: "disabled",
    });
  });
}
