import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração mínima de E2E. Sobe o build de produção via `vite preview`
 * e roda os testes de fumaça contra ele. Ver e2e/smoke.spec.ts.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // As jornadas reais sobem 14 APIs + Postgres ao lado dos workers. Com 5 (o
  // padrão nesta máquina) e com 3, workers caíam no meio e testes ficavam como
  // "did not run"; com 2, cinco execuções seguidas fecharam 101/101. O runner
  // do CI tem 4 vCPUs e carrega a mesma pilha, então vale o mesmo teto.
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Requer `npm run build` antes (o preview serve o dist/).
    command: "npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
