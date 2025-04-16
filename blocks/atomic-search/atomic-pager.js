import { CUSTOM_EVENTS, waitFor } from './atomicUtils.js';

export default function atomicPagerHandler() {
  const baseElement = document.querySelector('atomic-pager');

  function updateNavIconVisibility() {
    const previousElement = baseElement.shadowRoot.querySelector('[part="previous-button"]');
    const nextButton = baseElement.shadowRoot.querySelector('[part="next-button"]');
    previousElement.style.cssText = `visibility: ${previousElement.disabled ? 'hidden' : 'visible'}`;
    nextButton.style.cssText = `visibility: ${nextButton.disabled ? 'hidden' : 'visible'}`;
  }

  function initAtomicPagerUI() {
    if (!baseElement.shadowRoot || !baseElement.shadowRoot.firstElementChild) {
      waitFor(initAtomicPagerUI);
      return;
    }
    updateNavIconVisibility();
  }

  document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, () => {
    updateNavIconVisibility();
  });
  initAtomicPagerUI();
}
