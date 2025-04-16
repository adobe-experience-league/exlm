import { isMobile } from '../header/header-utils.js';
import { waitForChildElement, debounce } from './atomicUtils.js';

export default function atomicSortDropdownHandler() {
  const atomicSortElement = document.querySelector('atomic-sort-dropdown');

  function updateSortUI() {
    atomicSortElement.style.cssText = isMobile() ? `width: 100vw; padding-left: 50px;` : '';
  }

  const initAtomicSortUI = () => {
    if (!atomicSortElement.shadowRoot) {
      waitForChildElement(atomicSortElement, initAtomicSortUI);
      return;
    }
    updateSortUI();
  };

  function onResize() {
    const isMobileView = isMobile();
    const view = isMobileView ? 'mobile' : 'desktop';
    if (view !== atomicSortElement.dataset.view) {
      atomicSortElement.dataset.view = view;
      updateSortUI();
    }
  }
  const debouncedResize = debounce(200, onResize);
  window.addEventListener('resize', debouncedResize);

  initAtomicSortUI();
}
