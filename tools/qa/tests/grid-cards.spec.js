import { test, expect } from '@playwright/test';
import renderGrid from '../fixture.js';

['standard', 'minimal', 'wide'].forEach((variant) => {
  test(`${variant}: headings, content, and keyboard navigation`, async ({ page }) => {
    const errors = await renderGrid(page, { variant });
    await expect(page.getByRole('heading', { level: 2, name: 'Learning topics' })).toBeVisible();
    await expect(page.locator('.grid-card')).toHaveCount(3);
    await expect(page.locator('.grid-card-title')).toHaveText(['Topic 1', 'Topic 2', 'Topic 3']);
    await expect(page.locator('.grid-card-description')).toHaveText([
      'Learn about topic 1.',
      'Learn about topic 2.',
      'Learn about topic 3.',
    ]);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
    const links = page.locator('.grid-card a');
    await expect(links).toHaveCount(3);
    await expect(links.first()).toHaveAccessibleName(variant === 'wide' ? /Topic 1/ : 'Explore topic 1');
    await expect(links.first()).toHaveAttribute('href', '#topic-1');
    await page.keyboard.press('Tab');
    await expect(links.first()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#topic-2$/);
    expect(errors).toEqual([]);
  });
});

test('no-header hides the header without dropping cards', async ({ page }) => {
  const errors = await renderGrid(page, { header: false });
  await expect(page.locator('.grid-cards-header')).toHaveCount(0);
  await expect(page.locator('.grid-card')).toHaveCount(3);
  expect(errors).toEqual([]);
});

['missing', 'raw'].forEach((cta) => {
  test(`standard: ${cta} CTA does not create an empty or URL-labelled button`, async ({ page }) => {
    const errors = await renderGrid(page, { cta });
    await expect(page.locator('.grid-card a')).toHaveCount(0);
    await expect(page.locator('.grid-card-title')).toHaveCount(3);
    expect(errors).toEqual([]);
  });
});

test('wide cards without a destination remain non-interactive', async ({ page }) => {
  const errors = await renderGrid(page, { variant: 'wide', cta: 'missing' });
  await expect(page.locator('.grid-card a')).toHaveCount(0);
  await expect(page.locator('.grid-card > div.grid-card-link')).toHaveCount(3);
  expect(errors).toEqual([]);
});

[
  { width: 320, columns: 1 },
  { width: 600, columns: 2 },
  { width: 900, columns: 3 },
  { width: 1440, columns: 3 },
].forEach(({ width, columns }) => {
  test(`standard: ${columns} columns at ${width}px without horizontal page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = await renderGrid(page);
    const measuredColumns = await page
      .locator('.grid-card-container')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(measuredColumns).toBe(columns);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
});
