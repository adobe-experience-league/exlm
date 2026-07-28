// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Self-contained harness (no aem up required).
 * Optional live EDS checks: PLAYWRIGHT_LIVE=1 PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /playlist-embed\.spec\.js$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node tests/e2e/serve-harness.mjs',
    url: 'http://127.0.0.1:4173/tests/e2e/harness/index.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
