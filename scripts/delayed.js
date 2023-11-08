// eslint-disable-next-line import/no-cycle
import {
  decorateIcons,
  getMetadata,
  loadCSS,
  sampleRUM,
} from './lib-franklin.js';
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
  const theme = getMetadata('theme');
  const isDocs = theme
    .split(',')
    .map((t) => t.toLowerCase())
    .includes('docs');

  if (isDocs) {
    loadCSS(`${window.hlx.codeBasePath}/styles/rail-styles.css`);
    await decorateRail(leftRail, 'left');
    await decorateRail(rightRail, 'right');
  }
}
await loadRails(document);
// Core Web Vitals RUM collection
sampleRUM('cwv');

// eslint-disable-next-line
import './prism.js';
