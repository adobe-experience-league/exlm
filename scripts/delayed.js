// eslint-disable-next-line import/no-cycle
import { loadCSS, sampleRUM, loadScript } from './lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import loadGainsight from './gainsight/gainsight.js';
import loadQualtrics from './qualtrics.js';
// add more delayed functionality here
// eslint-disable-next-line import/no-cycle
import { pageLoadModel, linkClickModel, pageName } from './analytics/lib-analytics.js';
// eslint-disable-next-line import/no-cycle
import { getPathDetails } from './scripts.js';

let launchScriptSrc = '';
if (window.location.host === 'eds-stage.experienceleague.adobe.com') {
  launchScriptSrc = 'https://assets.adobedtm.com/a7d65461e54e/6e9802a06173/launch-dbb3f007358e-staging.min.js';
} else if (window.location.host === 'experienceleague.adobe.com') {
  launchScriptSrc = 'https://assets.adobedtm.com/a7d65461e54e/6e9802a06173/launch-43baf8381f4b.min.js';
} else {
  launchScriptSrc = 'https://assets.adobedtm.com/a7d65461e54e/6e9802a06173/launch-e6bd665acc0a-development.min.js';
}

loadScript(launchScriptSrc);
loadScript(`/scripts/analytics/privacy-standalone.js`);

/**
 * one trust configuration setup
 */
function oneTrust() {
  window.fedsConfig = window.fedsConfig || {};
  window.fedsConfig.privacy = window.fedsConfig.privacy || {};
  window.fedsConfig.privacy.otDomainId = `7a5eb705-95ed-4cc4-a11d-0cc5760e93db${
    window.location.host.split('.').length === 3 ? '' : '-test'
  }`;
  window.fedsConfig.privacy.footerLinkSelector = '.footer [href="#onetrust"]';
}

oneTrust();
window.adobeDataLayer = [];
const { lang } = getPathDetails();
document.querySelector('[href="#onetrust"]').addEventListener('click', (e) => {
  e.preventDefault();
  window.adobePrivacy.showConsentPopup();
});
pageLoadModel(lang)
  .then((data) => {
    window.adobeDataLayer.push(data);
  })
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Error getting pageLoadModel:', e);
  });
localStorage.setItem('prevPage', pageName(lang));
const linkClicked = document.querySelectorAll('a,.view-more-less span, .language-selector-popover span');
linkClicked.forEach((linkElement) => {
  linkElement.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'SPAN') {
      linkClickModel(e);
    }
  });
});

// Core Web Vitals RUM collection
sampleRUM('cwv');

/**
 * Loads prism for syntax highlighting
 * @param {Document} document
 */
function loadPrism(document) {
  const highlightable = document.querySelector(
    'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code',
  );
  if (!highlightable) return; // exit, no need to load prism if nothing to highlight

  // see: https://prismjs.com/docs/Prism.html#.manual
  window.Prism = window.Prism || {};
  window.Prism.manual = true;
  import('./prism.js')
    .then(() => {
      // see: https://prismjs.com/plugins/autoloader/
      window.Prism.plugins.autoloader.languages_path = '/scripts/prism-grammars/';
      // run prism in async mode; uses webworker.
      window.Prism.highlightAll(true);
    })
    // eslint-disable-next-line no-console
    .catch((err) => console.error(err));
}

loadCSS(`${window.hlx.codeBasePath}/styles/print/print.css`);

loadPrism(document);
loadGainsight();
loadQualtrics();
