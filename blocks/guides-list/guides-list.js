export default async function decorate(block) {
  const containerEl = block.querySelector('ul');
  const wrapperEl = containerEl?.parentElement;
  if (!wrapperEl) {
    return;
  }
  wrapperEl.classList.add('guide-list-wrap');
  containerEl.classList.add('guide-list-container');
  const guideHeader = document.querySelector('h2#guides');
  if (guideHeader) {
    guideHeader.classList.add('guide-list-header');
  }
}
