import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

const file = process.env.E33_FIXTURE;
const fixture = file ? JSON.parse(readFileSync(file, "utf8")) : null;
const api = "http://localhost:3333/api/v1";
// A página inicial pode deixar leituras em andamento após a última asserção.
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });
const targets: Record<number, { path: string; title: string; denied: string; forbidden: string }> =
  {
    1: {
      path: "/dashboard/usuarios?pagina=2#lista",
      title: "Usuários",
      denied: "/dashboard/orders",
      forbidden: "/providers/orders",
    },
    2: {
      path: "/dashboard/orders?pagina=2#lista",
      title: "Meus Pedidos",
      denied: "/dashboard/settings",
      forbidden: "/admin/metrics",
    },
    3: {
      path: "/dashboard/servicos?origem=login#lista",
      title: "Meus Serviços",
      denied: "/dashboard/products",
      forbidden: "/products/provider",
    },
    4: {
      path: "/dashboard/servicos?origem=login#lista",
      title: "Meus Serviços",
      denied: "/dashboard/orders",
      forbidden: "/providers/orders",
    },
    5: {
      path: "/tutor/pets?origem=login#lista",
      title: "Meus Pets",
      denied: "/dashboard/products",
      forbidden: "/products/provider",
    },
  };

async function login(
  page: import("@playwright/test").Page,
  account: { email: string; password: string }
) {
  await page.getByLabel(/^e-mail$/i).fill(account.email);
  await page.getByLabel(/^senha$/i).fill(account.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

for (const width of [1280, 390]) {
  for (const role of [1, 2, 3, 4, 5])
    test(`E33 real: perfil ${role}, ${width}px, retomada e negação`, async ({
      page,
      request,
    }, info) => {
      test.skip(!fixture, "Exige fixture E33 e API local em 3333.");
      test.setTimeout(90_000);
      const account = fixture.accounts.find(
        (a: { role: number; width: number; kind: string }) =>
          a.role === role && a.width === width && a.kind === "ready"
      );
      const target = targets[role];
      await page.setViewportSize({ width, height: 900 });
      await page.route(/^https:\/\/fonts\./, (route) => route.abort());
      let forbiddenCalls = 0,
        petsCalls = 0;
      await page.route("**/api/v1/**", async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith(target.forbidden)) forbiddenCalls++;
        if (url.pathname.endsWith("/users/me/pets")) petsCalls++;
        await route.fulfill({
          response: await route.fetch({
            url: api + url.pathname.replace(/^\/api\/v1/, "") + url.search,
            headers: { ...route.request().headers(), "x-forwarded-for": `10.33.${width === 390 ? 2 : 1}.${role}` },
          }),
        });
      });
      // Também exercita expiração real para admin e tutor, preservando query/hash no 401.
      if (role === 1 || role === 5)
        await page.addInitScript((a) => {
          if (!sessionStorage.getItem("e33-expired-initialized")) {
            sessionStorage.setItem("e33-expired-initialized", "yes");
            localStorage.setItem("petplus_user", JSON.stringify(a.user));
            localStorage.setItem("petplus_token", a.expiredToken);
          }
        }, account);
      await page.goto(target.path);
      await expect(page).toHaveURL(/\/login$/);
      await login(page, account);
      await expect(page).toHaveURL("http://localhost:4173" + target.path);
      await expect(page.getByRole("heading", { name: target.title, exact: true })).toBeVisible();
      // A evidência precisa incluir o resultado da API, não apenas o título durante o loader.
      if (role === 1) await expect(page.getByText(account.email, { exact: true }).first()).toBeVisible();
      else if (role === 2) await expect(page.getByRole("heading", { name: "Lista de Pedidos" })).toBeVisible();
      else if (role === 5) await expect(page.getByRole("heading", { name: "Nenhum pet cadastrado" })).toBeVisible();
      else await expect(page.getByText("Nenhum serviço cadastrado ainda", { exact: true })).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) if (node.nodeValue)
          node.nodeValue = node.nodeValue.replace(/[^\s@]+@[^\s@]+/g, "••••@••••");
      });
      await page.screenshot({
        path: info.outputPath("destino-retomado.png"),
        fullPage: true,
        animations: "disabled",
      });
      if (role !== 5) {
        if (width === 390) await page.getByRole("button", { name: /Abrir menu/i }).click();
        const products = page.getByRole("link", { name: "Meus Produtos", exact: true });
        await expect(products).toHaveCount(role === 2 ? 1 : 0);
        await expect(page.getByRole("link", { name: "Meus Serviços", exact: true })).toHaveCount(
          role === 3 || role === 4 ? 1 : 0
        );
      }
      await page.goto(target.denied);
      if (role === 5) await expect(page).toHaveURL(/\/tutor\/perfil$/);
      else await expect(page.getByRole("heading", { name: "Acesso Negado" })).toBeVisible();
      expect(forbiddenCalls).toBe(0);
      if (role !== 5) {
        const before = petsCalls;
        await page.goto("/tutor/pets");
        await expect(page).toHaveURL("http://localhost:4173/");
        expect(petsCalls).toBe(before);
        const denied = await request.get(api + "/admin/metrics", {
          headers: { Authorization: `Bearer ${account.token}` },
        });
        expect(denied.status()).toBe(role === 1 ? 200 : 403);
      }
    });

  test(`E33 real: sitter em revisão e legado inconsistente, ${width}px`, async ({ page }) => {
    test.skip(!fixture, "Exige fixture E33 e API local em 3333.");
    await page.setViewportSize({ width, height: 900 });
    let serviceCalls = 0;
    await page.route("**/api/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/providers/services")) serviceCalls++;
      await route.fulfill({
        response: await route.fetch({
          url: api + url.pathname.replace(/^\/api\/v1/, "") + url.search,
            headers: { ...route.request().headers(), "x-forwarded-for": `10.33.${width === 390 ? 2 : 1}.8` },
        }),
      });
    });
    for (const kind of ["pending", "inconsistent"]) {
      const account = fixture.accounts.find(
        (a: { width: number; kind: string }) => a.width === width && a.kind === kind
      );
      await page.goto("/login");
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.reload();
      await login(page, account);
      await expect(page).toHaveURL(/\/onboarding\/sitter$/);
      await expect(
        page.getByText(kind === "pending" ? "Avaliação em Análise" : "Painel ainda indisponível", {
          exact: true,
        })
      ).toBeVisible();
      await page.goto("/dashboard/servicos");
      await expect(page).toHaveURL(/\/onboarding\/sitter$/);
      await expect(
        page.getByText(kind === "pending" ? "Avaliação em Análise" : "Painel ainda indisponível", {
          exact: true,
        })
      ).toBeVisible();
      expect(serviceCalls).toBe(0);
    }
  });
}

test("E33 real: conta desativada apresenta o motivo correto no login", async ({ page }) => {
  test.skip(!fixture, "Exige fixture E33 e API local em 3333.");
  const account = fixture.accounts.find((a: { kind: string }) => a.kind === "disabled");
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({
      response: await route.fetch({
        url: api + url.pathname.replace(/^\/api\/v1/, "") + url.search,
          headers: { ...route.request().headers(), "x-forwarded-for": "10.33.3.9" },
      }),
    });
  });
  await page.goto("/login");
  await login(page, account);
  await expect(
    page.getByText("Conta desativada. Entre em contato com o suporte.", { exact: true }).first()
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Conta em análise", { exact: true })).toHaveCount(0);
});
