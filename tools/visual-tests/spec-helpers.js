/**
 * Shared runtime for the generated block visual specs (blocks/<block>/<block>.spec.js).
 *
 * Every generated test calls runBlockVisualTest(), which makes a block render deterministically
 * before it is screenshotted. It waits on real readiness signals instead of fixed sleeps:
 *   - third-party traffic (IMS, martech, Qualtrics, video players, remote images) is stubbed,
 *     so nothing loads or changes after the snapshot is taken
 *   - scripts/delayed.js (which fires on a 3s timer) is replaced with a no-op that only
 *     dispatches `delayed-load`, so Brand Concierge etc. can't race the screenshot
 *   - Date is frozen and Coveo calls are replayed from a committed HAR for data-driven blocks
 *   - before capturing, it waits for block decoration, fonts, images, loading shimmers,
 *     network idle and a stable layout. It waits again after the viewport resize and
 *     re-measures the box.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect } from '@playwright/test';

import {
  BLOCK_SNAPSHOT_READY_SELECTORS,
  BLOCK_SNAPSHOT_HIDE_SELECTORS,
  BLOCK_SNAPSHOT_EXTRA_WAIT,
  COVEO_MOCKED_BLOCKS,
  DEFAULT_LOADING_SELECTORS,
  SNAPSHOT_FIXED_TIME,
  THIRD_PARTY_ALLOWED_HOSTS,
} from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const READY_TIMEOUT = 20000;
const NETWORK_IDLE_MS = 300;
const STABLE_POLL_MS = 100;
const STABLE_SAMPLES = 4;
const LIBRARY_IFRAME_SELECTOR = 'sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe';

// 1x1 light-grey PNG used in place of any remote (non-dev-server) image.
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN89+7dfwAJWAPRVpGdMwAAAABJRU5ErkJggg==',
  'base64',
);
const PLACEHOLDER_DOCUMENT = '<!doctype html><html><body style="margin:0;background:#d3d3d3"></body></html>';

const SNAPSHOT_COMPARE_OPTIONS = {
  maxDiffPixels: 50,
  threshold: 0.05,
  maxDiffPixelRatio: 0.005,
};

// Applied inside the block iframe: kill transitions/animations and the text caret so the
// pixels don't depend on how far an animation had progressed at capture time.
const FREEZE_CSS = `
  *, *::before, *::after {
    transition: none !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
  }
`;

const harCache = new Map();

function loadHar(blockSlug) {
  if (!harCache.has(blockSlug)) {
    const harPath = path.join(__dirname, 'blocks', blockSlug, `${blockSlug}.har`);
    harCache.set(blockSlug, JSON.parse(fs.readFileSync(harPath, 'utf8')));
  }
  return harCache.get(blockSlug);
}

function harResponse(har, urlPart) {
  const entry = har.log.entries.find((harEntry) => harEntry.request.url.includes(urlPart));
  if (!entry) return null;
  const excludedHeaders = new Set(['content-encoding', 'content-length', 'transfer-encoding']);
  const headers = Object.fromEntries(
    entry.response.headers
      .filter((header) => !excludedHeaders.has(header.name.toLowerCase()))
      .map((header) => [header.name, header.value]),
  );
  return {
    status: entry.response.status,
    headers,
    contentType: entry.response.content.mimeType,
    body: entry.response.content.text || '',
  };
}

function fixedTimeFor(blockSlug) {
  if (COVEO_MOCKED_BLOCKS.includes(blockSlug)) {
    // Freeze "now" at recording time so date-relative labels (e.g. upcoming vs. live
    // events) match the canned Coveo data no matter when the test runs.
    const recordedAt = loadHar(blockSlug).log.entries[0]?.startedDateTime;
    if (recordedAt) return new Date(recordedAt);
  }
  return new Date(SNAPSHOT_FIXED_TIME);
}

/**
 * Tracks in-flight requests across the page and all its frames, so we can wait for a
 * real network-idle window instead of guessing with a sleep.
 */
function trackNetwork(page) {
  const pending = new Set();
  let lastActivity = Date.now();
  const onStart = (request) => {
    pending.add(request);
    lastActivity = Date.now();
  };
  const onEnd = (request) => {
    pending.delete(request);
    lastActivity = Date.now();
  };
  page.on('request', onStart);
  page.on('requestfinished', onEnd);
  page.on('requestfailed', onEnd);

  return async function waitForNetworkIdle(timeout = READY_TIMEOUT) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (pending.size === 0 && Date.now() - lastActivity >= NETWORK_IDLE_MS) return;
      await page.waitForTimeout(50);
    }
    const stuck = [...pending].map((request) => request.url()).slice(0, 5);
    throw new Error(`Network did not become idle within ${timeout}ms. Pending: ${stuck.join(', ')}`);
  };
}

