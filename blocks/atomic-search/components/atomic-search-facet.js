import { decorateIcons } from '../../../scripts/lib-franklin.js';
import { htmlToElement } from '../../../scripts/scripts.js';
import {
  CUSTOM_EVENTS,
  debounce,
  beginFacetHistoryBatch,
  finishFacetHistoryBatch,
  isUserClick,
  waitForChildElement,
  hasContentTypeFilter,
  updateHash,
  COMMUNITY_CONTENT_TYPES,
  findParentFacetRow,
  isContentTypeFacet,
  syncFacetParentChildFilters,
  getFiltersFromUrl,
  resolveBlockLevelSkeleton,
  replaceFacetParamsInHash,
} from './atomic-search-utils.js';
import {
  applyFacetRawValuesToDom,
  getRegularFacetValuesForField,
  getLocalizedElContentTypeChildLabel,
  EL_CONTENTTYPE_FIELD,
  isParentOnlyFacetSegment,
  isHierarchicalFacetChildValue,
} from './atomic-facet-engine-helpers.js';

const MAX_FACETS_WITHOUT_EXPANSION = 5;

export default function atomicFacetHandler(block, placeholders, searchInterface) {
  let resultTimerId;
  let noResultFoundTimerId;
  const autoApplyChildFacet = {};
  // Parent-only deep links expand once. A facet click means the user is driving selection.
  let expandParentFromUrl = true;
  const baseElement = block.querySelector('atomic-facet');
  const adjustChildElementsPosition = (facet, atomicElement) => {
    if (facet.dataset.childfacet === 'true') {
      const parentName = facet.dataset.parent;
      const valuesHost = facet.parentElement;
      const facetParentEl = findParentFacetRow(valuesHost, parentName, isContentTypeFacet(atomicElement));
      if (facetParentEl) {
        facet.part.remove('facet-hide-element', 'facet-missing-parent');
        const facetParentLabel = facetParentEl.querySelector('label');
        if (facetParentLabel) {
          facetParentLabel.part.add('facet-parent-label');
        }
        const facetParentButton = facetParentEl.querySelector('button');
        if (facetParentButton) {
          facetParentButton.part.add('facet-parent-button');
        }

        // Store child count on facet for later aggregation
        const childCountEl = facet.querySelector('.value-count');
        if (childCountEl) {
          const childCount = parseInt(childCountEl.textContent.replace(/[(),]/g, ''), 10) || 0;
          facet.dataset.childcount = childCount;
        }
      } else {
        facet.part.add('facet-hide-element', 'facet-missing-parent');
        if (facet.querySelector('button.selected')) {
          atomicElement.dataset.clickmore = 'true';
        }
      }
    }
    let historyBatch;
    const runFacetClick = (e, onlyOptionClicked = false) => {
      const userClickAction = isUserClick(e);
      if (!userClickAction || facet.dataset.filterclick === 'true') {
        return;
      }

      try {
        const shimmer = atomicElement.shadowRoot.querySelector('.facet-shimmer');
        shimmer?.part.add('show-shimmer');
        const wasChecked = facet.dataset.preclickChecked === 'true';
        const filtersChanged = syncFacetParentChildFilters({
          facet,
          atomicElement,
          onlyOptionClicked,
          wasChecked: facet.dataset.preclickChecked == null ? null : wasChecked,
        });
        if (!filtersChanged && shimmer) {
          shimmer.part.remove('show-shimmer');
        }
      } finally {
        finishFacetHistoryBatch(historyBatch);
      }
    };

    // "Only" hover must bind even if the row was evented before the Only span existed
    // (Lit re-renders). Re-query the span on each event.
    if (!facet.dataset.onlyHoverBound) {
      facet.dataset.onlyHoverBound = 'true';
      facet.addEventListener('mouseenter', () => {
        facet.querySelector('[part~="only-facet-btn"]')?.part.add('only-facet-visible');
      });
      facet.addEventListener('mouseleave', () => {
        facet.querySelector('[part~="only-facet-btn"]')?.part.remove('only-facet-visible');
      });
    }

    if (!facet.dataset.evented) {
      facet.dataset.evented = 'true';

      // Capture the real click before Atomic writes the parent's URL state.
      facet.addEventListener(
        'click',
        (e) => {
          if (!isUserClick(e) || facet.dataset.filterclick === 'true') return;
          expandParentFromUrl = false;
          facet.dataset.preclickChecked =
            facet.firstElementChild?.getAttribute('aria-checked') === 'true' ? 'true' : 'false';
          const target = e.target instanceof Element ? e.target : e.target?.parentElement;
          const parentKey = facet.dataset.facetRawValue || facet.dataset.contenttype;
          const hasChildren = Array.from(facet.parentElement.children).some((row) => row.dataset.parent === parentKey);
          if (facet.dataset.childfacet === 'true' || hasChildren) {
            historyBatch = beginFacetHistoryBatch(searchInterface.engine, atomicElement.getAttribute('field'));
          }
          const onlyFilterEl = target?.closest?.('[part~="only-facet-btn"]');
          if (onlyFilterEl && facet.contains(onlyFilterEl)) {
            e.stopImmediatePropagation();
            runFacetClick(e, true);
            facet.dataset.filterclick = 'true';
          }
        },
        { capture: true },
      );

      facet.addEventListener('click', debounce(100, runFacetClick));
    }
  };

  const sortElementsByLabel = (elements) =>
    elements.sort((a, b) => {
      const aText = a.dataset.contenttype?.trim().toLowerCase() || '';
      const bText = b.dataset.contenttype?.trim().toLowerCase() || '';
      return aText.localeCompare(bText);
    });

  const handleFacetsVisibility = (facetParent, facets, expanded) => {
    // Coveo pins a selected value to the first DOM node. Show more has to follow
    // the visual order, or that child stays on screen after its parent is folded.
    const orderedFacets = [...facets].sort((a, b) => {
      const ao = a.style.order === '' ? Number.POSITIVE_INFINITY : Number(a.style.order);
      const bo = b.style.order === '' ? Number.POSITIVE_INFINITY : Number(b.style.order);
      return ao - bo;
    });
    let count = 0;
    orderedFacets.forEach((facet) => {
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

  const rowKey = (el) => el.dataset.facetRawValue || el.dataset.contenttype || '';

  const isFacetRowChecked = (el) => el?.querySelector('button')?.getAttribute('aria-checked') === 'true';

  const updateChildElementUI = (parentWrapper) => {
    const rows = Array.from(parentWrapper.children);
    // Product/Role have no parent/child rows. Clearing their values DOM breaks Lit checkbox bindings.
    if (!rows.some((el) => el.dataset.childfacet === 'true')) {
      return;
    }

    // Coveo pins selected values to the top, so a child can sit before its parent in the DOM.
    // Group by data-parent instead of walking adjacency, then paint that order with CSS.
    const childrenByParent = new Map();
    const parents = [];
    rows.forEach((el) => {
      if (el.dataset.childfacet === 'true') {
        const parentName = el.dataset.parent || '';
        const group = childrenByParent.get(parentName) || [];
        group.push(el);
        childrenByParent.set(parentName, group);
      } else {
        parents.push(el);
      }
    });

    const finalList = [];
    const placed = new Set();
    sortElementsByLabel(parents).forEach((parent) => {
      const kids = sortElementsByLabel([...(childrenByParent.get(rowKey(parent)) || [])]);
      const facetIsSelected = isFacetRowChecked(parent) || kids.some((el) => isFacetRowChecked(el));
      kids.forEach((el) => {
        placed.add(el);
        if (facetIsSelected && !el.part?.contains('facet-missing-parent')) {
          el.part.remove('facet-hide-element');
        } else {
          el.part.add('facet-hide-element');
        }
      });
      const parentLabel = parent.querySelector('label');
      if (facetIsSelected) {
        parentLabel?.part.remove('facet-parent-hide-ui');
      } else {
        parentLabel?.part.add('facet-parent-hide-ui');
      }
      finalList.push(parent, ...kids);
    });

    rows.forEach((el) => {
      if (el.dataset.childfacet === 'true' && !placed.has(el)) {
        el.part.add('facet-hide-element');
        finalList.push(el);
      }
    });

    parentWrapper.style.display = 'flex';
    parentWrapper.style.flexDirection = 'column';
    finalList.forEach((item, index) => {
      item.style.order = String(index);
    });
  };

  const updateParentFacetCounts = (parentWrapper) => {
    if (!parentWrapper) return;

    const facets = Array.from(parentWrapper.children);
    const parentCounts = {};

    // First pass: collect all child counts for each parent
    facets.forEach((facet) => {
      if (facet.dataset.childfacet === 'true') {
        const parentName = facet.dataset.parent;
        const countEl = facet.querySelector('.value-count');
        if (countEl) {
          const count = parseInt(countEl.textContent.replace(/[(),]/g, ''), 10) || 0;
          if (!parentCounts[parentName]) {
            parentCounts[parentName] = 0;
          }
          parentCounts[parentName] += count;
        }
      }
    });

    // Second pass: update parent facet counts (canonical key from engine / raw value)
    facets.forEach((facet) => {
      if (facet.dataset.childfacet !== 'true') {
        const canonicalParentKey = facet.dataset.facetRawValue || facet.dataset.contenttype;
        if (canonicalParentKey && parentCounts[canonicalParentKey] !== undefined) {
          const countEl = facet.querySelector('.value-count');
          if (countEl) {
            // Store original count on first aggregation to prevent re-summing on re-renders
            if (!facet.dataset.originalcount) {
              facet.dataset.originalcount = parseInt(countEl.textContent.replace(/[(),]/g, ''), 10) || 0;
            }
            const totalCount = parentCounts[canonicalParentKey];
            countEl.textContent = `(${totalCount.toLocaleString()})`;
            facet.dataset.aggregatedcount = totalCount;
          }
        }
      }
    });
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
    const showLessLabel = placeholders.showLess || 'Show less';
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
    const needsChild = (facet?.dataset.facetRawValue || '').includes('|') && facet?.dataset.childfacet !== 'true';
    if (facet && (facet.dataset.updated !== 'true' || forceUpdateElement || needsChild)) {
      const labelTitle = facet.querySelector('.value-label')?.getAttribute('title') || '';
      if (!facet.dataset.contenttype && labelTitle) {
        facet.dataset.contenttype = labelTitle;
      }
      // Hierarchy uses Coveo raw value (data-facet-raw-value) when set from engine; captions stay on data-contenttype.
      const contentType = facet.dataset.facetRawValue || facet.dataset.contenttype || labelTitle || '';
      facet.part.add('facet-option');
      facet.dataset.updated = 'true';
      if (contentType.includes('|')) {
        const splitContent = contentType.split('|');
        let parentName = splitContent[0];
        const facetName = splitContent[1];
        // Handle format like "Community;Community|Ideas" -> extract "Community" as parent
        if (parentName.includes(';')) {
          [parentName] = parentName.split(';');
        }
        facet.dataset.parent = parentName;
        facet.dataset.childfacet = 'true';
        const spanElement = facet.querySelector('.value-label');
        const onlyLabel = placeholders.searchContentOnlyLabel ?? 'Only';
        const onlyFilterEl = htmlToElement(`<span part="only-facet-btn">${onlyLabel}</span>`);
        facet.appendChild(onlyFilterEl);
        if (spanElement) {
          spanElement.textContent = getLocalizedElContentTypeChildLabel(contentType, facetName, placeholders);
          facet.part.add('facet-child-element');
          const labelElement = facet.querySelector('label');
          labelElement.part.add('facet-child-label');
          adjustChildElementsPosition(facet, atomicElement);
        }
        if (!facet.dataset.onlyfacet) {
          onlyFilterEl.part.add('only-facet-visible');
          const btnWidth = onlyFilterEl.offsetWidth;
          onlyFilterEl.part.remove('only-facet-visible');
          if (btnWidth > 0) {
            const buffer = 4;
            block.style.setProperty('--atomic-search-facet-padding', `${btnWidth + buffer}px`);
          }
          facet.dataset.onlyfacet = 'true';
        }
      }
    }
  };

  /**
   * Atomic 3.62 (Lit) can leave checkbox visuals stale after Clear All / hash-driven
   * deselect while the headless engine is already idle. Keep DOM parts/classes aligned
   * with engine selection, and strip Atomic primary Tailwind utilities that fight ExL grey chrome.
   */
  const PRIMARY_UTILITY_CLASSES = [
    'bg-primary',
    'hover:bg-primary-light',
    'focus-visible:bg-primary-light',
    'hover:border-primary-light',
    'focus-visible:border-primary-light',
  ];

  // While Clear All is in flight, ignore engine selection until a post-clear RESULT_UPDATED
  // reports idle (or a different selection than the clear-time baseline).
  let facetClearInProgress = false;
  let facetClearSafetyTimerId = 0;
  let clearBaselineFingerprint = '';

  const applyCheckboxVisualState = (btn, isSelected) => {
    btn.classList.remove(...PRIMARY_UTILITY_CLASSES);
    const icon = btn.querySelector('[part~="value-checkbox-icon"]');
    if (isSelected) {
      btn.classList.add('selected');
      btn.part.add('value-checkbox-checked');
      btn.setAttribute('aria-checked', 'true');
      if (icon) {
        icon.style.display = 'block';
        icon.style.stroke = 'var(--spectrum-gray-50)';
        icon.style.color = 'var(--spectrum-gray-50)';
      }
    } else {
      btn.classList.remove('selected');
      btn.part.remove('value-checkbox-checked');
      btn.setAttribute('aria-checked', 'false');
      if (icon) {
        icon.style.display = 'none';
        icon.style.removeProperty('stroke');
        icon.style.removeProperty('color');
      }
    }
  };

  const facetSelectionFingerprint = () => {
    const facetSet = searchInterface?.engine?.state?.facetSet || {};
    return Object.entries(facetSet)
      .map(([facetId, facetState]) => {
        const selected = (facetState.request?.currentValues || [])
          .filter((value) => value.state === 'selected')
          .map((value) => String(value.value))
          .sort()
          .join(',');
        return selected ? `${facetId}:${selected}` : '';
      })
      .filter(Boolean)
      .sort()
      .join('|');
  };

  const clearFacetCheckboxVisuals = (atomicFacet) => {
    const rows = atomicFacet.shadowRoot?.querySelector('[part="values"]')?.querySelectorAll(':scope > li') || [];
    rows.forEach((li) => {
      const btn = li.querySelector('[part~="value-checkbox"]');
      if (btn) applyCheckboxVisualState(btn, false);
    });
  };

  const endFacetClearInProgress = () => {
    facetClearInProgress = false;
    clearBaselineFingerprint = '';
    if (facetClearSafetyTimerId) {
      clearTimeout(facetClearSafetyTimerId);
      facetClearSafetyTimerId = 0;
    }
  };

  const maybeEndFacetClearInProgress = () => {
    if (!facetClearInProgress) return;
    const fingerprint = facetSelectionFingerprint();
    if (!fingerprint || fingerprint !== clearBaselineFingerprint) {
      endFacetClearInProgress();
    }
  };

  const syncFacetCheckboxVisuals = (atomicFacet) => {
    if (facetClearInProgress) {
      clearFacetCheckboxVisuals(atomicFacet);
      return;
    }

    const facetId = atomicFacet.facetId || atomicFacet.getAttribute('field');
    const currentValues = searchInterface?.engine?.state?.facetSet?.[facetId]?.request?.currentValues || [];
    const selectedValues = new Set(
      currentValues.filter((value) => value.state === 'selected').map((value) => String(value.value).toLowerCase()),
    );

    const rows = atomicFacet.shadowRoot?.querySelector('[part="values"]')?.querySelectorAll(':scope > li') || [];
    rows.forEach((li) => {
      const btn = li.querySelector('[part~="value-checkbox"]');
      if (!btn) return;

      const candidates = [
        li.dataset.facetRawValue,
        li.dataset.contenttype,
        li.querySelector('.value-label')?.getAttribute('title'),
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      const isSelected = candidates.some((candidate) => selectedValues.has(candidate));
      applyCheckboxVisualState(btn, isSelected);
    });
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
          const ct = facet.querySelector('.value-label')?.getAttribute('title') || '';
          if (ct) facet.dataset.contenttype = ct;
        }
      });

      const engine = searchInterface?.engine;
      const engineValues = isContentTypeFacet(atomicFacet)
        ? getRegularFacetValuesForField(engine, EL_CONTENTTYPE_FIELD)
        : [];
      applyFacetRawValuesToDom(parentWrapper, engineValues, placeholders, atomicFacet.getAttribute('id'));

      facets.forEach((facet) => {
        updateFacetUI(facet, atomicFacet, false);
      });
      // Visual order uses CSS `order` in updateChildElementUI. Moving the nodes
      // makes Atomic's Lit repeat insert a second copy on the next search.
      const sortedFacets = Array.from(parentWrapper.children);
      sortedFacets.forEach((facet) => {
        adjustChildElementsPosition(facet, atomicFacet);
      });

      // Update parent facet counts with sum of child counts
      updateParentFacetCounts(parentWrapper);
      syncFacetCheckboxVisuals(atomicFacet);

      const facetParent = atomicFacet.shadowRoot.querySelector('[part="facet"]');
      updateChildElementUI(parentWrapper);
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
      maybeEndFacetClearInProgress();
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

  const onNoResultFoundUpdate = () => {
    if (noResultFoundTimerId) {
      clearTimeout(noResultFoundTimerId);
      noResultFoundTimerId = 0;
    }
    noResultFoundTimerId = setTimeout(() => {
      const atomicFacets = document.querySelectorAll('atomic-facet');
      atomicFacets.forEach((atomicFacet) => {
        const shimmer = atomicFacet.shadowRoot.querySelector('.facet-shimmer');
        setTimeout(() => {
          shimmer?.part.remove('show-shimmer');
        }, 50);
      });
    }, 100);
  };

  let facetEventListenersBound = false;

  const initAtomicFacetUI = (removeSkeleton = false) => {
    const atomicFacets = document.querySelectorAll('atomic-facet');
    atomicFacets.forEach((atomicFacet) => {
      atomicFacet.dataset.rendered = 'true';
    });
    if (removeSkeleton) {
      resolveBlockLevelSkeleton(block);
    }

    const event = new CustomEvent(CUSTOM_EVENTS.FACET_LOADED);
    document.dispatchEvent(event);

    atomicFacets.forEach((atomicFacet) => {
      observeFacetValuesList(atomicFacet);
      handleAtomicFacetUI(atomicFacet);
    });
    if (facetEventListenersBound) {
      return;
    }
    facetEventListenersBound = true;

    const onSearchCleared = () => {
      if (resultTimerId) {
        clearTimeout(resultTimerId);
        resultTimerId = 0;
      }
      clearBaselineFingerprint = facetSelectionFingerprint();
      facetClearInProgress = true;
      if (facetClearSafetyTimerId) {
        clearTimeout(facetClearSafetyTimerId);
      }
      let clearSafetyAttempts = 0;
      const scheduleClearSafetyCheck = () => {
        facetClearSafetyTimerId = setTimeout(() => {
          maybeEndFacetClearInProgress();
          clearSafetyAttempts += 1;
          if (facetClearInProgress && clearSafetyAttempts < 5) {
            document.querySelectorAll('atomic-facet').forEach((atomicFacet) => {
              clearFacetCheckboxVisuals(atomicFacet);
            });
            scheduleClearSafetyCheck();
            return;
          }
          if (facetClearInProgress) {
            endFacetClearInProgress();
          }
          facetClearSafetyTimerId = 0;
        }, 2000);
      };
      scheduleClearSafetyCheck();
      document.querySelectorAll('atomic-facet').forEach((atomicFacet) => {
        clearFacetCheckboxVisuals(atomicFacet);
      });
    };

    document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, onResultsUpdate);
    document.addEventListener(CUSTOM_EVENTS.NO_RESULT_FOUND, onNoResultFoundUpdate);
    document.addEventListener(CUSTOM_EVENTS.SEARCH_CLEARED, onSearchCleared);
  };

  // Shared by first-load and hashchange paths: which facets need parent→children expansion.
  const buildFacetHashUpdates = () => {
    const atomicFacets = document.querySelectorAll('atomic-facet');
    const facetSet = searchInterface.engine.state?.facetSet || {};
    const facetHashUpdates = [];
    atomicFacets.forEach((atomicFacet) => {
      const { facetId } = atomicFacet;
      if (facetId && autoApplyChildFacet[facetId] && facetSet[facetId]) {
        const facets = facetSet[facetId].request?.currentValues || [];
        const [parentFromUrl] = autoApplyChildFacet[facetId];
        if (facets.length > 1 && parentFromUrl) {
          const childFacets = facets.filter((facet) => isHierarchicalFacetChildValue(parentFromUrl, facet.value));
          if (childFacets.length > 0 && childFacets.length === childFacets.filter((f) => f.state === 'idle').length) {
            const childFacetKeys = childFacets.map((facet) => encodeURI(facet.value));
            const parentCanonical =
              facets.find((f) => String(f.value).toLowerCase() === String(parentFromUrl).toLowerCase())?.value ??
              parentFromUrl;
            const targetFacetKeys = [parentCanonical].concat(childFacetKeys);
            facetHashUpdates.push({ facetId, targetFacetKeys });
          }
        }
      }
    });
    return facetHashUpdates;
  };

  const tryExpandParentFromUrl = () => {
    if (!expandParentFromUrl) return false;
    const facetHashUpdates = buildFacetHashUpdates();
    if (facetHashUpdates.length === 0) return false;
    expandParentFromUrl = false;
    replaceFacetParamsInHash(facetHashUpdates);
    return true;
  };

  // Facet shadow can render before request.currentValues includes the children.
  const retryParentExpandFromResult = () => {
    if (!expandParentFromUrl) {
      document.removeEventListener(CUSTOM_EVENTS.RESULT_UPDATED, retryParentExpandFromResult);
      return;
    }
    if (!tryExpandParentFromUrl()) return;
    document.removeEventListener(CUSTOM_EVENTS.RESULT_UPDATED, retryParentExpandFromResult);
    document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, () => initAtomicFacetUI(true), { once: true });
  };

  // First load only: may also (re)run facet startup.
  const onAtomicFacetUIReady = () => {
    if (tryExpandParentFromUrl()) {
      // facet got changed, so wait for the new coveo response.
      document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, () => initAtomicFacetUI(true), { once: true });
      return;
    }
    initAtomicFacetUI();
    if (expandParentFromUrl) {
      document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, retryParentExpandFromResult);
    }
  };

  // hashchange (e.g. Back/Forward) only: re-expand children, never re-run facet startup.
  const expandParentOnlyContentType = () => {
    const facetHashUpdates = buildFacetHashUpdates();
    if (facetHashUpdates.length > 0) replaceFacetParamsInHash(facetHashUpdates);
  };

  const updateAutoApplyChildFacet = () => {
    Object.keys(autoApplyChildFacet).forEach((key) => delete autoApplyChildFacet[key]);
    const values = getFiltersFromUrl()[EL_CONTENTTYPE_FIELD];
    if (values?.length === 1 && isParentOnlyFacetSegment(values[0])) {
      autoApplyChildFacet[EL_CONTENTTYPE_FIELD] = [values[0]];
    }
  };

  // atomicFacetHandler can run again after RESULT_FOUND; bind this listener once per block.
  if (block.dataset.facetHashBound !== 'true') {
    block.dataset.facetHashBound = 'true';
    window.addEventListener('hashchange', () => {
      updateAutoApplyChildFacet();
      if (autoApplyChildFacet[EL_CONTENTTYPE_FIELD]) {
        document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, expandParentOnlyContentType, { once: true });
      }
    });
  }
  updateAutoApplyChildFacet();
  waitForChildElement(baseElement, onAtomicFacetUIReady);
}
