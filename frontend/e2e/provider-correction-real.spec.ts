import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

const file = process.env.E13_FIXTURE;
const fixture = file ? JSON.parse(readFileSync(file, "utf8")) : null;
const api = "http://localhost:3313/api/v1";

for (const width of [1280, 390])
  for (const role of [2, 3]) {
    test(`E-13 API/PostgreSQL reais: parceiro ${role}, ${width}px`, async ({
      page,
      request,
    }, info) => {
      test.skip(!fixture, "Exige fixture exclusiva E13_FIXTURE e API local em 3313.");
      test.setTimeout(90_000);
      const account = fixture.cases.find(
        (item: { width: number; role: number }) => item.width === width && item.role === role
      );
      const headers = { Authorization: `Bearer ${account.token}` };
      await page.setViewportSize({ width, height: 900 });
      await page.route(/^https:\/\/fonts\./, (route) => route.abort());
      let saves = 0,
        resubmits = 0;
      let failSave = true,
        failResubmit = true;
      const paths: string[] = [];
      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame()) paths.push(new URL(frame.url()).pathname);
      });
      await page.route("**/api/v1/**", async (route) => {
        const url = new URL(route.request().url());
        const method = route.request().method();
        if (url.pathname.endsWith("/providers/me") && method === "PUT") {
          saves++;
          if (failSave) {
            failSave = false;
            return route.fulfill({
              status: 503,
              json: {
                error: { code: "QA_UNAVAILABLE", message: "Falha temporária ao salvar (QA)." },
              },
            });
          }
        }
        if (url.pathname.endsWith("/providers/me/resubmit")) {
          resubmits++;
          if (failResubmit) {
            failResubmit = false;
            return route.fulfill({
              status: 503,
              json: {
                error: { code: "QA_UNAVAILABLE", message: "Falha temporária no reenvio (QA)." },
              },
            });
          }
        }
        await route.fulfill({
          response: await route.fetch({
            url: api + url.pathname.replace(/^\/api\/v1/, "") + url.search,
          }),
        });
      });
      // Hotel abre o link do e-mail; lojista entra diretamente pelo login.
      await page.goto(role === 3 ? "/parceiro/corrigir-cadastro" : "/login");
      await expect(page).toHaveURL(/\/login$/);
      await page.getByLabel(/^e-mail$/i).fill(account.email);
      await page.getByLabel(/^senha$/i).fill(account.password);
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await expect(page).toHaveURL(/\/parceiro\/corrigir-cadastro$/);
      await expect(page.getByRole("heading", { name: "Cadastro recusado" })).toBeVisible();
      expect(paths).not.toContain("/dashboard");
      expect((await request.get(api + "/providers/me/metrics", { headers })).status()).toBe(403);
      for (const invalid of [
        { label: "Estado", value: "ZZ", error: /Selecione uma UF válida/, valid: " go " },
        { label: "CEP", value: "123", error: /Informe um CEP válido/, valid: "74000-000" },
        {
          label: "Nome do negócio",
          value: " ",
          error: /nome de negócio entre/,
          valid: `Correção QA ${role}`,
        },
      ]) {
        await page.getByLabel(invalid.label, { exact: true }).fill(invalid.value);
        await page.getByRole("button", { name: /Salvar e reenviar/ }).click();
        await expect(page.getByText(invalid.error)).toBeVisible();
        expect(saves).toBe(0);
        await page.getByLabel(invalid.label, { exact: true }).fill(invalid.valid);
      }
      // A API continua sendo a autoridade: não aceita UF inválida nem fora do formulário.
      const invalidApi = await request.put(api + "/providers/me", {
        headers,
        data: { state: "ZZ" },
      });
      expect(invalidApi.status()).toBe(422);
      await page.getByRole("button", { name: /Salvar e reenviar/ }).click();
      await expect(
        page.getByRole("alert").filter({ hasText: "Falha temporária ao salvar" })
      ).toBeVisible();
      expect(resubmits).toBe(0);
      await page.getByRole("button", { name: /Salvar e reenviar/ }).click();
      await expect(
        page.getByRole("alert").filter({ hasText: /Correções salvas, mas o reenvio falhou/ })
      ).toBeVisible();
      expect((await (await request.get(api + "/providers/me", { headers })).json()).status).toBe(
        "REJEITADO"
      );
      expect(await page.getByLabel("Nome do negócio").inputValue()).toBe(`Correção QA ${role}`);
      await page.screenshot({
        path: info.outputPath("reenvio-pendente.png"),
        fullPage: true,
        animations: "disabled",
      });
      await page.getByRole("button", { name: /Salvar e reenviar/ }).click();
      await expect(page).toHaveURL("http://localhost:4173/");
      const provider = await (await request.get(api + "/providers/me", { headers })).json();
      expect(provider.status).toBe("EM_REVISAO");
      expect(provider.state).toBe("GO");
      expect(provider.zip_code).toBe("74000000");
      expect(provider.business_name).toBe(`Correção QA ${role}`);
      expect(resubmits).toBe(2);
      expect(saves).toBe(3);
      expect(
        await page.evaluate(() => JSON.parse(localStorage.getItem("petplus_user")!).provider_status)
      ).toBe("EM_REVISAO");
      expect((await request.get(api + "/providers/me/metrics", { headers })).status()).toBe(403);
      expect(
        (
          await request.post(api + "/auth/login", {
            data: { email: account.email, password: account.password },
          })
        ).status()
      ).toBe(403);
      await page.screenshot({
        path: info.outputPath("reenviado-em-analise.png"),
        fullPage: true,
        animations: "disabled",
      });
    });
  }
