import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

const path = process.env.BKG_E2E_FIXTURE;
const base = process.env.BKG_E2E_API;
const fixture = path ? JSON.parse(readFileSync(path, "utf8")) : null;

for (const kind of ["hotel", "sitter"] as const) {
  test(`BKG integrado com API e Postgres: ${kind}`, async ({ page }, testInfo) => {
    test.skip(!fixture || !base, "Exige fixture descartável e backend local de teste.");
    if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(base))
      throw Error("API deve ser local de teste.");
    const selected = fixture[kind];
    await page.setViewportSize({ width: kind === "hotel" ? 1280 : 390, height: 900 });
    await page.addInitScript(
      ({ user, token }) => {
        localStorage.setItem("petplus_user", JSON.stringify(user));
        localStorage.setItem("petplus_token", token);
      },
      { user: fixture.user, token: fixture.token }
    );
    // Proxy de transporte para a API isolada; nenhuma resposta de negócio é simulada.
    await page.route("**/api/v1/**", async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({
        url: base + url.pathname.replace(/^\/api\/v1/, "") + url.search,
      });
      await route.fulfill({ response });
    });
    await page.goto(`/tutor/agendar/${selected.providerId}`);
    await page.getByRole("combobox", { name: /^Serviço/ }).selectOption(selected.serviceId);
    await page.getByRole("combobox", { name: /^Pet/ }).selectOption(fixture.petId);
    await page
      .getByLabel("Início (horário local)")
      .fill(kind === "hotel" ? "2099-01-10T10:00" : "2099-01-15T10:00");
    await page
      .getByLabel("Fim (horário local)")
      .fill(kind === "hotel" ? "2099-01-11T10:00" : "2099-01-15T11:30");
    await page.screenshot({ path: testInfo.outputPath("reserva-formulario-integrado.png"), fullPage: true });
    await page.getByRole("button", { name: "Enviar solicitação" }).click();
    await expect(page.getByRole("heading", { name: "Sua solicitação" })).toBeVisible();
    if (kind === "hotel") {
      await page.getByRole("button", { name: "Pagar agendamento" }).click();
      await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
      await page.screenshot({ path: testInfo.outputPath("reserva-pagamento-integrado.png"), fullPage: true, animations: "disabled" });
      await page.getByRole("button", { name: "Confirmar pagamento simulado" }).click();
      await expect(page.getByText("Pago (simulado)", { exact: true })).toBeVisible();
    } else await expect(page.getByText(/Solicitação enviada. Aguarde/)).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Sua solicitação" })).toBeVisible();
    await page.getByRole("link", { name: "Meus Agendamentos", exact: true }).last().click();
    const card = page.getByRole("article", {
      name: kind === "hotel" ? "Hospedagem E2E" : "Passeio E2E",
    });
    const mine = await page.request.get(base + "/appointments/my", { headers: { Authorization: `Bearer ${fixture.token}` } });
    const reservation = (await mine.json()).find((item: { service_id: string }) => item.service_id === selected.serviceId);
    expect(reservation).toBeTruthy();
    const confirmed = await page.request.patch(base + `/appointments/${reservation.id}/status`, {
      headers: { Authorization: `Bearer ${selected.partnerToken}` }, data: { status: "CONFIRMADO" },
    });
    expect(confirmed.status()).toBe(200);
    await page.getByRole("button", { name: "Atualizar", exact: true }).click();
    await expect(card.getByText("Confirmado", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Cancelar agendamento" }).click();
    await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
    await expect(card.getByText("Cancelado", { exact: true })).toBeVisible();
    if (kind === "hotel") await expect(card.getByText(/Estornado \(simulado\)/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({ path: testInfo.outputPath("reserva-integrada.png"), fullPage: true });
  });
}
