// eslint-disable-next-line import/no-cycle
import { loadCSS } from './lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import loadGainsight from './gainsight/gainsight.js';
import loadQualtrics from './qualtrics.js';
import { sendCoveoPageViewEvent } from './coveo-analytics.js';
import { loadPrism } from './utils/prism-utils.js';
// eslint-disable-next-line import/no-cycle
import { getConfig, isDocPage, isHomePage, loadIms } from './scripts.js';

// add more delayed functionality here

loadCSS(`${window.hlx.codeBasePath}/styles/print/print.css`);

loadPrism(document);

// disable martech if martech=off is in the query string, this is used for testing ONLY
if (window.location.search?.indexOf('martech=off') === -1) {
  loadGainsight();
  loadQualtrics();
  sendCoveoPageViewEvent();
}

/**
 * Loads Brand Concierge on eligible page types.
 * Guards:
 *   - ?bc=off  → skip entirely (for Lighthouse / page-speed audits)
 *   - page type → only doc pages and the homepage by default
 *   - bcAuthRequired → when true, waits for IMS and skips unauthenticated users
 */
async function loadBrandConcierge() {
  if (window.location.search?.includes('bc=off')) return;
  if (!isDocPage && !isHomePage) return;

  const { bcAuthRequired } = getConfig();
  if (bcAuthRequired) {
    // await the shared window.imsLoaded promise — does not re-trigger the script load
    await loadIms();
    if (!window.adobeIMS?.isSignedInUser()) return;
  }

  const { default: initBrandConcierge } = await import('./brand-concierge/brand-concierge.js');
  await initBrandConcierge();
}

loadBrandConcierge();

window.dispatchEvent(new Event('delayed-load'));
