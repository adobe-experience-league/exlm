import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/en/__faceted-search-list-layout-test', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html lang="en"><head></head><body class="appear"><main></main></body></html>',
    }),
  );
  await page.goto('/en/__faceted-search-list-layout-test');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addStyleTag({ url: '/styles/styles.css' });
  await page.addStyleTag({ url: '/scripts/browse-card/browse-card.css' });
  await page.addStyleTag({ url: '/scripts/browse-card/browse-cards-block.css' });
  await page.addStyleTag({ url: '/scripts/browse-card/browse-card-upcoming-events.css' });
  await page.addStyleTag({ url: '/blocks/events-search/events-search.css' });
  await page.addStyleTag({ url: '/blocks/upcoming-event-v2/upcoming-event-v2.css' });
});

['events-search', 'upcoming-event-v2'].forEach((blockName) => {
  test(`${blockName} upcoming list keeps speakers and actions without a tall footer`, async ({ page }) => {
    await page.evaluate((type) => {
      const block = document.createElement('div');
      block.className = `${type} events-v2${type === 'upcoming-event-v2' ? ' list' : ''}`;
      block.style.width = '952px';
      block.innerHTML = `<div class="events-search-results-body browse-cards-block list">
        <div class="browse-cards-block-content"><div class="events-search-card-item">
          <div class="browse-card event-upcoming-event-card">
            <div class="browse-card-figure">
              <div class="browse-card-banner">Upcoming event</div>
              <div class="card-figure-date">
                <div class="date-display">DEC 25</div><div class="time-display">08:00 AM UTC</div>
              </div>
            </div>
            <div class="browse-card-content">
              <div class="browse-card-tag-text">Analytics</div>
              <h3 class="browse-card-title-text">Upcoming analytics event</h3>
              <p class="browse-card-description-text">Learn about the latest analytics features.</p>
            </div>
            <div class="browse-card-footer">
              <div class="browse-card-event-info"><div class="browse-card-event-time"><h6>DEC 25 | 08:00 AM</h6></div></div>
              <div class="location-type"><span>Virtual</span></div>
              <a class="browse-card-cta-element" href="#register">Register</a>
              <div class="footer-speakers-section"><p class="speakers-heading">Speakers</p>
                <div class="speakers-list"></div>
              </div>
            </div>
          </div>
        </div></div>
      </div>`;
      document.querySelector('main').append(block);
      window.setListSpeakers = (names) => {
        block.querySelector('.speakers-list').replaceChildren(
          ...names.map((name) => {
            const item = document.createElement('div');
            item.className = 'speaker-item';
            item.innerHTML = `<div class="speaker-img-container"></div>
              <div class="speaker-info"><span class="speaker-name"></span></div>`;
            item.querySelector('.speaker-name').textContent = name;
            return item;
          }),
        );
      };
      window.setListSpeakers(['John', 'Karina']);
    }, blockName);
    const card = page.locator('.event-upcoming-event-card');
    await expect(card).toBeVisible();
    await expect.poll(() => card.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(260);
    await expect(page.locator('.speaker-name')).toHaveText(['John', 'Karina']);
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.locator('.location-type')).toBeVisible();
    await expect(page.locator('.speakers-list')).toHaveCSS('flex-direction', 'row');

    await page.evaluate(() => window.setListSpeakers(['John', 'Karina', 'Alice', 'Bob']));
    await expect(page.locator('.speaker-name')).toHaveText(['John', 'Karina', 'Alice', 'Bob']);
    await expect.poll(() => card.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(300);
    expect(
      await page.locator('.speakers-list').evaluate((list) => {
        const bounds = list.getBoundingClientRect();
        return [...list.children].every((item) => item.getBoundingClientRect().right <= bounds.right + 0.5);
      }),
    ).toBe(true);

    await page.evaluate((type) => {
      document.querySelector('.events-search-results-body').classList.remove('list');
      if (type === 'upcoming-event-v2') document.querySelector('.upcoming-event-v2').classList.remove('list');
    }, blockName);
    await expect
      .poll(() => card.evaluate((element) => element.getBoundingClientRect().height))
      .toBeGreaterThanOrEqual(450);
    await expect(page.locator('.footer-speakers-section')).not.toBeVisible();
  });
});
