/**
 * Records a HAR fixture of a Coveo-backed block's network traffic, so its visual test can
 * replay real responses instead of hitting the live (and constantly changing) Coveo index.
 *
 * Usage:
 *   node tools/visual-tests/record-coveo-har.js [block-slug]
 *
 * With no argument, records every block listed in COVEO_MOCKED_BLOCKS (config.js).
 * Requires a running dev server (defaults to http://localhost:3000, override with BASE_URL)
 * and a generated spec file for the block (run generate-visual-tests.js first) so the
 * recorder knows which variation URLs to visit.
 *
 * Re-run this whenever a mocked block's query/params change and its visual snapshots need
 * to be refreshed against a new set of canned Coveo results.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

import { COVEO_MOCKED_BLOCKS, COVEO_HAR_URL_FILTER } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SELECTOR_TIMEOUT = 30000;
// Headers that must never end up committed in a fixture, even short-lived tokens.
const REDACTED_HEADERS = new Set(['authorization', 'cookie', 'set-cookie']);

function extractVariationPaths(specPath) {
  const content = fs.readFileSync(specPath, 'utf-8');
  const matches = [...content.matchAll(/page\.goto\('(\/tools\/sidekick\/library\.html\?[^']+)'\)/g)];
  return [...new Set(matches.map((match) => match[1]))];
}

function redactHar(harPath) {
  const har = JSON.parse(fs.readFileSync(harPath, 'utf-8'));
  har.log.entries.forEach((entry) => {
    ['request', 'response'].forEach((side) => {
      (entry[side]?.headers || []).forEach((header) => {
        if (REDACTED_HEADERS.has(header.name.toLowerCase())) {
          header.value = 'REDACTED';
        }
      });
    });
  });
  fs.writeFileSync(harPath, JSON.stringify(har, null, 2));
}

async function recordBlock(blockSlug) {
  const blockDir = path.join(__dirname, 'blocks', blockSlug);
  const specPath = path.join(blockDir, `${blockSlug}.spec.js`);
  if (!fs.existsSync(specPath)) {
    throw new Error(`No generated spec at ${specPath}. Run generate-visual-tests.js first.`);
  }

  const variationPaths = extractVariationPaths(specPath);
  if (variationPaths.length === 0) {
    throw new Error(`No variation URLs found in ${specPath}.`);
  }

  const harPath = path.join(blockDir, `${blockSlug}.har`);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordHar: { path: harPath, mode: 'minimal', urlFilter: COVEO_HAR_URL_FILTER },
  });
  const page = await context.newPage();

  try {
    for (let i = 0; i < variationPaths.length; i += 1) {
      const variationPath = variationPaths[i];
      console.log(`[${blockSlug}] Recording variation ${i + 1}/${variationPaths.length}: ${variationPath}`);

      await page.goto(`${BASE_URL}${variationPath}`);
      await page.waitForSelector('sidekick-library', { timeout: SELECTOR_TIMEOUT });

      const iframe = await page.waitForSelector(
        'sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe',
        { timeout: SELECTOR_TIMEOUT },
      );
      const frame = await iframe.contentFrame();
      if (!frame) throw new Error(`Could not get iframe content frame for ${variationPath}`);

      await frame.waitForSelector(`.${blockSlug}`, { timeout: SELECTOR_TIMEOUT, state: 'visible' });
      // Wait for the actual Coveo search response so the round trip is fully captured before
      // navigating to the next variation — a fixed sleep risks aborting a slow request mid-flight.
      await page.waitForResponse((res) => /\/rest\/search\/v2/.test(res.url()), { timeout: SELECTOR_TIMEOUT });
      // Small buffer for cards to paint after the response resolves.
      await page.waitForTimeout(1000);
    }
  } finally {
    await context.close();
    await browser.close();
  }

  redactHar(harPath);
  console.log(`[${blockSlug}] Recorded HAR fixture: ${harPath}`);
}

async function main() {
  const targets = process.argv[2] ? [process.argv[2]] : COVEO_MOCKED_BLOCKS;
  for (let i = 0; i < targets.length; i += 1) {
    await recordBlock(targets[i]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
