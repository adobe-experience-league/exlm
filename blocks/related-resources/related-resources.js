export default async function decorate(block) {
  const containerEl = block.querySelector('ul');
  const wrapperEl = containerEl?.parentElement;
  if (!wrapperEl) {
    return;
  }
  const blockParent = block.parentElement;
  wrapperEl.classList.add('related-resources-wrap');
  containerEl.classList.add('related-resources-container');
  const headerElement = blockParent?.previousElementSibling?.querySelector('h2');
  if (headerElement) {
    headerElement.classList.add('related-resources-header');
    if (headerElement.parentElement) {
      headerElement.parentElement.classList.add('related-resources-header-wrap');
    }
  }
}
