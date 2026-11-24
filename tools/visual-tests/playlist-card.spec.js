import { expect, test } from '@playwright/test';

test('playlist links resolve on normal pages when codeBasePath is empty', async ({ page }) => {
  await page.goto('/tools/sidekick/library.html?plugin=blocks', { waitUntil: 'domcontentloaded' });
  const link = await page.evaluate(async () => {
    const moduleUrl = new URL('/scripts/faceted-search/components/cards.js', window.location.origin).href;
    const { renderPlaylistCard } = await import(moduleUrl);
    const previousCodeBasePath = window.hlx.codeBasePath;
    window.hlx.codeBasePath = '';
    try {
      const wrapper = document.createElement('div');
      await renderPlaylistCard(wrapper, { title: 'Test playlist', path: '/test-playlist' });
      return wrapper.querySelector('a[href]')?.href;
    } finally {
      window.hlx.codeBasePath = previousCodeBasePath;
    }
  });
  expect(link).toBe(new URL('/test-playlist', page.url()).href);
});
