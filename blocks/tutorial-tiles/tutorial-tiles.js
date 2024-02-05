export default async function decorate(block) {
  const containerEl = block.querySelector('ul');
  const wrapperEl = containerEl?.parentElement;
  if (!wrapperEl) {
    return;
  }
  wrapperEl.classList.add('tutorial-tiles-box');
  containerEl.classList.add('tutorial-tiles-container');
  const tutorialHeader = document.querySelector('h2#tutorials');
  if (tutorialHeader) {
    tutorialHeader.classList.add('tutorial-tiles-header');
    if (tutorialHeader.parentElement) {
      tutorialHeader.parentElement.classList.add('tutorial-tiles-header-box');
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
      li.innerHTML = `<a href="${link}">See All Tutorials</a>`;
    } else {
      li.innerHTML = `
        <p class="tutorial-tiles-heading">${title}</p>
        <p class="tutorial-tiles-description">${description}</p>
        <a href="${link}">View</a>
      `;
    }
  });
}
