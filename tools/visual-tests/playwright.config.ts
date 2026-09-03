import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Repo root: aem-cli's `aem up` only recognizes a project if `.git` is in its cwd, and
// Playwright spawns webServer.command from the config file's directory by default.
const REPO_ROOT = path.resolve(__dirname, '../..');

export default defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: './test-results',
  reporter: [
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    // Structured per-test results (title/status/error/attachment paths) for tooling that
    // needs to report pass/fail per block or locate diff images without scraping stdout.
    ['json', { outputFile: './test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: {
      mode: 'retain-on-failure',
    },
    viewport: { width: 1280, height: 720 },
  },
  // Custom snapshot path to remove platform name from snapshot files
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--font-render-hinting=none', '--disable-font-subpixel-positioning', '--force-device-scale-factor=1'],
        },
      },
    },
  ],
  webServer: process.env.DOCKER
    ? undefined
    : {
        command: 'aem up',
        cwd: REPO_ROOT,
        // A plain port check, not `url`: aem-cli's reverse-proxied responses can carry both
        // Content-Length and Transfer-Encoding, which Node's strict HTTP client (used by the
        // `url` readiness check) rejects as malformed even though real browsers accept it fine.
        port: 3000,
        reuseExistingServer: !process.env.CI,
      },
});
