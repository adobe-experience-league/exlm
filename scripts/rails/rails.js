import { decorateIcons } from '../lib-franklin.js';

/**
 * Decorate rail section
 * @param {Element} railSection The rail section element
 * @param {'left'|'right'} position The rail position
 */
async function decorateRail(railSection, position) {
  // wrap content in a wrapper div
  const content = document.createElement('div');
  content.classList.add('rail-content');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        content.classList.toggle('is-stuck', !entry.isIntersecting);
      });
    },
    {
      threshold: 1,
    },
  );

  observer.observe(content);

  content.replaceChildren(...railSection.children);
  railSection.replaceChildren(content);

  // add toggle button
  const railToggler = document.createElement('button');
  railToggler.style.background = 'none'; // override default button styles
  railToggler.classList.add('rail-toggle');
  railToggler.setAttribute('aria-label', `Toggle ${position} rail`);
  railToggler.innerHTML = '<span class="icon icon-rail"></span>';
  railSection.classList.add('rail');
  railSection.classList.add(`rail-${position}`);
  railSection.prepend(railToggler);
  decorateIcons(railToggler);
  railToggler.addEventListener('click', () => {
    railSection.classList.toggle('closed');
    const main = railSection.parentElement;
    if (main) {
      main.classList.toggle(`rail-${position}-closed`);
    }
  });
}

/**
 * Builds three column grid layout with left/right toggle section
 * @param {Document} document The container element
 */
export default async function decorateRails() {
  const main = document.querySelector('main');
  const leftRail = document.querySelector('main .toc-container');
  const rightRail = document.querySelector('main .mini-toc-container');

  if (leftRail) {
    await decorateRail(leftRail, 'left');
  } else {
    main.classList.add('rail-left-closed');
  }

  if (rightRail) {
    await decorateRail(rightRail, 'right');
  } else {
    main.classList.add('rail-right-closed');
  }
}
