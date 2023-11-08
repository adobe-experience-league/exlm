// eslint-disable-next-line import/no-cycle
import { decorateIcons, loadCSS, sampleRUM } from './lib-franklin.js';
import { isDocPage } from './utils.js';
// add more delayed functionality here

/**
 * Decorate rail section
 * @param {Element} railSection The rail section element
 * @param {'left'|'right'} position The rail position
 */
async function decorateRail(railSection, position) {
  // wrap content in a wrapper div
  const content = document.createElement('div');
  content.classList.add('rail-content');
  content.replaceChildren(...railSection.children);
  railSection.replaceChildren(content);

  // add toggle button
  const railToggler = document.createElement('button');
  railToggler.style.background = 'none'; // override default button styles
  railToggler.classList.add('rail-toggle');
  railToggler.innerHTML = '<span class="icon icon-rail"></span>';
  railSection.prepend(railToggler);
  await decorateIcons(railToggler);
  railToggler.addEventListener('click', () => {
    railSection.classList.toggle('closed');
  });
  railSection.classList.add('rail');
  railSection.classList.add(`rail-${position}`);
}

/**
 * Builds three column grid layout with left/right toggle section
 * @param {Document} document The container element
 */
async function loadRails(document) {
  const main = document.querySelector('main');
  // Get all child div elements
  const leftRail = main?.children[1];
  const rightRail = main?.children[2];
  // ensure this is the docs theme
  const isDocs = isDocPage();

  if (isDocs) {
    await loadCSS(`${window.hlx.codeBasePath}/styles/rail-styles.css`);
    decorateRail(leftRail, 'left');
    decorateRail(rightRail, 'right');
  }
}

/**
 * Loads prism for syntax highlighting
 * @param {*} document
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
      window.Prism.plugins.autoloader.languages_path =
        '/scripts/prism-grammars/';
      // run prism in async mode; uses webworker.
      window.Prism.highlightAll(true);
    })
    // eslint-disable-next-line no-console
    .catch((err) => console.error(err));
}

requestIdleCallback(() => loadRails(document));
requestIdleCallback(() => loadPrism(document));

// Core Web Vitals RUM collection
sampleRUM('cwv');

// eslint-disable-next-line
