// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';
// add more delayed functionality here

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

loadPrism(document);

// add more delayed functionality here
async function loadScript(src, parent, attrs) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`${parent} > script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      if (attrs) {
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const attr in attrs) {
          script.setAttribute(attr, attrs[attr]);
        }
      }
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    } else {
      resolve();
    }
  });
}

await loadScript(
  'https://assets.adobedtm.com/a7d65461e54e/6e9802a06173/launch-4114a6d5a42e-development.min.js',
  'head',
  { async: true },
);
