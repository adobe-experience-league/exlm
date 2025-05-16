import { CUSTOM_EVENTS, isUserClick } from './atomic-search-utils.js';

export default function atomicBreadBoxHandler(baseElement) {
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

  function attachListeners() {
    const parentWrapper = baseElement.shadowRoot.querySelector(`[part="breadcrumb-list"]`);
    if (!parentWrapper) {
      return;
    }
    const elements = parentWrapper.querySelectorAll('.breadcrumb');
    elements.forEach((element) => {
      if (!element.dataset.event) {
        element.dataset.event = true;
        const title = (element.firstElementChild?.title || '').toLowerCase();
        const facetKey = `${title.split(':')[1] || title}`.trim();
        element.dataset.facetkey = facetKey;
        const isParentKey = facetKey ? !facetKey.includes('|') : false;
        if (!isParentKey) {
          const [parentKey] = facetKey.split('|');
          element.dataset.parent = parentKey;
        }
        element.addEventListener('click', (e) => {
          if (!isUserClick(e)) {
            return;
          }
          const facetKeyValue = element.dataset.facetkey;
          const isParentElementClicked = facetKeyValue ? !facetKeyValue.includes('|') : false;
          if (isParentElementClicked) {
            // Remove all child keys.
            const childElements = parentWrapper.querySelectorAll(`.breadcrumb[data-parent="${facetKeyValue}"]`);
            childElements.forEach((childElement) => {
              if (childElement?.firstElementChild) {
                childElement.firstElementChild.click();
              }
            });
          } else {
            // Check and unselect parent.
            const parentKey = element.dataset.parent;
            const parentEl = parentWrapper.querySelector(`.breadcrumb[data-facetkey="${parentKey}"]`);
            if (parentEl?.firstElementChild) {
              parentEl.firstElementChild.click();
            }
          }
        });
      }
    });
  }

  function observeBreadboxUI(enabled) {
    const targetElement = baseElement.shadowRoot.querySelector(`[part="breadcrumb-list"]`);
    if (enabled) {
      const observer = new MutationObserver(() => {
        attachListeners();
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
        attachListeners();
      }
    });
  });

  function onResultsUpdate() {
    onFilterUpdate();
  }

  function hideSection() {
    baseElement.style.display = 'none';
  }

  function showSection() {
    baseElement.style.display = '';
  }

  document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate, { once: true });
  document.addEventListener(CUSTOM_EVENTS.NO_RESULT_FOUND, hideSection);
  document.addEventListener(CUSTOM_EVENTS.RESULT_FOUND, showSection);

  observer.observe(baseElement, { attributes: true, attributeFilter: ['class'], childList: true });
}
