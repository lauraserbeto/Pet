import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

const path = process.env.SCH_E2E_FIXTURE;
const base = process.env.SCH_E2E_API;
const fixture = path ? JSON.parse(readFileSync(path, "utf8")) : null;
test.use({ timezoneId: "America/Sao_Paulo" });
for (const index of [0, 1]) {
  test(`SCH integrado: ${index === 0 ? "hotel" : "sitter"} gerencia agenda e tutor recebe alterações`, async ({
    page,
  }, testInfo) => {
    test.skip(!fixture || !base, "Exige API local e fixture de teste descartável.");
    if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(base))
      throw Error("API deve ser local de teste.");
    const partner = fixture.partners[index];
    await page.setViewportSize({ width: index === 0 ? 1280 : 390, height: 900 });
    await page.addInitScript((partner) => {
      localStorage.setItem("petplus_user", JSON.stringify(partner.user));
      localStorage.setItem("petplus_token", partner.token);
    }, partner);
    await page.route("**/api/v1/**", async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({
        url: base + url.pathname.replace(/^\/api\/v1/, "") + url.search,
      });
      await route.fulfill({ response });
    });
    await page.goto("/dashboard/schedule");
    const schedule = page.getByRole("region", { name: "Agenda do parceiro" });
    const chooseDay = async (kind: string) => {
      const day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(partner.records[kind].day));
      await schedule.getByLabel("Data da agenda").fill(day);
    };
    await chooseDay("unpaid");
    const unpaid = schedule.getByRole("article", { name: "Atendimento unpaid", exact: true });
    await expect(unpaid).toBeVisible();
    await expect(unpaid.getByRole("button")).toHaveCount(0);
    const paid = schedule.getByRole("article", { name: "Atendimento paid", exact: true });
    await paid.getByRole("button", { name: "Confirmar", exact: true }).click();
    await page.getByRole("button", { name: "Confirmar atendimento", exact: true }).click();
    await expect(paid.getByText("Confirmado", { exact: true })).toBeVisible();
    await paid.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("button", { name: "Cancelar atendimento", exact: true }).click();
    await expect(paid.getByText(/Estornado \(simulado\)/)).toBeVisible();
    const rejected = schedule.getByRole("article", { name: "Atendimento reject", exact: true });
    await rejected.getByRole("button", { name: "Recusar", exact: true }).click();
    await page.getByRole("button", { name: "Recusar solicitação" }).click();
    await expect(rejected.getByText("Recusado", { exact: true })).toBeVisible();
    await expect(rejected.getByText(/Estornado \(simulado\)/)).toBeVisible();
    const confirmed = schedule.getByRole("article", { name: "Atendimento confirmed", exact: true });
    await confirmed.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("button", { name: "Cancelar atendimento", exact: true }).click();
    await expect(confirmed.getByText("Cancelado", { exact: true })).toBeVisible();
    await chooseDay("started");
    const started = schedule.getByRole("article", { name: "Atendimento started", exact: true });
    await started.getByRole("button", { name: "Concluir", exact: true }).click();
    await page.getByRole("button", { name: "Concluir atendimento", exact: true }).click();
    await expect(started.getByText("Concluído", { exact: true })).toBeVisible();
    await page.reload();
    await chooseDay("started");
    await expect(started.getByText("Concluído", { exact: true })).toBeVisible();
    const mine = await page.request.get(base + "/appointments/my", {
      headers: { Authorization: `Bearer ${fixture.tutorToken}` },
    });
    expect(mine.status()).toBe(200);
    const tutorItems = await mine.json();
    expect(
      tutorItems.find((item: { id: string }) => item.id === partner.records.paid.id)
    ).toMatchObject({ status: "CANCELADO", payment: { status: "REFUNDED" } });
    expect(
      tutorItems.find((item: { id: string }) => item.id === partner.records.started.id)
    ).toMatchObject({ status: "CONCLUIDO" });
    expect(
      tutorItems.find((item: { id: string }) => item.id === partner.records.reject.id)
    ).toMatchObject({ status: "RECUSADO", payment: { status: "REFUNDED" } });
    // A outra conta não recebe registros deste parceiro na listagem.
    const other = fixture.partners[1 - index];
    const otherList = await page.request.get(base + "/appointments/provider", {
      headers: { Authorization: `Bearer ${other.token}` },
    });
    expect(otherList.status()).toBe(200);
    expect(
      (await otherList.json()).some((item: { id: string }) => item.id === partner.records.paid.id)
    ).toBe(false);
    const forbidden = await page.request.patch(
      base + `/appointments/${partner.records.unpaid.id}/status`,
      { headers: { Authorization: `Bearer ${other.token}` }, data: { status: "CONFIRMADO" } }
    );
    expect(forbidden.status()).toBe(403);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({ path: testInfo.outputPath("agenda-integrada.png"), fullPage: true });
  });
}
