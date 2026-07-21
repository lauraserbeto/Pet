import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Apenas testes em src/ — evita colidir com os E2E do Playwright em e2e/.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
});
