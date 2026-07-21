// eslint-disable-next-line import/no-cycle
import { loadCSS } from './lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import loadGainsight from './gainsight/gainsight.js';
import loadQualtrics from './qualtrics.js';
import { sendCoveoPageViewEvent } from './coveo-analytics.js';
import { loadPrism } from './utils/prism-utils.js';

// add more delayed functionality here

loadCSS(`${window.hlx.codeBasePath}/styles/print/print.css`);

loadPrism(document);

// disable martech if martech=off is in the query string, this is used for testing ONLY
if (window.location.search?.indexOf('martech=off') === -1) {
  loadGainsight();
  loadQualtrics();
  sendCoveoPageViewEvent();
}

/** Paths like /en/support, /fr/premium (communities use a separate origin). */
function isBrandConciergeExcludedPath() {
  const { pathname } = window.location;
  return /^\/[^/]+\/(support|premium)(\/|$)/i.test(pathname) || /^\/(support|premium)(\/|$)/i.test(pathname);
}

/**
 * Loads Brand Concierge on eligible page types.
 * Guards:
 *   - hidden on Support and Premium Learning routes
 */
async function loadBrandConcierge() {
  if (isBrandConciergeExcludedPath()) return;

  const { default: initBrandConcierge } = await import('./brand-concierge/brand-concierge.js');
  await initBrandConcierge();
}

loadBrandConcierge().catch((e) => {
  // eslint-disable-next-line no-console
  console.warn('[BC] failed to load:', e?.message || e);
});

window.dispatchEvent(new Event('delayed-load'));
