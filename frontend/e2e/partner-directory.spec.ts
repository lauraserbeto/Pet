import { test, expect } from "@playwright/test";

for (const route of ["hotels", "walkers"]) {
  for (const width of [375, 1280]) {
    test(`vitrine ${route} em ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route("**/api/v1/providers/**", async (request) => {
        const endpoint = request.request().url();
        if (endpoint.endsWith("/hotels") || endpoint.endsWith("/sitters")) {
          await request.fulfill({
            json: [
              {
                id: "alfa",
                business_name: "Alfa cuidados",
                city: "Anápolis",
                starting_price: "60",
                services: [{ id: "s1", name: "Cuidados em domicílio", is_active: true }],
              },
              {
                id: "beta",
                business_name: "Beta hospedagem",
                starting_price: 30,
                services: [{ id: "s2", name: "Hospedagem", is_active: true }],
              },
            ],
          });
        } else await request.continue();
      });
      await page.goto("/" + route);
      await expect(page.getByRole("article", { name: "Alfa cuidados" })).toBeVisible();
      await expect(page.getByText(/A partir de R\$\s*60,00/)).toBeVisible();
      await page.getByLabel("Ordenar por").selectOption("price");
      await expect(page.getByRole("article").first()).toHaveAttribute(
        "aria-label",
        "Beta hospedagem"
      );
      await page.getByLabel("Buscar por nome, local ou serviço").fill("Anápolis");
      await expect(page.getByRole("article")).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      ).toBeTruthy();
      await page.screenshot({ path: testInfo.outputPath("vitrine.png"), fullPage: true });
    });
  }
}
