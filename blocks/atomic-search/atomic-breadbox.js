import { CUSTOM_EVENTS } from './atomicUtils.js';

export default function atomicBreadBoxHandler() {
  const baseElement = document.querySelector('atomic-breadbox');

  function updateFilterClearBtnStyles(enabled) {
    const clearBtn = document.querySelector('.clear-label');
    if (enabled) {
      clearBtn.classList.add('clear-btn-enabled');
    } else {
      clearBtn.classList.remove('clear-btn-enabled');
    }
  }

  function onFilterUpdate() {
    const event = new CustomEvent(CUSTOM_EVENTS.FILTER_UPDATED);
    document.dispatchEvent(event);
  }

  function observeBreadboxUI(enabled) {
    const targetElement = baseElement.shadowRoot.querySelector(`[part="breadcrumb-list"]`);
    if (enabled) {
      const observer = new MutationObserver(() => {
        onFilterUpdate();
      });
      observer.observe(targetElement, { childList: true });
    } else {
      onFilterUpdate();
    }
  }

  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const enabled = !baseElement.className.includes('atomic-hidden');
        updateFilterClearBtnStyles(enabled);
        observeBreadboxUI(enabled);
      }
    });
  });

  function onResultsUpdate() {
    onFilterUpdate();
  }

  document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate, { once: true });
  observer.observe(baseElement, { attributes: true, attributeFilter: ['class'] });
}
