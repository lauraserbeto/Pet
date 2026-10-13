import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: 'payment.spec.ts',
  use: { ...base.use, baseURL: 'http://localhost:4182' },
  webServer: {
    command: 'npm run preview -- --port 4182 --strictPort',
    url: 'http://localhost:4182',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
