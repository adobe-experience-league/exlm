import { waitForChildElement, debounce, CUSTOM_EVENTS, isMobile } from './atomic-search-utils.js';

const orderedFacetIds = ['facetContentType', 'facetProduct', 'facetRole'];

export default function atomicFacetManagerHandler(block) {
  let resizeObserver;
  let debounceTimer;
  let hideTimeout;

  const baseElement = block.querySelector('atomic-facet-manager')

  const reorderFacets = () => {
    const currentOrder = Array.from(baseElement.querySelectorAll('atomic-facet')).map((el) => el.id);
    const isCorrectOrder = orderedFacetIds.every((id, index) => currentOrder[index] === id);
    if (isCorrectOrder) return;

    const facetsInOrder = orderedFacetIds.map((id) => document.getElementById(id)).filter(Boolean);
    facetsInOrder.forEach((facet) => {
      baseElement.appendChild(facet);
    });
  };

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
    const placeholder = document.createElement('div');
    placeholder.id = 'facet-original-placeholder';
    baseElement.parentNode.insertBefore(placeholder, baseElement.nextSibling);

    facetModalSlot.appendChild(baseElement);
    positionModal();
    Object.assign(modal.style, {
      backgroundColor: 'white',
      width: '100%',
      display: 'block',
      position: 'absolute',
      zIndex: '1',
      maxWidth: 'calc(100% - 40px)',
    });
    document.querySelector('atomic-layout-section[section="results"]').style.display = 'none';
    document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
  };

  const hideAtomicModal = () => {
    const modal = document.querySelector('.facet-modal');
    const placeholder = document.getElementById('facet-original-placeholder');
    placeholder.parentNode.insertBefore(baseElement, placeholder);
    document.querySelector('atomic-layout-section[section="results"]').style.display = '';
    modal.style.display = 'none';
    document.removeEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
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
        <div id="facet-modal-slot"></div>
        <button id="close-modal-btn">Close</button>
      </div>
    `;
    const hideFacet = () => {
      console.log(baseElement);
      console.log(block);
      const isNoResultsPage = block.querySelector('atomic-search-interface');
      console.log('isNo', isNoResultsPage);
      const allFacets = baseElement.querySelectorAll('atomic-facet');
      console.log(allFacets);
      const isFacetsSelected = Array.from(allFacets).every(facet => {
       
        console.log(facet.classList.contains('atomic-hidden'))
        return  facet.classList.contains('atomic-hidden');
      }

      );
    
      console.log(isFacetsSelected);
    }
    // document.addEventListener(CUSTOM_EVENTS.FACET_LOADED, () => {
    //   console.log('event riggered');
    //   hideFacet();
    // });
    const atomicSearchContainer = document.querySelector('atomic-search-interface');
    atomicSearchContainer.appendChild(modal);

    const filterBtnEl = document.querySelector('#mobile-filter-btn');
    if (filterBtnEl) filterBtnEl.addEventListener('click', toggleModalVisibility);

    resizeObserver = new ResizeObserver(debounce(200, onResize));
    resizeObserver.observe(atomicSearchContainer);

    const managerObserver = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      clearTimeout(hideTimeout);
      debounceTimer = setTimeout(reorderFacets, 100);
      hideTimeout = setTimeout(hideFacet, 300);
    });

    managerObserver.observe(baseElement, { childList: true });
  }
   // Re-check when any facet is re-rendered

  initAtomicFacetManagerUI();
}
