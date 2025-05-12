import { CUSTOM_EVENTS } from './atomic-search-utils.js';

export default function atomicBreadBoxHandler(baseElement, placeholders) {
  function updateFilterClearBtnStyles(enabled) {
    const clearBtn = document.querySelector('.clear-label');
    if (enabled) {
      clearBtn.classList.add('clear-btn-enabled');
    } else {
      clearBtn.classList.remove('clear-btn-enabled');
    }
  }

  function updateAnsweredFacet(breadcrumb) {
    if (!breadcrumb) return;
    const breadcrumbButtons = breadcrumb.querySelectorAll('[part="breadcrumb-button"]');
    breadcrumbButtons?.forEach((button) => {
      const breadcrumbTitle = placeholders.searchAnsweredLabel || 'Answered:';
      if (button?.querySelector('[part="breadcrumb-label"]')?.textContent === breadcrumbTitle) {
        const breadcrumbValue = button?.querySelector('[part="breadcrumb-value"]');
        switch (breadcrumbValue?.textContent) {
          case 'false':
            breadcrumbValue.textContent = placeholders.searchUnresolvedLabel || 'Unresolved';
            break;
          case 'true':
            breadcrumbValue.textContent = placeholders.searchResolvedLabel || 'Resolved';
            break;
          default:
            break;
        }
      }
    });
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
        updateAnsweredFacet(targetElement);
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
        updateAnsweredFacet(baseElement.shadowRoot?.querySelector(`[part="breadcrumb-list"]`));
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

  observer.observe(baseElement, { attributes: true, attributeFilter: ['class'] });
}
