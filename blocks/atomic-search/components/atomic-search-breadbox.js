import { CUSTOM_EVENTS, isUserClick, waitFor } from './atomic-search-utils.js';

export default function atomicBreadBoxHandler(baseElement) {
  let listObserver = null;
  let listObserveRetryPending = false;

  function updateFilterClearBtnStyles(enabled) {
    const clearBtn = document.querySelector('.clear-label');
    if (!clearBtn) return;
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

  /**
   * Atomic 3.13 toggled visibility via `.atomic-hidden` on the host.
   * Atomic 3.60+ (Lit) often leaves className empty and only swaps display / crumbs.
   * Drive Clear All from active breadcrumbs so both versions stay in sync with prod.
   */
  function hasActiveBreadcrumbs() {
    const list = baseElement.shadowRoot?.querySelector('[part="breadcrumb-list"]');
    if (!list) return false;
    return list.querySelectorAll('li.breadcrumb').length > 0;
  }

  function isBreadboxEnabled() {
    if (baseElement.className?.includes('atomic-hidden')) return false;
    return hasActiveBreadcrumbs();
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
          let [parentKey] = facetKey.split('|');
          // Handle format like "Community;Community|Ideas" -> extract "Community" as parent
          if (parentKey.includes(';')) {
            [parentKey] = parentKey.split(';');
          }
          element.dataset.parent = parentKey;
          const labelElement = element.querySelector('[part="breadcrumb-value"]');
          if (labelElement?.textContent?.includes('|')) {
            const splitLabel = labelElement.textContent.split('|');
            let parentType = splitLabel[0];
            const childType = splitLabel[1];
            // Remove "Community;" prefix from parent type for cleaner display
            if (parentType.includes(';')) {
              [parentType] = parentType.split(';');
            }
            labelElement.textContent = `${parentType.trim()} | ${childType.trim()}`;
          }
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

  function syncFromBreadcrumbs({ emitFilterUpdate = true } = {}) {
    const enabled = isBreadboxEnabled();
    updateFilterClearBtnStyles(enabled);
    if (enabled) {
      attachListeners();
    }
    if (emitFilterUpdate) {
      onFilterUpdate();
    }
  }

  function observeBreadcrumbList() {
    const targetElement = baseElement.shadowRoot?.querySelector(`[part="breadcrumb-list"]`);
    if (!targetElement) {
      // Retry until Lit mounts the breadcrumb list; coalesce concurrent retries.
      if (!listObserveRetryPending) {
        listObserveRetryPending = true;
        waitFor(() => {
          listObserveRetryPending = false;
          observeBreadcrumbList();
        });
      }
      return;
    }
    listObserveRetryPending = false;
    if (listObserver) {
      listObserver.disconnect();
    }
    listObserver = new MutationObserver(() => {
      syncFromBreadcrumbs();
    });
    listObserver.observe(targetElement, { childList: true, subtree: true });
    syncFromBreadcrumbs();
  }

  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        // Keep legacy Atomic 3.13 class-toggle path.
        syncFromBreadcrumbs();
        observeBreadcrumbList();
      }
      if (mutation.type === 'childList') {
        observeBreadcrumbList();
      }
    });
  });

  function onResultsUpdate() {
    syncFromBreadcrumbs();
  }

  function hideSection() {
    baseElement.style.display = 'none';
  }

  function showSection() {
    baseElement.style.display = '';
  }

  document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
  document.addEventListener(CUSTOM_EVENTS.NO_RESULT_FOUND, hideSection);
  document.addEventListener(CUSTOM_EVENTS.RESULT_FOUND, showSection);

  observer.observe(baseElement, { attributes: true, attributeFilter: ['class'], childList: true });
  observeBreadcrumbList();
}
