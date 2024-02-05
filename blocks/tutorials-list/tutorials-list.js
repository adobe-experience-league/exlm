export default async function decorate(block) {
  const containerEl = block.querySelector('ul');
  const wrapperEl = containerEl?.parentElement;
  if (!wrapperEl) {
    return;
  }
  wrapperEl.classList.add('tutorials-list-box');
  containerEl.classList.add('tutorials-list-container');
  const tutorialHeader = block.parentElement?.previousElementSibling?.querySelector('h2');
  if (tutorialHeader) {
    tutorialHeader.classList.add('tutorials-list-header');
  }
}
