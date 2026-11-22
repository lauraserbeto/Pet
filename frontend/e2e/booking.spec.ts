import { test, expect } from "@playwright/test";
const tutor = { id: "tutor", full_name: "Tutor Teste", email: "tutor@petplus.test", role_id: 5 };

for (const policy of ["PRESENCIAL", "PRE_PAGO"]) {
  for (const width of [390, 1280]) {
    test(`reserva ${policy} em ${width}px: cria, acompanha, paga e cancela`, async ({
      page,
    }, testInfo) => {
      const hotel = width === 1280;
      const service = {
        id: "service",
        name: hotel ? "Hospedagem" : "Passeio",
        category: hotel ? "BOARDING" : "WALKING",
        billing_unit: hotel ? "DIARIA" : "HORA",
        price: 80,
        is_active: true,
      };
      let appointment: Record<string, unknown> | null = null;
      let created = 0,
        paid = 0,
        cancelled = 0;
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((user) => {
        localStorage.setItem("petplus_token", "test-token");
        localStorage.setItem("petplus_user", JSON.stringify(user));
      }, tutor);
      await page.route("**/api/v1/**", async (route) => {
        const request = route.request(),
          path = new URL(request.url()).pathname;
        if (path.endsWith("/users/me")) return route.fulfill({ json: tutor });
        if (path.endsWith("/users/me/pets"))
          return route.fulfill({ json: [{ id: "pet", name: "Rex" }] });
        if (path.endsWith("/providers/partner"))
          return route.fulfill({
            json: {
              id: "partner",
              business_name: "Parceiro Teste",
              status: "APROVADO",
              payment_policy: policy,
              user: { role_id: hotel ? 3 : 4, full_name: "Parceiro Teste" },
              services: [service],
            },
          });
        if (path.endsWith("/appointments") && request.method() === "POST") {
          created++;
          const body = request.postDataJSON();
          expect(body).not.toHaveProperty("total_price");
          expect(body.start_time).toMatch(/Z$/);
          appointment = {
            ...body,
            id: "reservation",
            provider_id: "partner",
            status: "PENDENTE",
            payment_policy: policy,
            total_price: 180,
            pet: { name: "Rex" },
            provider: { business_name: "Parceiro Teste" },
            service,
            payment: null,
          };
          return route.fulfill({ status: 201, json: appointment });
        }
        if (path.endsWith("/appointments/my"))
          return route.fulfill({ json: appointment ? [appointment] : [] });
        if (path.endsWith("/appointments/reservation/pay")) {
          paid++;
          appointment = {
            ...appointment,
            status: "AGUARDANDO_CONFIRMACAO",
            payment: { id: "payment", status: "APPROVED", amount: 180, simulated: true },
          };
          return route.fulfill({ json: appointment });
        }
        if (path.endsWith("/appointments/reservation/status")) {
          cancelled++;
          appointment = {
            ...appointment,
            status: "CANCELADO",
            payment:
              policy === "PRE_PAGO"
                ? { id: "payment", status: "REFUNDED", amount: 180, simulated: true }
                : null,
          };
          return route.fulfill({ json: appointment });
        }
        if (path.endsWith("/appointments/reservation")) return route.fulfill({ json: appointment });
        return route.fulfill({ json: { items: [], totals: { total_items: 0 } } });
      });
      await page.goto("/tutor/agendar/partner");
      await page.getByRole("combobox", { name: /^Serviço/ }).selectOption("service");
      await page.getByRole("combobox", { name: /^Pet/ }).selectOption("pet");
      await page.getByLabel("Início (horário local)").fill("2099-01-10T10:00");
      await page
        .getByLabel("Fim (horário local)")
        .fill(hotel ? "2099-01-11T10:00" : "2099-01-10T11:30");
      await expect(page.getByText(/Prévia:/)).toContainText(hotel ? "80,00" : "160,00");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      await page.screenshot({
        path: testInfo.outputPath("reserva-formulario.png"),
        fullPage: true,
      });
      await page.getByRole("button", { name: "Enviar solicitação" }).click();
      await expect(page.getByRole("heading", { name: "Sua solicitação" })).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { name: "Sua solicitação" })).toBeVisible();
      expect(created).toBe(1);
      if (policy === "PRE_PAGO") {
        await page.getByRole("button", { name: "Pagar agendamento" }).click();
        await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
        await expect(page.getByRole("dialog")).toContainText(/180,00/);
        await page.screenshot({
          path: testInfo.outputPath("reserva-pagamento.png"),
          animations: "disabled",
          fullPage: true,
        });
        expect(paid).toBe(0);
        await page.getByRole("button", { name: "Confirmar pagamento simulado" }).click();
        await expect(page.getByText("Pago (simulado)", { exact: true })).toBeVisible();
        expect(paid).toBe(1);
      } else {
        await expect(
          page.getByText("Solicitação enviada. Aguarde a confirmação do parceiro.")
        ).toBeVisible();
        await expect(page.getByRole("button", { name: "Pagar agendamento" })).toHaveCount(0);
      }
      await page.getByRole("link", { name: "Meus Agendamentos", exact: true }).last().click();
      await expect(page).toHaveURL(/tutor\/agendamentos/);
      await page.getByRole("button", { name: "Cancelar agendamento" }).click();
      await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
      await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
      if (policy === "PRE_PAGO")
        await expect(page.getByText(/Estornado \(simulado\)/)).toBeVisible();
      expect(cancelled).toBe(1);
      await page.screenshot({ path: testInfo.outputPath("reserva-historico.png"), fullPage: true });
    });
  }
}
test("visitante precisa entrar e mantém o destino de reserva", async ({ page }) => {
  await page.goto("/tutor/agendar/partner");
  await expect(page).toHaveURL(/\/login/);
  expect(
    await page.evaluate(
      () => JSON.parse(sessionStorage.getItem("petplus_post_login_redirect") || "null")?.returnTo
    )
  ).toBe("/tutor/agendar/partner");
});
