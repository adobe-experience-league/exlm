import { waitFor, CUSTOM_EVENTS, observeShadowRoot } from './atomic-search-utils.js';

export default function atomicNoResultHandler(block) {
  const baseElement = block.querySelector('atomic-no-results');
  if (baseElement && !baseElement.dataset.observed) {
    waitFor(() => {
      if (!baseElement.dataset.observed) {
        baseElement.dataset.observed = 'true';

        const toggleResultHeaderClass = (add) => {
          const layoutSectionEl = block.querySelector('atomic-layout-section[section="results"]');
          const resultHeader = layoutSectionEl?.querySelector('.result-header-section');
          if (resultHeader) {
            resultHeader.classList.toggle('result-header-inactive', add);
          }
        };

        observeShadowRoot(baseElement, {
          onPopulate: () => {
            toggleResultHeaderClass(true);
            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.NO_RESULT_FOUND));
          },
          onClear: () => {
            toggleResultHeaderClass(false);
            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.RESULT_FOUND));
          },
        });
      }
    }, 300);
  }
}
