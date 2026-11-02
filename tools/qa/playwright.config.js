import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './results/functional-artifacts',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  workers: 2,
  timeout: 30000,
  reporter: [['list'], ['html', { outputFolder: './results/functional-html', open: 'never' }]],
  use: {
    browserName: 'chromium',
    locale: 'en-US',
    timezoneId: 'UTC',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
