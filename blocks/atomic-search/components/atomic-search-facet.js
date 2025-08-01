import { decorateIcons } from '../../../scripts/lib-franklin.js';
import { htmlToElement } from '../../../scripts/scripts.js';
import {
  CUSTOM_EVENTS,
  debounce,
  isUserClick,
  waitForChildElement,
  hasContentTypeFilter,
  updateHash,
  COMMUNITY_CONTENT_TYPES,
} from './atomic-search-utils.js';

const MAX_FACETS_WITHOUT_EXPANSION = 5;

export default function atomicFacetHandler(baseElement, placeholders) {
  let baseObserver;
  let resultTimerId;
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
      const clickHandler = (e, onlyOptionClicked = false) => {
        const userClickAction = isUserClick(e);
        if (!userClickAction || facet.dataset.filterclick === 'true') {
          return;
        }

        const shimmer = atomicElement.shadowRoot.querySelector('.facet-shimmer');
        shimmer?.part.add('show-shimmer');
        const isChildFacet = facet.dataset.childfacet === 'true';
        const isSelected = facet.firstElementChild.ariaChecked === 'false'; // Will take some to update the state.
        const parentFacet = isChildFacet
          ? facet.parentElement.querySelector(`[data-contenttype="${facet.dataset.parent}"]`)
          : facet;
        const parentFacetIsSelected = isChildFacet
          ? parentFacet?.firstElementChild?.ariaChecked === 'true'
          : isSelected;
        let filtersChanged = false;
        if (isChildFacet) {
          // child facet click.
          if (onlyOptionClicked === true) {
            const parentFacetType = parentFacet.dataset.contenttype;
            const allChildFacets = facet.parentElement.querySelectorAll(`[data-parent="${parentFacetType}"]`);
            if (parentFacetIsSelected) {
              filtersChanged = true;
              parentFacet.firstElementChild.click();
            }
            allChildFacets.forEach((childFacet) => {
              const isCurrentFacet = childFacet === facet;
              if (
                (!isCurrentFacet && childFacet.firstElementChild.ariaChecked === 'true') ||
                (isCurrentFacet && childFacet.firstElementChild.ariaChecked === 'false')
              ) {
                filtersChanged = true;
                childFacet.firstElementChild.click();
              }
            });
            setTimeout(() => {
              facet.dataset.filterclick = '';
            }, 0);
          } else if (!isSelected && parentFacetIsSelected) {
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
              filtersChanged = true;
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
              filtersChanged = true;
              childFacet.firstElementChild.click();
            }
          });
        }
        if (!filtersChanged && shimmer) {
          shimmer.part.remove('show-shimmer');
        }
      };

      const debouncedHandler = debounce(100, clickHandler);
      facet.addEventListener('click', debouncedHandler);
      const onlyFilterEl = facet.querySelector(`[part="only-facet-btn"]`);
      if (onlyFilterEl) {
        const filterHandler = (e) => {
          e.stopImmediatePropagation();
          clickHandler(e, true);
          facet.dataset.filterclick = 'true';
        };
        const debouncedFilterClickHandler = debounce(100, filterHandler);
        onlyFilterEl.addEventListener('click', debouncedFilterClickHandler);
        facet.addEventListener('mouseenter', () => {
          onlyFilterEl.part.add('only-facet-visible');
        });

        facet.addEventListener('mouseleave', () => {
          onlyFilterEl.part.remove('only-facet-visible');
        });
      }
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

  const handleFacetsVisibility = (facetParent, facets, expanded) => {
    let count = 0;
    facets.forEach((facet) => {
      const isFacetParent = facet.dataset.childfacet !== 'true';
      if (isFacetParent) {
        count += 1;
      }
      if (count > MAX_FACETS_WITHOUT_EXPANSION) {
        const op = expanded ? 'remove' : 'add';
        facet.part[op]('facet-collapsed');
      } else {
        facet.part.remove('facet-collapsed');
      }
    });

    const showMoreBtn = facetParent.querySelector('.facet-show-more-btn');
    if (showMoreBtn) {
      const needsShowMoreBtn = count > MAX_FACETS_WITHOUT_EXPANSION;
      const op = needsShowMoreBtn ? 'remove' : 'add';
      showMoreBtn.part[op]('facet-collapsed');
    }
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

        const parentSelected = lastParent?.querySelector('button')?.getAttribute('aria-checked') === 'true';
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

        const parentLabel = lastParent?.querySelector('label');
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

  const updateShowMoreVisibility = (facetParent) => {
    const facets = Array.from(facetParent.querySelector('[part="values"]').children);
    const existingBtn = facetParent.querySelector('.facet-show-more-btn');
    if (facetParent.dataset.showMoreBtn && existingBtn) {
      const expanded = existingBtn.dataset.expanded === 'true';
      handleFacetsVisibility(facetParent, facets, expanded);
      const shimmerElement = facetParent.querySelector('.facet-shimmer');
      if (shimmerElement) {
        setTimeout(() => {
          shimmerElement.part.remove('show-shimmer');
        }, 50);
      }
      return;
    }

    const showMoreLabel = placeholders.showMore || 'Show more';
    const showLessLabel = placeholders.showLore || 'Show less';
    facetParent.dataset.showMoreBtn = 'true';
    const showMoreWrapper = htmlToElement(`<div part="facet-show-more-wrapper">
        <button data-expanded="false" part="facet-show-more" class="facet-show-more-btn">
          <span class="icon-elements">
            <span part="icon-item show-icon" class="icon icon-plus"></span>
            <span part="icon-item" class="icon icon-minus"></span>
          </span>
          <span class="button-label">${showMoreLabel}</span>
        </button>
      </div>`);
    const facetShimmer = htmlToElement(`<div class="facet-shimmer" part="facet-shimmer"></div>`);
    const showMoreBtn = showMoreWrapper.querySelector('button');
    showMoreBtn.addEventListener('click', () => {
      const previouslyExpanded = showMoreBtn.dataset.expanded === 'true';
      const isExpanded = !previouslyExpanded;
      const allFacets = Array.from(facetParent.querySelector('[part="values"]').children);
      handleFacetsVisibility(facetParent, allFacets, isExpanded);
      showMoreBtn.dataset.expanded = `${isExpanded}`;
      const btnLabel = showMoreBtn.querySelector('span.button-label');
      btnLabel.textContent = isExpanded ? showLessLabel : showMoreLabel;
      const iconElements = showMoreBtn.querySelectorAll('.icon');
      iconElements.forEach((iconEl) => {
        iconEl.part.remove('show-icon');
      });
      const iconToShow = showMoreBtn.querySelector(`.${isExpanded ? 'icon-minus' : 'icon-plus'}`);
      iconToShow.part.add('show-icon');
    });
    decorateIcons(showMoreBtn);
    const wrapper = facetParent.querySelector('fieldset.contents');
    if (wrapper) {
      wrapper.appendChild(showMoreWrapper);
      wrapper.appendChild(facetShimmer);
    }
    handleFacetsVisibility(facetParent, facets, false);
  };

  const updateFacetUI = (facet, atomicElement, forceUpdate = false) => {
    const forceUpdateElement = forceUpdate === true;
    if (facet && (facet.dataset.updated !== 'true' || forceUpdateElement)) {
      const contentType = facet.dataset.contenttype || facet.querySelector('.value-label').title || '';
      if (!facet.dataset.contenttype) {
        facet.dataset.contenttype = contentType;
      }
      facet.part.add('facet-option');
      facet.dataset.updated = 'true';
      if (contentType.includes('|')) {
        const [parentName, facetName] = contentType.split('|');
        facet.dataset.parent = parentName;
        facet.dataset.childfacet = 'true';
        const spanElement = facet.querySelector('.value-label');
        const onlyLabel = placeholders.searchContentOnlyLabel ?? 'Only';
        const onlyFilterEl = htmlToElement(`<span part="only-facet-btn">${onlyLabel}</span>`);
        facet.appendChild(onlyFilterEl);
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
      updateShowMoreVisibility(facetParent);
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

  const onResultsUpdate = () => {
    if (resultTimerId) {
      clearTimeout(resultTimerId);
      resultTimerId = 0;
    }
    resultTimerId = setTimeout(() => {
      const atomicFacets = document.querySelectorAll('atomic-facet');
      atomicFacets.forEach((atomicFacet) => {
        handleAtomicFacetUI(atomicFacet);
        const shimmer = atomicFacet.shadowRoot.querySelector('.facet-shimmer');
        setTimeout(() => {
          shimmer?.part.remove('show-shimmer');
        }, 50);
      });
    }, 100);
  };

  const initAtomicFacetUI = () => {
    const event = new CustomEvent(CUSTOM_EVENTS.FACET_LOADED);
    document.dispatchEvent(event);

    const atomicFacets = document.querySelectorAll('atomic-facet');
    atomicFacets.forEach((atomicFacet) => {
      observeFacetValuesList(atomicFacet);
      handleAtomicFacetUI(atomicFacet);
    });
    document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
  };
  waitForChildElement(baseElement, initAtomicFacetUI);
}
