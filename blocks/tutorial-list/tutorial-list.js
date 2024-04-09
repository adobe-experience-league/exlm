import { createPlaceholderSpan, htmlToElement } from '../../scripts/scripts.js';

/**
 * @param {HTMLDivElement} block
 */
export default async function decorate(block) {
  const containerEl = block.querySelector('ul');
  const wrapperEl = containerEl?.parentElement;
  if (!wrapperEl) {
    return;
  }
  wrapperEl.classList.add('tutorial-list-box');
  containerEl.classList.add('tutorial-list-container');
  const tutorialHeader = document.querySelector('h2#tutorials');
  if (tutorialHeader) {
    tutorialHeader.classList.add('tutorial-list-header');
    if (tutorialHeader.parentElement) {
      tutorialHeader.parentElement.classList.add('tutorial-list-header-box');
    }
  }
  const listElements = containerEl.querySelectorAll('li');
  const lastIndex = listElements.length - 1;
  Array.from(listElements).forEach((li, index) => {
    const anchor = li.querySelector('a');
    const link = anchor.href;
    const title = anchor.textContent;
    li.removeChild(anchor);
    const description = li.textContent;
    if (index === lastIndex) {
      const a = document.createElement('a');
      a.href = link;
      a.appendChild(createPlaceholderSpan('seeAllTutorials', 'See all tutorials'));
      li.replaceChildren(a);
    } else {
      const p = htmlToElement(`<p class="tutorial-list-heading">${title}</p>`);
      const p2 = htmlToElement(`<p class="tutorial-list-description">${description}</p>`);
      const a = document.createElement('a');
      a.href = link;
      a.appendChild(createPlaceholderSpan('view', 'view'));
      li.replaceChildren(p, p2, a);
    }
  });
}
