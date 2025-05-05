import { CUSTOM_EVENTS, sleep, waitFor } from './atomic-search-utils.js';

export default function atomicPagerHandler(baseElement) {
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
    const previousElement = baseElement.shadowRoot.querySelector('[part="previous-button"]');
    const nextButton = baseElement.shadowRoot.querySelector('[part="next-button"]');
    if (previousElement) {
      previousElement.style.cssText = `visibility: ${previousElement.disabled ? 'hidden' : 'visible'}`;
      attachClickHandler(previousElement);
    }
    if (nextButton) {
      nextButton.style.cssText = `visibility: ${nextButton.disabled ? 'hidden' : 'visible'}`;
      attachClickHandler(nextButton);
    }
    const pageButtons = Array.from(baseElement.shadowRoot.querySelector('[part="page-buttons"]')?.children || []);
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

  function initAtomicPagerUI() {
    if (!baseElement.shadowRoot || !baseElement.shadowRoot.firstElementChild) {
      waitFor(initAtomicPagerUI);
      return;
    }
    updatePagerUI();
  }

  document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, () => {
    updatePagerUI();
  });
  initAtomicPagerUI();
}
