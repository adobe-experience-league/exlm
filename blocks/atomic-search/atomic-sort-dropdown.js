import { isMobile } from '../header/header-utils.js';
import { waitForChildElement, debounce } from './atomicUtils.js';

export default function atomicSortDropdownHandler() {
  const atomicSortElement = document.querySelector('atomic-sort-dropdown');

  function updateSortUI() {
    atomicSortElement.style.cssText = isMobile()
      ? `width: 100%; padding-left: 50px; display: flex; justify-content: flex-end`
      : '';
  }

  function updateSortPosition() {
    const desktopBase = document.querySelector('atomic-layout-section[section="query"]');
    const mobileBase = document.querySelector('atomic-layout-section[section="status"]');
    if (isMobile()) {
      const exists = !!mobileBase.querySelector('atomic-sort-dropdown');
      if (!exists) {
        mobileBase.appendChild(atomicSortElement);
      }
    } else {
      const exists = !!desktopBase.querySelector('atomic-sort-dropdown');
      if (!exists) {
        desktopBase.appendChild(atomicSortElement);
      }
    }
  }

  const initAtomicSortUI = () => {
    if (!atomicSortElement.shadowRoot) {
      waitForChildElement(atomicSortElement, initAtomicSortUI);
      return;
    }
    updateSortUI();
    updateSortPosition();
  };

  function onResize() {
    const isMobileView = isMobile();
    const view = isMobileView ? 'mobile' : 'desktop';
    if (view !== atomicSortElement.dataset.view) {
      atomicSortElement.dataset.view = view;
      updateSortUI();
      updateSortPosition();
    }
  }
  const debouncedResize = debounce(200, onResize);
  window.addEventListener('resize', debouncedResize);

  initAtomicSortUI();
}
