// eslint-disable-next-line import/no-cycle
import { loadCSS, sampleRUM } from './lib-franklin.js';
// add more delayed functionality here

// Core Web Vitals RUM collection
sampleRUM('cwv');
const libAnalyticsModulePromise = import('./analytics/lib-analytics.js');

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

const launchPromise = loadScript(
  'https://assets.adobedtm.com/a7d65461e54e/6e9802a06173/launch-e6bd665acc0a-development.min.js',
  {
    async: true,
  },
);

Promise.all([launchPromise, libAnalyticsModulePromise]).then(
  // eslint-disable-next-line no-unused-vars
  ([launch, libAnalyticsModule]) => {
    const { pageLoadModel, linkClickModel } = libAnalyticsModule;
    window.adobeDataLayer.push(pageLoadModel());
    const linkClicked = document.querySelectorAll('a');
    linkClicked.forEach((linkElement) => {
      linkElement.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.tagName === 'A') {
          linkClickModel(e);
        }
      });
    });
  },
);

loadCSS(`${window.hlx.codeBasePath}/styles/print/print.css`);

loadPrism(document);