async function installNetworkStubs(page, blockSlug) {
  // Registered first so the more specific routes below take precedence over it.
  await page.route('**/*', (route) => {
    const request = route.request();
    let host;
    try {
      host = new URL(request.url()).hostname;
    } catch (e) {
      return route.continue();
    }
    if (!host || THIRD_PARTY_ALLOWED_HOSTS.includes(host)) return route.continue();

    const type = request.resourceType();
    if (type === 'image') return route.fulfill({ status: 200, contentType: 'image/png', body: PLACEHOLDER_PNG });
    if (type === 'document')
      return route.fulfill({ status: 200, contentType: 'text/html', body: PLACEHOLDER_DOCUMENT });
    return route.abort('blockedbyclient');
  });

  // aem up injects a livereload client; saving any repo file mid-run would reload the page
  // and detach the block iframe under the test.
  await page.route('**/__internal__/livereload.js', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );

  // delayed.js runs on a 3s timer and injects Brand Concierge, Qualtrics, Gainsight, etc.
  // Keep the `delayed-load` contract some blocks listen for, drop everything else.
  await page.route('**/scripts/delayed.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: "window.dispatchEvent(new Event('delayed-load'));",
    }),
  );
  await page.route('**/scripts/brand-concierge/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: 'export default () => {};' }),
  );

  if (COVEO_MOCKED_BLOCKS.includes(blockSlug)) {
    const har = loadHar(blockSlug);
    // Replay recorded Coveo responses: live search results drift over time. Refresh with:
    //   node tools/visual-tests/record-coveo-har.js <block>
    const replay = (urlPart) => async (route) => {
      const response = harResponse(har, urlPart);
      if (response) await route.fulfill(response);
      else await route.abort('blockedbyclient');
    };
    await page.route('**/api/action/coveo-token**', replay('/api/action/coveo-token'));
    await page.route('**/rest/search/v2/values/batch**', replay('/rest/search/v2/values/batch'));
    await page.route(/\/rest\/search\/v2(\?|$)/, replay('/rest/search/v2'));
  }
}

async function installInitScripts(page) {
  // A signed-out IMS stub: scripts.js#loadIms() short-circuits when window.adobeIMS exists,
  // so blocks that check sign-in state resolve instantly instead of waiting on the 5s
  // IMS timeout once the real imslib is blocked.
  await page.addInitScript(() => {
    const ims = {
      isSignedInUser: () => false,
      getAccessToken: () => null,
      getProfile: () => Promise.resolve(null),
      signIn: () => {},
      signOut: () => {},
      initialize: () => {},
    };
    window.adobeIMS = new Proxy(ims, {
      get(target, prop) {
        if (prop in target || typeof prop === 'symbol' || prop === 'then') return target[prop];
        return () => undefined;
      },
    });
  });
}

async function getBlockFrame(page) {
  await page.waitForSelector('sidekick-library', { timeout: READY_TIMEOUT });
  const iframe = await page.waitForSelector(LIBRARY_IFRAME_SELECTOR, { timeout: READY_TIMEOUT });
  const frame = await iframe.contentFrame();
  if (!frame) throw new Error('Could not get block iframe content frame');
  return frame;
}

async function waitForBlockDecorated(frame, blockSelector) {
  await frame.waitForSelector(blockSelector, { timeout: READY_TIMEOUT, state: 'visible' });
  await frame.waitForFunction(
    () => {
      const blocks = [...document.querySelectorAll('main [data-block-status]')];
      const sections = [...document.querySelectorAll('main .section')];
      return (
        document.body.classList.contains('appear') &&
        blocks.length > 0 &&
        blocks.every((el) => el.dataset.blockStatus === 'loaded') &&
        sections.every((el) => !el.dataset.sectionStatus || el.dataset.sectionStatus === 'loaded') &&
        !!document.querySelector('link[href*="/styles/fonts.css"]') &&
        !!document.querySelector('link[href*="/styles/lazy-styles.css"]')
      );
    },
    null,
    { timeout: READY_TIMEOUT, polling: 50 },
  );
}

async function waitForLoadingIndicatorsGone(frame, blockSelector, loadingSelectors) {
  if (!loadingSelectors.length) return;
  try {
    await frame.waitForFunction(
      ({ selector, loading }) => {
        const blockEl = document.querySelector(selector);
        if (!blockEl) return false;
        return [...blockEl.querySelectorAll(loading)].every((el) => {
          const style = getComputedStyle(el);
          return el.getClientRects().length === 0 || style.visibility === 'hidden' || style.opacity === '0';
        });
      },
      { selector: blockSelector, loading: loadingSelectors.join(', ') },
      { timeout: READY_TIMEOUT, polling: 50 },
    );
  } catch (error) {
    throw new Error(
      `Block ${blockSelector} still shows a loading indicator (${loadingSelectors.join(
        ', ',
      )}) after ${READY_TIMEOUT}ms`,
    );
  }
}

