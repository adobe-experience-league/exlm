import { isDocPage } from '../../scripts/scripts.js';

export default async function decorate(block) {
  if (!isDocPage('docs-solution-landing')) {
    return;
  }
  // execute only for solution doc pages.
  const containerEl = block.querySelector('ul');
  const wrapperEl = containerEl?.parentElement;
  if (!wrapperEl) {
    return;
  }
  wrapperEl.classList.add('list-box');
  containerEl.classList.add('list-container');
  const headerElement = block.parentElement?.previousElementSibling?.querySelector('h2');
  if (headerElement) {
    headerElement.classList.add('list-header');
    if (headerElement.parentElement) {
      headerElement.parentElement.classList.add('list-header-box');
    }
  }
}
