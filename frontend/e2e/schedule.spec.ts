import { test, expect } from "@playwright/test";

test.use({ timezoneId: "America/Sao_Paulo" });
for (const role of [2, 5]) {
  test(`perfil ${role} não acessa a agenda diretamente pela URL`, async ({ page }) => {
    const user = {
      id: "other",
      role_id: role,
      full_name: "Outra conta",
      provider_status: "APROVADO",
    };
    await page.addInitScript((user) => {
      localStorage.setItem("petplus_user", JSON.stringify(user));
      localStorage.setItem("petplus_token", "test-token");
    }, user);
    let agendaRequests = 0;
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/appointments/provider")) agendaRequests++;
      await route.fulfill({ json: path.endsWith("/users/me") ? user : [] });
    });
    await page.goto("/dashboard/schedule");
    if (role === 2) {
      await expect(page).toHaveURL(/\/dashboard\/schedule$/);
      await expect(page.getByRole('heading', { name: 'Acesso Negado' })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/tutor\/perfil$/);
    }
    await expect(page.getByRole("region", { name: "Agenda do parceiro" })).toHaveCount(0);
    expect(agendaRequests).toBe(0);
  });
}

for (const role of [3, 4]) {
  test(`agenda real na interface: perfil ${role}, ${role === 3 ? "desktop" : "celular"}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: role === 3 ? 1280 : 390, height: 900 });
    await page.clock.setFixedTime(new Date("2026-11-16T12:00:00Z"));
    const user = {
      id: "partner",
      role_id: role,
      full_name: "Parceiro Teste",
      provider_status: "APROVADO",
      onboarding_step: "COMPLETED",
    };
    await page.addInitScript((user) => {
      localStorage.setItem("petplus_user", JSON.stringify(user));
      localStorage.setItem("petplus_token", "test-token");
    }, user);
    const base = {
      provider_id: "p",
      service_id: "s",
      pet_id: "pet",
      total_price: 100,
      start_time: "2026-11-16T17:00:00Z",
      end_time: "2026-11-16T18:30:00Z",
      pet: { id: "pet", name: "Rex", tutor: { full_name: "Laura Teste" } },
      provider: { business_name: "Parceiro Teste" },
    };
    const paid = { id: "payment", status: "APPROVED", amount: 100, simulated: true };
    let items = [
      {
        ...base,
        id: "onsite",
        service: { name: "Presencial", category: "SITTING" },
        status: "PENDENTE",
        payment_policy: "PRESENCIAL",
        payment: null,
      },
      {
        ...base,
        id: "paid",
        service: { name: "Pré-pago", category: "BOARDING" },
        status: "AGUARDANDO_CONFIRMACAO",
        payment_policy: "PRE_PAGO",
        payment: paid,
      },
      {
        ...base,
        id: "unpaid",
        service: { name: "Não pago", category: "BOARDING" },
        status: "PENDENTE",
        payment_policy: "PRE_PAGO",
        payment: null,
      },
      {
        ...base,
        id: "started",
        service: { name: "Em atendimento", category: "SITTING" },
        status: "CONFIRMADO",
        payment_policy: "PRESENCIAL",
        payment: null,
        start_time: "2026-11-16T10:00:00Z",
      },
      {
        ...base,
        id: "stay",
        service: { name: "Hospedagem em curso", category: "BOARDING" },
        status: "CONCLUIDO",
        payment_policy: "PRESENCIAL",
        payment: null,
        start_time: "2026-11-15T23:30:00-03:00",
        end_time: "2026-11-17T00:00:00-03:00",
      },
    ];
    const changes: string[] = [];
    await page.route("**/api/v1/**", async (route) => {
      const request = route.request(),
        path = new URL(request.url()).pathname;
      if (path.endsWith("/users/me")) return route.fulfill({ json: user });
      if (path.endsWith("/appointments/provider")) return route.fulfill({ json: items });
      if (/\/appointments\/[^/]+\/status$/.test(path)) {
        const id = path.split("/").at(-2),
          status = request.postDataJSON().status;
        changes.push(status);
        items = items.map((item) =>
          item.id !== id
            ? item
            : {
                ...item,
                status,
                payment:
                  item.payment && ["RECUSADO", "CANCELADO"].includes(status)
                    ? { ...item.payment, status: "REFUNDED" }
                    : item.payment,
              }
        );
        return route.fulfill({ json: items.find((item) => item.id === id) });
      }
      if (/\/appointments\/[^/]+$/.test(path))
        return route.fulfill({ json: items.find((item) => item.id === path.split("/").at(-1)) });
      return route.fulfill({ json: { isComplete: true, missingFields: [] } });
    });
    await page.goto("/dashboard/schedule");
    const schedule = page.getByRole("region", { name: "Agenda do parceiro" });
    await expect(schedule.getByText("Aguardando pagamento do tutor")).toBeVisible();
    await expect(
      schedule.getByRole("article", { name: "Não pago", exact: true }).getByRole("button")
    ).toHaveCount(0);
    await expect(schedule.getByText("Atendimento iniciado em dia anterior.")).toBeVisible();
    const onsite = schedule.getByRole("article", { name: "Presencial", exact: true });
    await onsite.getByRole("button", { name: "Confirmar", exact: true }).click();
    await page.getByRole("button", { name: "Confirmar atendimento", exact: true }).click();
    await expect(onsite.getByText("Confirmado", { exact: true })).toBeVisible();
    await expect(onsite.getByRole("button", { name: "Concluir", exact: true })).toHaveCount(0);
    await onsite.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("button", { name: "Cancelar atendimento", exact: true }).click();
    await expect(onsite.getByText("Cancelado", { exact: true })).toBeVisible();
    const prepaid = schedule.getByRole("article", { name: "Pré-pago", exact: true });
    await prepaid.getByRole("button", { name: "Recusar", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("estorno integral simulado");
    await page.getByRole("button", { name: "Recusar solicitação" }).click();
    await expect(prepaid.getByText(/Estornado/)).toBeVisible();
    const started = schedule.getByRole("article", { name: "Em atendimento" });
    await expect(started.getByRole("button", { name: "Cancelar", exact: true })).toHaveCount(0);
    await started.getByRole("button", { name: "Concluir", exact: true }).click();
    await page.getByRole("button", { name: "Concluir atendimento", exact: true }).click();
    await expect(started.getByText("Concluído", { exact: true })).toBeVisible();
    expect(changes).toEqual(["CONFIRMADO", "CANCELADO", "RECUSADO", "CONCLUIDO"]);
    await schedule.getByRole("combobox", { name: "Status" }).selectOption("RECUSADO");
    await expect(schedule.getByRole("article")).toHaveCount(1);
    await schedule.getByRole("combobox", { name: "Status" }).selectOption("all");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.screenshot({ path: testInfo.outputPath("agenda-dia.png"), fullPage: true });
    await schedule.getByRole("button", { name: "Próximo dia", exact: true }).click();
    await expect(schedule.getByText("Nenhum agendamento neste dia.")).toBeVisible();
    await schedule.getByRole("button", { name: "Semana", exact: true }).click();
    await expect(
      schedule.getByRole("region", { name: "16/11/2026" }).getByRole("article")
    ).toHaveCount(5);
    await schedule.getByRole("button", { name: "Próxima semana" }).click();
    await expect(schedule.getByText("Nenhum agendamento neste período.")).toBeVisible();
  });
}
