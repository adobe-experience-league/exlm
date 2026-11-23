import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/__faceted-search-heading-test', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html lang="en"><head><link rel="stylesheet" href="/styles/styles.css"><link rel="stylesheet" href="/scripts/faceted-search/faceted-search.css"></head><body><main></main></body></html>',
    }),
  );
  // Isolate heading behavior from authentication and remote search services.
  await page.route('**/scripts/auth/profile.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: 'export async function isSignedInUser() { return false; }' }),
  );
  await page.route('**/scripts/faceted-search/core/config.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `export default async function createContentConfig(config) {
        window.searchConfig = config;
        return {
          groups: [],
          labels: { filtersLabel: 'Filters' },
          source: { type: 'collection', loadItems: async () => [{ title: 'Search result' }] },
          renderItem: (element, item) => { element.textContent = item.title; },
        };
      }`,
    }),
  );
  await page.goto('/__faceted-search-heading-test');
});

[
  ['events-search', 'event', 'h2'],
  ['browse-courses', 'course', 'h3'],
  ['perspectives-search', 'perspective', 'h4'],
  ['playlist-browse', 'playlist', 'h5'],
].forEach(([blockName, contentType, headingType]) => {
  test(`${blockName} uses the shared authored heading`, async ({ page }) => {
    await page.evaluate(
      async ({ name, type }) => {
        const block = document.createElement('div');
        block.className = name;
        block.innerHTML = `<div><div>Heading</div><div>Browse all content</div></div>
          <div><div>Heading Type</div><div>${type}</div></div>
          <div><div>Obsolete filter label</div></div>`;
        document.querySelector('main').append(block);
        const { default: decorate } = await import(`/blocks/${name}/${name}.js`);
        await decorate(block);
      },
      { name: blockName, type: headingType },
    );
    await expect(page.locator(`${headingType}.fs-heading`)).toHaveText('Browse all content');
    await expect(page.locator('.fs-filters-heading')).toHaveText('Filters');
    await expect(page.locator('.fs-results-grid')).toHaveText('Search result');
    await expect(page.locator('div.fs-filters-column')).toHaveCount(1);
    await expect(page.locator('div.fs-results-column')).toHaveCount(1);
    await expect(page.locator('.fs-layout aside, .fs-layout nav, .fs-layout section, .fs-layout form')).toHaveCount(0);
    expect(await page.evaluate(() => window.searchConfig)).toMatchObject({ contentType, heading: true });
    expect(await page.evaluate(() => Object.hasOwn(window.searchConfig, 'filterLabel'))).toBe(false);
    expect(
      await page.locator('.fs-results-column').evaluate((column) => column.firstElementChild.matches('.fs-heading')),
    ).toBe(true);
  });
});

test('handles optional headings, legacy markup and disallowed heading types', async ({ page }) => {
  const cases = [
    { markup: '', expected: null },
    { markup: '<div><div></div></div><div><div>h3</div></div>', expected: null },
    { markup: '<div><div>Browse all content</div></div>', expected: 'h2' },
    {
      markup: '<div><div><h4>Browse all content</h4></div></div><div><div>Old filter label</div></div>',
      expected: 'h4',
    },
    {
      markup: '<div><div><h1>Browse all content</h1></div></div><div><div>h1</div></div>',
      expected: 'h2',
    },
    { markup: '<div><div>Browse all content</div></div><div><div>h6</div></div>', expected: 'h6' },
  ];
  await cases.reduce(async (previous, { markup, expected }) => {
    await previous;
    const result = await page.evaluate(async (html) => {
      const modulePath = '/scripts/faceted-search/faceted-search.js';
      const { createFacetedSearch } = await import(modulePath);
      const block = document.createElement('div');
      block.innerHTML = html;
      document.querySelector('main').replaceChildren(block);
      await createFacetedSearch(block, { contentType: 'event', heading: true });
      await createFacetedSearch(block, { contentType: 'event', heading: true });
      return {
        type: block.querySelector('.fs-heading')?.localName ?? null,
        h1Count: block.querySelectorAll('h1').length,
      };
    }, markup);
    expect(result).toEqual({ type: expected, h1Count: 0 });
  }, Promise.resolve());
});

test('preserves explicit heading configuration and heading type on redecoration', async ({ page }) => {
  const results = await page.evaluate(async () => {
    const modulePath = '/scripts/faceted-search/faceted-search.js';
    const { createFacetedSearch } = await import(modulePath);
    const block = document.createElement('div');
    document.querySelector('main').append(block);
    const readHeading = () => {
      const heading = block.querySelector('.fs-heading');
      return heading ? { text: heading.textContent, type: heading.localName } : null;
    };
    const rendered = [];
    await ['Explicit heading', '', false, undefined].reduce(async (previous, heading) => {
      await previous;
      block.innerHTML = '<div><div>Authored heading</div></div>';
      await createFacetedSearch(block, { contentType: 'event', heading, headingType: 'h6' });
      rendered.push(readHeading());
    }, Promise.resolve());
    block.innerHTML = '<div><div>Authored heading</div></div><div><div>h3</div></div>';
    await createFacetedSearch(block, { contentType: 'event', heading: true });
    await createFacetedSearch(block, { contentType: 'event', heading: true });
    rendered.push(readHeading());
    rendered.push({ count: block.querySelectorAll('.fs-heading').length });
    return rendered;
  });
  expect(results).toEqual([
    { text: 'Explicit heading', type: 'h6' },
    null,
    null,
    null,
    { text: 'Authored heading', type: 'h3' },
    { count: 1 },
  ]);
  const sizes = await page.evaluate(() => {
    const heading = document.querySelector('.fs-heading');
    const reference = document.createElement(heading.localName);
    reference.textContent = 'Reference';
    document.querySelector('main').append(reference);
    return [heading, reference].map((element) => getComputedStyle(element).fontSize);
  });
  expect(sizes[0]).toBe(sizes[1]);
});
