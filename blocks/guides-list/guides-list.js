export default async function decorate(block) {
  const containerEl = block.querySelector('ul');
  const wrapperEl = containerEl?.parentElement;
  if (!wrapperEl) {
    return;
  }
  wrapperEl.classList.add('guide-list-box');
  containerEl.classList.add('guide-list-container');
  const guideHeader = block.parentElement?.previousElementSibling?.querySelector('h2');
  if (guideHeader) {
    guideHeader.classList.add('guide-list-header');
  }
}
