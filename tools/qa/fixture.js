import fs from 'fs/promises';
import path from 'path';
import { ROOT } from './select-tests.js';

const ORIGIN = 'http://qa.local';
const IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="90"%3E%3Crect width="160" height="90" fill="gray"/%3E%3C/svg%3E';

export default async function renderGrid(page, { variant = 'standard', header = true, cta = 'label' } = {}) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) return route.abort('blockedbyclient');
    if (url.pathname === '/fixture') {
      return route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html lang="en"><head><title>Grid cards QA fixture</title>
          <link rel="stylesheet" href="/styles/styles.css">
          <link rel="stylesheet" href="/blocks/grid-cards/grid-cards.css">
          </head><body class="appear"><main><div class="section grid-cards-container" data-section-status="loaded">
          <div class="grid-cards-wrapper"><div class="grid-cards block ${variant} cta-secondary ${
            header ? '' : 'no-header'
          }">
          <div><div>Explore</div></div><div><div><h1>Learning topics</h1></div></div>
          <div><div><p>Choose a topic.</p></div></div>
          ${[1, 2, 3]
            .map(
              (index) => `<div><div><h1>Topic ${index}</h1></div><div><p>Learn about topic ${index}.</p></div>
                <div><picture><img src='${IMAGE}' alt="Topic ${index} illustration"></picture></div>
                <div>${
                  cta === 'missing'
                    ? ''
                    : `<a href="#topic-${index}">${cta === 'raw' ? `#topic-${index}` : `Explore topic ${index}`}</a>`
                }</div></div>`,
            )
            .join('')}
          </div></div></div></main></body></html>`,
      });
    }
    // Click tracking is stubbed; these tests exercise card navigation, not the analytics integration.
    if (url.pathname === '/scripts/analytics/lib-analytics.js') {
      return route.fulfill({
        contentType: 'text/javascript',
        body: 'export const generateComponentID = () => "qa-grid"; export const pushComponentClick = () => {};',
      });
    }
    if (!/^\/(blocks|scripts|styles|icons|fonts)\//.test(url.pathname)) {
      return route.fulfill({ status: 404, body: 'Not part of the QA fixture.' });
    }
    const filename = path.resolve(ROOT, `.${decodeURIComponent(url.pathname)}`);
    if (!filename.startsWith(ROOT)) return route.abort('blockedbyclient');
    const contentTypes = {
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
    };
    try {
      return await route.fulfill({
        contentType: contentTypes[path.extname(filename)] || 'application/octet-stream',
        body: await fs.readFile(filename),
      });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return route.fulfill({ status: 404, body: 'Fixture resource not found.' });
    }
  });
  await page.goto(`${ORIGIN}/fixture?rum=off`);
  await page.evaluate(async (modulePath) => {
    const { default: decorate } = await import(modulePath);
    await decorate(document.querySelector('.grid-cards'));
  }, '/blocks/grid-cards/grid-cards.js');
  return errors;
}
