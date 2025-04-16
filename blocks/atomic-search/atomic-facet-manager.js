import { isMobile } from '../header/header-utils.js';
import { waitForChildElement, debounce, CUSTOM_EVENTS } from './atomicUtils.js';

export default function atomicFacetManagerHandler() {
  const facetManagerElement = document.querySelector('atomic-facet-manager');

  function positionModal() {
    const modal = document.querySelector('.facet-modal');
    const referenceElement = document.querySelector('atomic-layout-section[section="status"]');
    const positionValue = referenceElement.getBoundingClientRect().bottom;
    modal.style.top = `${positionValue - 8}px`;
  }

  function onResultsUpdate() {
    positionModal();
  }

  const showAtomicModal = () => {
    const modal = document.querySelector('.facet-modal');
    const facetModalSlot = document.getElementById('facet-modal-slot');
    const facetManagerPlaceholder = document.createElement('div');
    facetManagerPlaceholder.id = 'facet-original-placeholder';
    facetManagerElement.parentNode.insertBefore(facetManagerPlaceholder, facetManagerElement.nextSibling);

    facetModalSlot.appendChild(facetManagerElement);
    positionModal();
    modal.style.backgroundColor = "white";
    modal.style.width = "100%";
    modal.style.display = "block";
    modal.style.position = "absolute";
    modal.style.zIndex = "1";
    modal.style.maxWidth = "calc(100% - 40px)";
    const resultSectionEl = document.querySelector('atomic-layout-section[section="results"]');
    resultSectionEl.style.display = 'none';
    document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
  };

  const hideAtomicModal = () => {
    const modal = document.querySelector('.facet-modal');
    const facetManagerPlaceholder = document.getElementById('facet-original-placeholder');
    facetManagerPlaceholder.parentNode.insertBefore(facetManagerElement, facetManagerPlaceholder);
    const resultSectionEl = document.querySelector('atomic-layout-section[section="results"]');
    resultSectionEl.style.display = '';
    modal.style.display = 'none';
    document.removeEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
  };

  const toggleModalVisibility = () => {
    const modal = document.querySelector('.facet-modal');
    const modalIsOpen = modal.style.display === 'block';
    if (modalIsOpen) {
      hideAtomicModal();
    } else {
      showAtomicModal();
    }
  };

  const initAtomicFacetManagerUI = () => {
    if (!facetManagerElement) {
      waitForChildElement(facetManagerElement, initAtomicFacetManagerUI);
      return;
    }
    const modal = document.createElement('div');
    modal.className = 'facet-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div id="facet-modal-slot"></div>
                <button id="close-modal-btn">Close</button>
            </div>
            `;
    const atomicSearchContainer = document.querySelector('atomic-search-interface');
    // const atomicSearchContainer = document.querySelector('.atomic-search.block');
    atomicSearchContainer.appendChild(modal);
    const filterBtnEl = document.querySelector('#mobile-filter-btn');
    if (filterBtnEl) {
      filterBtnEl.addEventListener('click', toggleModalVisibility);
    }
  };

  const onResize = () => {
    const isMobileView = isMobile();
    const view = isMobileView ? 'mobile' : 'desktop';
    if (view !== facetManagerElement.dataset.view) {
      facetManagerElement.dataset.view = view;
      const modal = document.querySelector('.facet-modal');
      const modalIsOpen = modal.style.display === 'block';
      if (modalIsOpen) {
        hideAtomicModal();
      }
    }
  };
  const debouncedResize = debounce(200, onResize);
  window.addEventListener('resize', debouncedResize);

  initAtomicFacetManagerUI();
}
