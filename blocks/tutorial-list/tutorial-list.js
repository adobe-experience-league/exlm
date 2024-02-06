import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
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
      li.innerHTML = `<a href="${link}">${placeholders?.seeAllTutorials}</a>`;
    } else {
      li.innerHTML = `
        <p class="tutorial-list-heading">${title}</p>
        <p class="tutorial-list-description">${description}</p>
        <a href="${link}">${placeholders?.view}</a>
      `;
    }
  });
}
