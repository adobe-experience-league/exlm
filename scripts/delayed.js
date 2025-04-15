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

window.dispatchEvent(new Event('delayed-load'));
