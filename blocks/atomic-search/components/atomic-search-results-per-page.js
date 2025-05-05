import { CUSTOM_EVENTS, sleep, waitFor } from './atomic-search-utils.js';

export default function atomicResultPageHandler(baseElement) {
  function attachClickHandler(element) {
    if (!element || element.dataset.evented === 'true') {
      return;
    }
    element.addEventListener('click', () => {
      baseElement.dataset.scrolly = window.scrollY;
    });
    element.dataset.evented = 'true';
  }

  function scrollTo(scrollY) {
    window.scrollTo({
      top: scrollY,
      behavior: 'instant',
    });
    baseElement.dataset.scrolly = '';
  }

  function updatePagerUI() {
    const pageButtons = Array.from(baseElement.shadowRoot.querySelector('[part="buttons"]')?.children || []);
    pageButtons.forEach((buttonEl) => {
      attachClickHandler(buttonEl);
    });
    const scrollY = baseElement.dataset.scrolly ? +baseElement.dataset.scrolly : undefined;
    if (!Number.isNaN(scrollY)) {
      sleep(() => {
        scrollTo(0);
      });
    }
  }

  function initAtomicPageResultUI() {
    if (!baseElement.shadowRoot || !baseElement.shadowRoot.firstElementChild) {
      waitFor(initAtomicPageResultUI);
      return;
    }
    updatePagerUI();
  }

  document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, () => {
    updatePagerUI();
  });

  initAtomicPageResultUI();
}
