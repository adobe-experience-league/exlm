/**
 * EXLM-5422 Playlist product-embed — QA / PM / business test matrix (Playwright harness)
 *
 * | ID | Persona lens | Scenario | Expected |
 * |----|--------------|----------|----------|
 * | P1 | Business | Normal playlist (no embed) | Full chrome stubs; no CTA |
 * | P2 | CXO / product | ?embed=1 | Chrome-less; fixed CTA bottom-right |
 * | P3 | Security | Non-playlist path + embed=1 | Ignored |
 * | P4 | UX | Embed desktop layout | CTA not a main grid child; 2-col grid |
 * | P5 | Attribution | Switch video | CTA href has video=N, no embed= |
 * | P6 | Responsive | Mobile viewport | CTA fixed toward bottom-right |
 * | P7 | Parent origin | framed + experience-stage wildcard | Embed without embed=1 |
 * | P8 | Safety | Top-level allowlisted referrer | No embed (not framed) |
 * | P9 | Chrome | Embed hides site-wide banner aside | aside hidden |
 *
 * Unit wildcards: scripts/utils/playlist-embed-utils.test.js
 */

import { test, expect } from '@playwright/test';

const HARNESS = '/tests/e2e/harness/index.html';

test.describe('EXLM-5422 playlist embed harness', () => {
  test('P1: normal playlist keeps chrome and has no attribution CTA', async ({ page }) => {
    await page.goto(`${HARNESS}?path=/en/playlists/demo`);
    await page.waitForFunction(() => document.documentElement.dataset.harnessReady === '1');
    await expect(page.locator('body')).not.toHaveClass(/playlist-embed-mode/);
    await expect(page.locator('.playlist-embed-attribution')).toHaveCount(0);
    await expect(page.getByTestId('site-header')).toBeVisible();
  });

  test('P2: embed=1 applies chrome-less mode and fixed CTA', async ({ page }) => {
    await page.goto(`${HARNESS}?path=/en/playlists/demo&embed=1`);
    await page.waitForFunction(() => document.documentElement.dataset.harnessReady === '1');
    await expect(page.locator('body')).toHaveClass(/playlist-embed-mode/);
    const cta = page.locator('.playlist-embed-attribution-link');
    await expect(cta).toBeVisible();
    await expect(page.locator('.playlist-embed-attribution')).toHaveCSS('position', 'fixed');
    await expect(page.locator('body.playlist-embed-mode > header')).toBeHidden();
    await expect(page.locator('body.playlist-embed-mode > aside')).toBeHidden();
  });

  test('P3: embed=1 on non-playlist is ignored', async ({ page }) => {
    await page.goto(`${HARNESS}?path=/en/home&embed=1`);
    await page.waitForFunction(() => document.documentElement.dataset.harnessReady === '1');
    await expect(page.locator('body')).not.toHaveClass(/playlist-embed-mode/);
    await expect(page.locator('.playlist-embed-attribution')).toHaveCount(0);
  });

  test('P4: embed desktop keeps CTA outside main grid', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${HARNESS}?path=/en/playlists/demo&embed=1`);
    await page.waitForFunction(() => document.documentElement.dataset.harnessReady === '1');
    const cols = await page.locator('main.playlist-page').evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(cols.split(' ').filter(Boolean).length).toBeGreaterThanOrEqual(2);
    await expect(page.locator('main .playlist-embed-attribution')).toHaveCount(0);
    await expect(page.locator('body > .playlist-embed-attribution')).toHaveCount(1);
  });

  test('P5: CTA href tracks active video and strips embed', async ({ page }) => {
    await page.goto(`${HARNESS}?path=/en/playlists/demo&embed=1`);
    await page.waitForFunction(() => document.documentElement.dataset.harnessReady === '1');
    await page.locator('.playlist-item[data-index="2"]').click();
    await expect
      .poll(async () => page.locator('.playlist-embed-attribution-link').getAttribute('href'))
      .toMatch(/video=2/);
    const href = await page.locator('.playlist-embed-attribution-link').getAttribute('href');
    expect(href).not.toContain('embed=');
  });

  test('P6: embed mobile keeps CTA toward bottom-right', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${HARNESS}?path=/en/playlists/demo&embed=1`);
    await page.waitForFunction(() => document.documentElement.dataset.harnessReady === '1');
    const box = await page.locator('.playlist-embed-attribution').boundingBox();
    const viewport = page.viewportSize();
    expect(box).toBeTruthy();
    expect(box.x + box.width).toBeGreaterThan(viewport.width * 0.5);
    expect(box.y + box.height).toBeGreaterThan(viewport.height * 0.7);
  });

  test('P7: framed wildcard stage parent enables embed without embed=1', async ({ page }) => {
    await page.goto(
      `${HARNESS}?path=/en/playlists/demo&framed=1&parent=${encodeURIComponent('https://experience-stage.adobe.com')}`,
    );
    await page.waitForFunction(() => document.documentElement.dataset.harnessReady === '1');
    await expect(page.locator('body')).toHaveClass(/playlist-embed-mode/);
  });

  test('P8: allowlisted referrer without frame does not enable embed', async ({ page }) => {
    await page.goto(
      `${HARNESS}?path=/en/playlists/demo&framed=0&referrer=${encodeURIComponent('https://experience.adobe.com/x')}`,
    );
    await page.waitForFunction(() => document.documentElement.dataset.harnessReady === '1');
    await expect(page.locator('body')).not.toHaveClass(/playlist-embed-mode/);
  });

  test('P9: normal playlist keeps site-wide banner visible', async ({ page }) => {
    await page.goto(`${HARNESS}?path=/en/playlists/demo`);
    await page.waitForFunction(() => document.documentElement.dataset.harnessReady === '1');
    await expect(page.getByTestId('site-banner')).toBeVisible();
  });
});
