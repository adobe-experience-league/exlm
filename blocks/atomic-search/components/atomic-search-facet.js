import { CUSTOM_EVENTS, debounce, isUserClick, waitForChildElement } from './atomic-search-utils.js';

export default function atomicFacetHandler(baseElement) {
  const adjustChildElementsPosition = (facet, atomicElement) => {
    if (facet.dataset.childfacet === 'true') {
      const parentName = facet.dataset.parent;
      const facetParentEl = facet.parentElement.querySelector(`[data-contenttype="${parentName}"]`);
      if (facetParentEl) {
        facet.part.remove('facet-hide-element');
        const previousSiblingEl = facet.previousElementSibling;
        if (
          !previousSiblingEl ||
          (!previousSiblingEl.dataset.childfacet && previousSiblingEl.dataset.contenttype !== parentName)
        ) {
          facetParentEl.insertAdjacentElement('afterend', facet);
        }
        const facetParentLabel = facetParentEl.querySelector('label');
        if (facetParentLabel) {
          facetParentLabel.part.add('facet-parent-label');
        }
        const facetParentButton = facetParentEl.querySelector('button');
        if (facetParentButton) {
          facetParentButton.part.add('facet-parent-button');
        }
      } else {
        facet.part.add('facet-hide-element');
        if (facet.querySelector('button.selected')) {
          atomicElement.dataset.clickmore = 'true';
        }
      }
    }
    if (!facet.dataset.evented) {
      facet.dataset.evented = 'true';
      const clickHandler = (e) => {
        const userClickAction = isUserClick(e);
        if (!userClickAction) {
          return;
        }

        const isChildFacet = facet.dataset.childfacet === 'true';
        const isSelected = facet.firstElementChild.ariaChecked === 'false'; // Will take some to update the state.
        const parentFacet = isChildFacet
          ? facet.parentElement.querySelector(`[data-contenttype="${facet.dataset.parent}"]`)
          : facet;
        const parentFacetIsSelected = isChildFacet ? parentFacet.firstElementChild?.ariaChecked === 'true' : isSelected;
        if (isChildFacet) {
          // child facet click.
          if (!isSelected && parentFacetIsSelected) {
            parentFacet.firstElementChild.click();
          } else if (isSelected && !parentFacetIsSelected) {
            // Now check if all child facets excluding the current one is selected.
            const parentFacetType = facet.dataset.parent;
            const allChildFacets = Array.from(
              facet.parentElement.querySelectorAll(`[data-parent="${parentFacetType}"]`),
            );
            const selectedCount = allChildFacets.reduce((acc, curr) => {
              if (curr.firstElementChild.ariaChecked === 'true') {
                return acc + 1;
              }
              return acc;
            }, 1);
            if (selectedCount === allChildFacets.length) {
              parentFacet.firstElementChild.click();
            }
          }
        } else {
          // Parent facet click.
          const parentFacetType = parentFacet.dataset.contenttype;
          const parentFacetValue = parentFacetIsSelected ? 'true' : 'false';
          const allChildFacets = facet.parentElement.querySelectorAll(`[data-parent="${parentFacetType}"]`);
          allChildFacets.forEach((childFacet) => {
            if (childFacet.firstElementChild.ariaChecked !== parentFacetValue) {
              childFacet.firstElementChild.click();
            }
          });
        }
      };

      const debouncedHandler = debounce(100, clickHandler);
      facet.addEventListener('click', debouncedHandler);
    }
  };

  const updateFacetUI = (facet, atomicElement, forceUpdate = false) => {
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
          facet.part.add('facet-child-element');
          const labelElement = facet.querySelector('label');
          labelElement.part.add('facet-child-label');
          adjustChildElementsPosition(facet, atomicElement);
        }
      }
    }
  };

  const handleAtomicFacetUI = (atomicFacet) => {
    const parentWrapper = atomicFacet.shadowRoot.querySelector('[part="values"]');
    if (parentWrapper) {
      const facets = Array.from(parentWrapper.children);
      facets.forEach((facet) => {
        updateFacetUI(facet, atomicFacet, false);
      });
      facets.forEach((facet) => {
        adjustChildElementsPosition(facet, atomicFacet);
      });
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
              updateFacetUI(node, atomicFacet, true);
              updatedFlag = true;
            }
          });
        }
      });
      if (updatedFlag) {
        const parentWrapper = atomicFacet.shadowRoot.querySelector('[part="values"]');
        if (parentWrapper) {
          const facets = Array.from(parentWrapper.children);
          setTimeout(() => {
            facets.forEach((facet) => {
              adjustChildElementsPosition(facet, atomicFacet);
            });
          }, 200);
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
    const event = new CustomEvent(CUSTOM_EVENTS.FACET_LOADED);
    document.dispatchEvent(event);

    const atomicFacets = document.querySelectorAll('atomic-facet');
    atomicFacets.forEach((atomicFacet) => {
      const showMoreBtn = atomicFacet.shadowRoot.querySelector('[part="show-more"]');
      if (showMoreBtn) {
        showMoreBtn.addEventListener('click', (e) => {
          handleShowMoreClick(atomicFacet, e);
        });
      }
      observeFacetValuesList(atomicFacet);
      handleAtomicFacetUI(atomicFacet);
    });
    document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
  };
  waitForChildElement(baseElement, initAtomicFacetUI);
}
