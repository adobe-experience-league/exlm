import {
  CUSTOM_EVENTS,
  debounce,
  isUserClick,
  waitForChildElement,
  hasContentTypeFilter,
  updateHash,
  COMMUNITY_CONTENT_TYPES,
} from './atomic-search-utils.js';

export default function atomicFacetHandler(baseElement) {
  let baseObserver;
  const adjustChildElementsPosition = (facet, atomicElement) => {
    if (facet.dataset.childfacet === 'true') {
      const parentName = facet.dataset.parent;
      const facetParentEl = facet.parentElement.querySelector(`[data-contenttype="${parentName}"]`);
      if (facetParentEl) {
        facet.part.remove('facet-hide-element', 'facet-missing-parent');
        const previousSiblingEl = facet.previousElementSibling;
        if (
          !previousSiblingEl ||
          (!previousSiblingEl.dataset.childfacet && previousSiblingEl.dataset.contenttype !== parentName) ||
          (previousSiblingEl.dataset.childfacet && previousSiblingEl.dataset.parent !== parentName)
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
        facet.part.add('facet-hide-element', 'facet-missing-parent');
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
        const parentFacetIsSelected = isChildFacet
          ? parentFacet?.firstElementChild?.ariaChecked === 'true'
          : isSelected;
        if (isChildFacet) {
          // child facet click.
          if (!isSelected && parentFacetIsSelected) {
            parentFacet?.firstElementChild.click();
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

  const sortElementsByLabel = (elements) =>
    elements.sort((a, b) => {
      const aText = a.querySelector('.value-label')?.textContent?.trim().toLowerCase() || '';
      const bText = b.querySelector('.value-label')?.textContent?.trim().toLowerCase() || '';
      return aText.localeCompare(bText);
    });

  const sortFacetsInOrder = (parentWrapper) => {
    const children = Array.from(parentWrapper.children);
    const sortedChildren = sortElementsByLabel(children);
    parentWrapper.innerHTML = '';
    sortedChildren.forEach((item) => parentWrapper.appendChild(item));
  };

  const updateChildElementUI = (parentWrapper, facetParent) => {
    const children = Array.from(parentWrapper.children);
    const finalList = [];

    let tempGroup = [];
    let lastParent = null;

    const flushGroup = () => {
      if (lastParent) finalList.push(lastParent);

      if (tempGroup.length > 0) {
        const sortedGroup = sortElementsByLabel(tempGroup);

        const parentSelected =
          lastParent?.querySelector('button[part="facet-parent-button"]')?.getAttribute('aria-checked') === 'true';
        const atleastOneChildSelected = parentSelected
          ? true
          : sortedGroup.find((el) => el.querySelector('button')?.getAttribute('aria-checked') === 'true');
        const facetIsSelected = parentSelected || atleastOneChildSelected;

        sortedGroup.forEach((el) => {
          if (facetIsSelected && !el.part?.contains('facet-missing-parent')) {
            el.part.remove('facet-hide-element');
          } else {
            el.part.add('facet-hide-element');
          }
        });

        const parentLabel = lastParent.querySelector('label');
        if (facetIsSelected) {
          parentLabel?.part.remove('facet-parent-hide-ui');
        } else {
          parentLabel?.part.add('facet-parent-hide-ui');
        }

        finalList.push(...sortedGroup);
        tempGroup = [];
      }

      lastParent = null;
    };

    children.forEach((el) => {
      if (el.dataset.childfacet === 'true') {
        tempGroup.push(el);
      } else {
        flushGroup();
        lastParent = el;
      }
    });

    flushGroup();

    if (baseObserver) {
      baseObserver.disconnect();
      baseObserver = null;
      if (facetParent) {
        facetParent.dataset.observed = '';
      }
    }
    parentWrapper.innerHTML = '';
    finalList.forEach((item) => parentWrapper.appendChild(item));
  };

  const updateFacetUI = (facet, atomicElement, forceUpdate = false) => {
    const forceUpdateElement = forceUpdate === true;
    if (facet && (facet.dataset.updated !== 'true' || forceUpdateElement)) {
      const contentType = facet.dataset.contenttype || facet.querySelector('.value-label').title || '';
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
    if (atomicFacet.getAttribute('id') === 'facetStatus') {
      // Hide the facetStatus if no filters are selected
      if (!hasContentTypeFilter()) {
        atomicFacet?.classList?.add('hide-facet');
        atomicFacet?.removeAttribute('is-collapsed');
      } else {
        atomicFacet?.classList?.remove('hide-facet');
      }
      // Show the facetStatus if only community filters are selected
      if (!hasContentTypeFilter(COMMUNITY_CONTENT_TYPES)) {
        updateHash((key) => !key.includes('f-el_status'), '&');
      }
    }
    const parentWrapper = atomicFacet.shadowRoot.querySelector('[part="values"]');
    if (parentWrapper) {
      const facets = Array.from(parentWrapper.children);
      facets.forEach((facet) => {
        if (!facet.dataset.contenttype) {
          const contentType = facet.dataset.contenttype || facet.querySelector('.value-label').title || '';
          facet.dataset.contenttype = contentType;
        }
      });
      facets.forEach((facet) => {
        updateFacetUI(facet, atomicFacet, false);
      });
      sortFacetsInOrder(parentWrapper);
      facets.forEach((facet) => {
        adjustChildElementsPosition(facet, atomicFacet);
      });
      const facetParent = atomicFacet.shadowRoot.querySelector('[part="facet"]');
      updateChildElementUI(parentWrapper, facetParent);
      if (atomicFacet.dataset.clickmore) {
        const showMoreBtn = atomicFacet.shadowRoot.querySelector('[part="show-more"]');
        if (showMoreBtn) {
          setTimeout(() => {
            showMoreBtn.click();
          });
        } else {
          facets.forEach((facet) => {
            if (facet.part.contains('facet-hide-element')) {
              facet.part.remove('facet-child-element');
              const labelElement = facet.querySelector('label');
              labelElement.part.remove('facet-child-label');
              facet.part.remove('facet-hide-element');
            }
          });
        }
        atomicFacet.dataset.clickmore = '';
      }
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
    baseObserver = new MutationObserver((mutationsList) => {
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
            updateChildElementUI(parentWrapper, facetParent);
          }, 200);
        }
      }
    });

    baseObserver.observe(facetParent, {
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
