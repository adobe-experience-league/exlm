import { waitForChildElement, debounce, CUSTOM_EVENTS, isMobile, waitFor } from './atomic-search-utils.js';

const orderedFacetIds = ['facetContentType', 'facetStatus', 'facetProduct', 'facetRole', 'facetDate'];
const FACET_MODAL_SCROLL_OFFSET = 60;
const FACET_MODAL_LAYOUT_DELAY_MS = 20;

function ensureFacetModalInView(modal) {
  if (!isMobile() || !modal) return;
  const { top } = modal.getBoundingClientRect();
  const targetTop = top + window.scrollY - FACET_MODAL_SCROLL_OFFSET;
  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: 'instant',
  });
}

export default function atomicFacetManagerHandler(baseElement) {
  let debounceTimer;

  baseElement.dataset.view = isMobile() ? 'mobile' : 'desktop';

  const reorderFacets = () => {
    const currentOrder = Array.from(baseElement.querySelectorAll('atomic-facet,atomic-timeframe-facet')).map(
      (el) => el.id,
    );
    const isCorrectOrder = orderedFacetIds.every((id, index) => currentOrder[index] === id);
    if (isCorrectOrder) return;

    const facetsInOrder = orderedFacetIds.map((id) => document.getElementById(id)).filter(Boolean);
    facetsInOrder.forEach((facet) => {
      baseElement.appendChild(facet);
    });
  };

  function positionModal(modal) {
    const referenceElement = document.querySelector('atomic-sort-dropdown');
    if (!modal || !referenceElement) return;

    const positionValue = referenceElement.getBoundingClientRect().bottom;
    const delta = 10;
    const topValue = positionValue + window.scrollY + delta;
    modal.style.top = `${topValue}px`;
    modal.style.overflowY = 'auto';
  }

  function syncModalLayout(modal) {
    if (!modal || modal.style.display !== 'block') return;
    positionModal(modal);
    ensureFacetModalInView(modal);
  }

  function onResultsUpdate() {
    const modal = document.querySelector('.facet-modal');
    if (!modal || modal.style.display !== 'block') return;

    // RESULT_UPDATED reflows the status row; 25ms is enough before the first sync (100ms felt laggy).
    waitFor(() => {
      syncModalLayout(modal);
      // Let the event loop flush, then re-sync anchor + scroll after layout updates.
      window.requestAnimationFrame(() => syncModalLayout(modal));
    }, FACET_MODAL_LAYOUT_DELAY_MS);
  }

  const hideAtomicModal = () => {
    const modal = document.querySelector('.facet-modal');
    const placeholder = document.getElementById('facet-original-placeholder');
    placeholder.parentNode.insertBefore(baseElement, placeholder);
    document.querySelector('atomic-layout-section[section="results"]').style.display = '';
    document.body.style.overflow = '';
    modal.style.display = 'none';
    const footerWrapper = document.querySelector('.footer-wrapper');
    if (footerWrapper) {
      footerWrapper.classList.remove('footer-hidden');
    }
    document.removeEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
  };

  const showAtomicModal = () => {
    const modal = document.querySelector('.facet-modal');
    const facetModalSlot = document.getElementById('facet-modal-slot');
    const placeholder = document.createElement('div');
    placeholder.id = 'facet-original-placeholder';
    baseElement.parentNode.insertBefore(placeholder, baseElement.nextSibling);

    facetModalSlot.appendChild(baseElement);

    Object.assign(modal.style, {
      backgroundColor: 'white',
      width: '100%',
      display: 'block',
      position: 'absolute',
      zIndex: '1',
      maxWidth: 'calc(100% - 40px)',
    });

    const closeBtn = modal.querySelector('.facet-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideAtomicModal, { once: true });
    }
    const footerWrapper = document.querySelector('.footer-wrapper');
    if (footerWrapper) {
      footerWrapper.classList.add('footer-hidden');
    }

    document.querySelector('atomic-layout-section[section="results"]').style.display = 'none';

    // First pass: anchor under sort row and scroll while the page can still scroll.
    syncModalLayout(modal);
    document.body.style.overflow = 'hidden';

    // Second pass after the task queue flushes (hiding results shifts the status row).
    setTimeout(() => syncModalLayout(modal), 0);

    document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
  };

  const toggleModalVisibility = () => {
    const modal = document.querySelector('.facet-modal');
    if (modal.style.display === 'block') {
      hideAtomicModal();
    } else {
      showAtomicModal();
    }
  };

  function onResize() {
    const isMobileView = isMobile();
    const nextView = isMobileView ? 'mobile' : 'desktop';
    if (nextView !== baseElement.dataset.view) {
      baseElement.dataset.view = nextView;
      if (document.querySelector('.facet-modal').style.display === 'block') {
        hideAtomicModal();
      }
    }
  }

  function initAtomicFacetManagerUI() {
    if (!baseElement) {
      waitForChildElement(baseElement, initAtomicFacetManagerUI);
      return;
    }
    const modal = document.createElement('div');
    modal.className = 'facet-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="facet-close-btn">
          <span class="icon icon-close"></span>
        </button>
        <div id="facet-modal-slot"></div>
      </div>
    `;

    const atomicSearchContainer = document.querySelector('atomic-search-interface');
    if (!atomicSearchContainer) return;

    atomicSearchContainer.querySelectorAll('.facet-modal').forEach((existingModal) => {
      existingModal.remove();
    });

    atomicSearchContainer.appendChild(modal);

    const filterBtnEl = document.querySelector('#mobile-filter-btn');
    if (filterBtnEl && !filterBtnEl.dataset.evented) {
      filterBtnEl.addEventListener('click', toggleModalVisibility);
      filterBtnEl.dataset.evented = 'true';
    }

    if (!baseElement.dataset.observed) {
      const managerObserver = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(reorderFacets, 100);
      });

      managerObserver.observe(baseElement, { childList: true });
      baseElement.dataset.observed = 'true';
    }
  }

  if (!baseElement.dataset.resizeEvented) {
    const debouncedResize = debounce(200, onResize);
    document.addEventListener(CUSTOM_EVENTS.RESIZED, debouncedResize);
    baseElement.dataset.resizeEvented = 'true';
  }

  initAtomicFacetManagerUI();
}