async function waitForAssets(frame) {
  await frame.evaluate(async () => {
    // Lazy images below the fold would otherwise load (or not) depending on scroll/resize timing.
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = 'eager';
    });
    const images = [...document.images].filter((img) => img.getClientRects().length > 0);
    await Promise.all(
      images.map((img) =>
        img.complete
          ? img.decode().catch(() => {})
          : new Promise((resolve) => {
              img.addEventListener(
                'load',
                () =>
                  img
                    .decode()
                    .catch(() => {})
                    .then(resolve),
                { once: true },
              );
              img.addEventListener('error', resolve, { once: true });
            }),
      ),
    );
    // fonts.ready only covers faces already requested; a weight first used after this point
    // would still swap in late (font-display: swap). Load every declared face up front.
    await Promise.all([...document.fonts].map((face) => face.load().catch(() => {})));
    await document.fonts.ready;
  });
}

async function waitForStableLayout(frame, block, page) {
  let previous = '';
  let stableCount = 0;
  const deadline = Date.now() + READY_TIMEOUT;
  while (Date.now() < deadline) {
    const current = await frame.evaluate(
      (el) =>
        new Promise((resolve) => {
          requestAnimationFrame(() => {
            const rect = el.getBoundingClientRect();
            resolve(
              [rect.x, rect.y, rect.width, rect.height, document.documentElement.scrollHeight]
                .map((n) => Math.round(n))
                .join(','),
            );
          });
        }),
      block,
    );
    stableCount = current === previous ? stableCount + 1 : 0;
    if (stableCount >= STABLE_SAMPLES) return;
    previous = current;
    await page.waitForTimeout(STABLE_POLL_MS);
  }
  throw new Error(`Layout did not stabilise within ${READY_TIMEOUT}ms`);
}

async function settle({ page, frame, block, blockSelector, loadingSelectors, waitForNetworkIdle }) {
  await waitForLoadingIndicatorsGone(frame, blockSelector, loadingSelectors);
  await waitForNetworkIdle();
  await waitForAssets(frame);
  await waitForNetworkIdle();
  await waitForStableLayout(frame, block, page);
}

/**
 * Renders one block variation from the Sidekick Library at one viewport and compares it
 * against its committed baseline.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} options
 * @param {string} options.blockSlug block folder name, e.g. "curated-cards"
 * @param {string} options.url sidekick library URL for the variation
 * @param {{width: number, height: number}} options.viewport
 * @param {string} options.screenshotName baseline file name
 */
export default async function runBlockVisualTest(page, { blockSlug, url, viewport, screenshotName }) {
  const blockSelector = `.${blockSlug}`;
  const readyConfig = BLOCK_SNAPSHOT_READY_SELECTORS[blockSlug] || {};
  const loadingSelectors = [...DEFAULT_LOADING_SELECTORS, ...(readyConfig.hidden ? [readyConfig.hidden] : [])];
  const hideSelectors = BLOCK_SNAPSHOT_HIDE_SELECTORS[blockSlug] || [];

  await page.clock.setFixedTime(fixedTimeFor(blockSlug));
  await installInitScripts(page);
  await installNetworkStubs(page, blockSlug);
  const waitForNetworkIdle = trackNetwork(page);

  await page.setViewportSize(viewport);
  await page.goto(url);

  const frame = await getBlockFrame(page);
  await waitForBlockDecorated(frame, blockSelector);
  const block = await frame.waitForSelector(blockSelector, { timeout: READY_TIMEOUT, state: 'visible' });

  await frame.addStyleTag({
    content: `${FREEZE_CSS}${
      hideSelectors.length ? `${hideSelectors.join(', ')} { visibility: hidden !important; }` : ''
    }`,
  });
  await block.evaluate((el) => {
    el.style.overflow = 'visible';
    el.style.maxHeight = 'none';
  });

  const context = { page, frame, block, blockSelector, loadingSelectors, waitForNetworkIdle };
  await settle(context);

  // Grow (never shrink) the viewport so the whole block is on screen, then let it settle again:
  // the resize can swap responsive image sources and reflow vh-based layouts.
  await frame.evaluate(() => window.scrollTo(0, 0));
  const initialBox = await block.boundingBox();
  if (!initialBox) throw new Error(`Could not get bounding box for ${blockSelector}`);
  const neededHeight = Math.ceil(initialBox.y + initialBox.height);
  if (neededHeight > viewport.height) {
    await page.setViewportSize({ width: viewport.width, height: neededHeight });
    await settle(context);
  }

  const extraWait = BLOCK_SNAPSHOT_EXTRA_WAIT[blockSlug];
  if (extraWait) await page.waitForTimeout(extraWait);

  const box = await block.boundingBox();
  if (!box) throw new Error(`Could not get bounding box for ${blockSelector}`);
  const clip = {
    x: Math.max(0, Math.floor(box.x)),
    y: Math.max(0, Math.floor(box.y)),
    width: Math.round(box.width),
    height: Math.round(box.height),
  };

  const screenshot = await page.screenshot({ clip, animations: 'disabled', caret: 'hide', type: 'png' });
  expect(screenshot).toMatchSnapshot(screenshotName, SNAPSHOT_COMPARE_OPTIONS);
}
