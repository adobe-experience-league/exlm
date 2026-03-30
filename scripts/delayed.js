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

async function isAdobeEmployee() {
  if (!window.adobeIMS?.isSignedInUser()) return false;
  try {
    const profile = await window.adobeIMS.getProfile();
    return profile?.email?.toLowerCase().endsWith('@adobe.com') === true;
  } catch {
    return false;
  }
}

/**
 * Loads Brand Concierge on eligible page types.
 * Guards:
 *   - ?bc=on         → must be present to enable BC at all (opt-in POC flag)
 *   - bcAuthRequired → when true, user must be signed in AND be an @adobe.com employee
 */
async function loadBrandConcierge() {
  if (!window.location.search?.includes('bc=on')) return;
  if (!isDocPage && !isHomePage) return;

  const { bcAuthRequired } = getConfig();
  if (bcAuthRequired) {
    await loadIms();
    if (!(await isAdobeEmployee())) return;
  }

  const { default: initBrandConcierge } = await import('./brand-concierge/brand-concierge.js');
  await initBrandConcierge();
}

loadBrandConcierge().catch((e) => {
  // eslint-disable-next-line no-console
  console.warn('[BC] failed to load:', e?.message || e);
});

window.dispatchEvent(new Event('delayed-load'));
