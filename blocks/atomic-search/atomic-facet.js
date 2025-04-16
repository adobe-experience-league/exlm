import { CUSTOM_EVENTS, waitForChildElement } from './atomicUtils.js';

export default function atomicFacetHandler() {
  const atomicFacetElement = document.querySelector('atomic-facet');

  const adjustChildElementsPosition = (facet) => {
    if (facet.dataset.childfacet === 'true') {
      const parentName = facet.dataset.parent;
      const facetParentEl = facet.parentElement.querySelector(`[data-contenttype="${parentName}"]`);
      if (facetParentEl) {
        const previousSiblingEl = facet.previousElementSibling;
        if (
          !previousSiblingEl ||
          (!previousSiblingEl.dataset.childfacet && previousSiblingEl.dataset.contenttype !== parentName)
        ) {
          facetParentEl.insertAdjacentElement('afterend', facet);
        }
        const facetParentLabel = facetParentEl.querySelector('label');
        if (facetParentLabel) {
          facetParentLabel.style.cssText = `padding-botton: 4px`;
        }
        const facetParentButton = facetParentEl.querySelector('button');
        if (facetParentButton) {
          facetParentButton.style.cssText = `margin-top: 4px`;
        }
      }
    }
  };

  const updateFacetUI = (facet, forceUpdate = false) => {
    const forceUpdateElement = forceUpdate === true;
    if (facet && (facet.dataset.updated !== 'true' || forceUpdateElement)) {
      const contentType =
        facet.dataset.contenttype || facet.textContent?.trim()?.match(/^(.+?)\(\d[\d,]*\)$/)?.[1] || '';
      if (!facet.dataset.contenttype) {
        facet.dataset.contenttype = contentType;
      }
      facet.dataset.updated = 'true';
      if (contentType.includes('|')) {
        const [parentName, facetName] = contentType.split('|');
        facet.dataset.parent = parentName;
        facet.dataset.childfacet = 'true';
        const spanElement = facet.querySelector('.value-label');
        if (spanElement) {
          spanElement.textContent = facetName;
          facet.style.cssText = `margin-left: 32px;`;
          const labelElement = facet.querySelector('label');
          labelElement.style.cssText = `padding-top: 6px; padding-bottom: 6px;`;
          adjustChildElementsPosition(facet);
        }
      }
    }
  };

  const handleAtomicFacetUI = (atomicFacet) => {
    const parentWrapper = atomicFacet.shadowRoot.querySelector('[part="values"]');
    if (parentWrapper) {
      const facets = Array.from(parentWrapper.children);
      facets.forEach(updateFacetUI);
      facets.forEach(adjustChildElementsPosition);
    }
  };

  const observeFacetValuesList = (atomicFacet) => {
    const shadow = atomicFacet.shadowRoot;
    const valuesObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && node.matches('fieldset.contents')) {
            handleAtomicFacetUI(atomicFacet);
          }
        });
      });
    });
    valuesObserver.observe(shadow, { childList: true, subtree: true });
  };

  const handleShowMoreClick = (atomicFacet) => {
    const facetParent = atomicFacet.shadowRoot.querySelector('[part="facet"]');
    if (!facetParent || facetParent.dataset.observed === 'true') return;

    const observer = new MutationObserver((mutationsList) => {
      let updatedFlag = false;
      mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && node.matches?.('li.relative.flex.items-center')) {
              updateFacetUI(node, true);
              updatedFlag = true;
            }
          });
        }
      });
      if (updatedFlag) {
        const parentWrapper = atomicFacet.shadowRoot.querySelector('[part="values"]');
        if (parentWrapper) {
          const facets = Array.from(parentWrapper.children);
          facets.forEach(adjustChildElementsPosition);
        }
      }
    });

    observer.observe(facetParent, {
      childList: true,
      subtree: true,
    });
    facetParent.dataset.observed = 'true';
  };

  const onResultsUpdate = () => {
    const atomicFacets = document.querySelectorAll('atomic-facet');
    atomicFacets.forEach(handleAtomicFacetUI);
  };

  const initAtomicFacetUI = () => {
    const atomicFacets = document.querySelectorAll('atomic-facet');
    atomicFacets.forEach((atomicFacet) => {
      handleAtomicFacetUI(atomicFacet);
      const showMoreBtn = atomicFacet.shadowRoot.querySelector('[part="show-more"]');
      if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
          handleShowMoreClick(atomicFacet);
        });
      }
      observeFacetValuesList(atomicFacet);
    });
  };
  document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
  waitForChildElement(atomicFacetElement, initAtomicFacetUI);
}
