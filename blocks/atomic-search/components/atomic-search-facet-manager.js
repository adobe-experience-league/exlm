import { waitForChildElement, debounce, CUSTOM_EVENTS, isMobile } from './atomic-search-utils.js';

const orderedFacetIds = ['facetContentType', 'facetStatus', 'facetProduct', 'facetRole', 'facetDate'];

export default function atomicFacetManagerHandler(baseElement) {
  let resizeObserver;
  let debounceTimer;

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

  function positionModal() {
    const modal = document.querySelector('.facet-modal');
    const referenceElement = document.querySelector('atomic-sort-dropdown');
    const positionValue = referenceElement.getBoundingClientRect().bottom;
    const delta = 10;
    const topValue = positionValue + window.scrollY + delta;
    modal.style.top = `${topValue}px`;
    modal.style.maxHeight = `${window.innerHeight - topValue}px`;
    modal.style.overflowY = 'auto';
  }

  function onResultsUpdate() {
    setTimeout(() => {
      positionModal();
    }, 100);
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
    positionModal();
    document.body.style.overflow = 'hidden';
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
    atomicSearchContainer.appendChild(modal);

    const filterBtnEl = document.querySelector('#mobile-filter-btn');
    if (filterBtnEl) filterBtnEl.addEventListener('click', toggleModalVisibility);

    resizeObserver = new ResizeObserver(debounce(200, onResize));
    resizeObserver.observe(atomicSearchContainer);

    const managerObserver = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(reorderFacets, 100);
    });

    managerObserver.observe(baseElement, { childList: true });
  }

  initAtomicFacetManagerUI();
}
