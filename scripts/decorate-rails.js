import { decorateIcons, getMetadata } from './lib-franklin.js';

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
  const railToggler = document.createElement('a');
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
 * @param {Element} main The container element
 */
export default async function decorateRails(main) {
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
    await decorateRail(leftRail, 'left');
    await decorateRail(rightRail, 'right');
  }
}
