import { test, expect } from '@playwright/test';

['events-search', 'browse-courses', 'perspectives-search', 'playlist-browse'].forEach((blockName) => {
  test(`${blockName} shows the shared empty banner and clears search`, async ({ page }) => {
    await page.route('**/__faceted-search-empty-test', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<html lang="en"><head><link rel="stylesheet" href="/styles/styles.css"></head><body><main></main></body></html>',
      }),
    );
    await page.goto('/__faceted-search-empty-test');
    await page.addStyleTag({ url: `/blocks/${blockName}/${blockName}.css` });
    await page.evaluate(async (name) => {
      const modulePath = '/scripts/faceted-search/faceted-search.js';
      const { createFacetedSearch } = await import(modulePath);
      const block = document.createElement('div');
      block.className = name;
      document.querySelector('main').append(block);
      // Exercise the real controller and collection source without remote search dependencies.
      window.emptyStateSearch = await createFacetedSearch(block, {
        resultsPrefix: name,
        groups: [{ id: 'product', name: 'Product' }],
        source: {
          type: 'collection',
          loadItems: async () => [
            { title: 'Analytics course', product: 'Analytics' },
            { title: 'Commerce course', product: 'Commerce' },
          ],
        },
        renderItem: (element, item) => {
          element.textContent = item.title;
        },
      });
      window.emptyStateSearch.store.setGroup('product', ['Analytics']);
    }, blockName);
    await expect(page.locator(`.${blockName}-results-grid`)).toHaveText('Analytics course');
    await page.locator('.fs-keyword-input').fill('zzzz-no-match');
    await page.locator('.fs-keyword-input').press('Enter');

    const banner = page.locator('.fs-no-results');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('"zzzz-no-match"');
    await expect(banner.locator('.fs-no-results-clear')).toHaveText('Clear search');
    const appearance = await banner.evaluate((element) => {
      const style = getComputedStyle(element);
      const message = element.querySelector('p').getBoundingClientRect();
      const action = element.querySelector('a').getBoundingClientRect();
      return {
        display: style.display,
        background: style.backgroundColor,
        padding: Number.parseFloat(style.paddingTop),
        actionBelowMessage: action.top >= message.bottom,
      };
    });
    expect(appearance.display).toBe('flex');
    expect(appearance.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(appearance.padding).toBeGreaterThan(0);
    expect(appearance.actionBelowMessage).toBe(true);

    await banner.getByRole('link', { name: 'Clear search' }).click();
    await expect(banner).toBeHidden();
    await expect(page.locator(`.${blockName}-card-item`)).toHaveCount(2);
    await expect(page.locator('.fs-keyword-input')).toHaveValue('');
    expect(await page.evaluate(() => window.emptyStateSearch.store.get().filters.product)).toEqual([]);

    await page.evaluate(() => window.emptyStateSearch.store.setGroup('product', ['Missing']));
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Sorry, no results were found.');
    await banner.getByRole('link', { name: 'Clear search' }).click();
    await expect(banner).toBeHidden();
    await expect(page.locator(`.${blockName}-card-item`)).toHaveCount(2);
  });
});
