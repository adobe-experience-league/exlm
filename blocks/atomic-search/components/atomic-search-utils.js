const DEFAULT_WAIT_TIME = 100; // 100ms.

export const CUSTOM_EVENTS = {
  RESULT_UPDATED: 'ATOMIC_SEARCH_RESULTS_UPDATED',
  FILTER_UPDATED: 'ATOMIC_SEARCH_FILTER_UPDATED',
  RESIZED: 'ATOMIC_SEARCH_RESIZED',
  FACET_LOADED: 'ATOMIC_SEARCH_FACET_LOADED',
  NO_RESULT_FOUND: 'ATOMIC_RESULT_NOT_FOUND',
  RESULT_FOUND: 'ATOMIC_RESULT_FOUND',
  SEARCH_QUERY_CHANGED: 'ATOMIC_SEARCH_QUERY_CHANGED',
  SEARCH_CLEARED: 'ATOMIC_SEARCH_CLEARED',
  PAGE_LOAD_EVENT: 'ATOMIC_SEARCH_PAGE_LOAD_EVENT',
};

export const COMMUNITY_CONTENT_TYPES = [
  'Community',
  'Community|Questions',
  'Community|Blogs',
  'Community|Discussions',
  'Community|Ideas',
  'Community|User',
  // Support new Coveo hierarchical format (Community;Community|X)
  'Community;Community|Questions',
  'Community;Community|Blogs',
  'Community;Community|Discussions',
  'Community;Community|Ideas',
  'Community;Community|Community Resources',
];

export const COMMUNITY_SUPPORTED_SORT_ELEMENTS = ['el_view_status', 'el_kudo_status', 'el_reply_status'];

// Mobile Only (Until 1024px)
export const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

export const waitFor = (callback, delay = DEFAULT_WAIT_TIME) => {
  setTimeout(callback, delay);
};

export const childElementExists = (element) => {
  if (!element) {
    return false;
  }
  if (element.shadowRoot) {
    const childExists = !!element.shadowRoot.firstElementChild;
    if (!childExists) {
      return false;
    }
    const placeHolderExists = !!element.shadowRoot.querySelector('[part~="placeholder"]');
    if (placeHolderExists) {
      return false;
    }
    return true;
  }
  return !!element.firstElementChild;
};

export const waitForChildElement = (element, handler, delay = DEFAULT_WAIT_TIME) => {
  const exists = childElementExists(element);
  if (exists) {
    handler();
    return true;
  }
  waitFor(() => {
    waitForChildElement(element, handler, delay);
  }, delay);
  return false;
};

/**
 * debounce fn execution
 */
export const debounce = (ms, fn) => {
  let timer;
  // eslint-disable-next-line func-names
  return function (...args) {
    const ctx = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(ctx, args);
    }, ms);
  };
};

export const fragment = () => window.location.hash.slice(1);

export const getFiltersFromUrl = () => {
  const hash = fragment();
  const decodedHash = decodeURIComponent(hash);
  const filtersInfo = decodedHash.split('&').filter((s) => !!s);
  return filtersInfo.reduce((acc, curr) => {
    const [facetKeys, facetValueInfo] = curr.split('=');
    if (facetValueInfo) {
      const facetValues = facetValueInfo.split(',');
      const keyName = facetKeys.replace('f-', '');
      acc[keyName] = facetValues;
    }
    return acc;
  }, {});
};

/**
 * Checks if specific content type filters are active in the URL hash.
 * If `contentTypes` is empty, it checks if any content type filter is selected in the URL.
 * If `contentTypes` is provided, it checks if any of the specified types are among the selected ones.
 */
export const hasContentTypeFilter = (contentTypes = []) => {
  const { el_contenttype: selectedContentType = [] } = getFiltersFromUrl();
  if (contentTypes.length === 0) return selectedContentType.length > 0;
  if (selectedContentType.length === 0) return false;
  const hasSpecificFilters = contentTypes.some((type) => selectedContentType.includes(type));
  return hasSpecificFilters;
};

/**
 * Updates the URL hash by filtering its current parts based on a provided condition.
 */
export const updateHash = (filterCondition, joinWith = '&', facetHashString = '') => {
  const currentHash = fragment();
  const updatedParts = currentHash.split('&').filter(filterCondition);
  if (facetHashString) {
    updatedParts.push(facetHashString);
  }
  window.location.hash = updatedParts.join(joinWith);
};

/** @param {string} segment e.g. f-el_contenttype=Community,Community|Ideas */
const getFacetParamKeyFromSegment = (segment) => {
  const m = segment.match(/^f-([^=]+)=/);
  return m ? m[1] : null;
};

/**
 * Removes existing `f-{facetId}=…` segments for each replacement’s facetId, then appends the new segments. Single hash write.
 * Same flow as updateHash: fragment → split → filter → push → join.
 *
 * @param {{ facetId: string, targetFacetKeys: string[] }[]} replacements
 * @param {string} [joinWith]
 */
export const replaceFacetParamsInHash = (replacements, joinWith = '&') => {
  if (!replacements?.length) return;
  const facetIds = new Set(replacements.map(({ facetId }) => facetId));
  const updatedParts = fragment()
    .split('&')
    .filter((segment) => {
      const key = getFacetParamKeyFromSegment(segment);
      return key === null || !facetIds.has(key);
    });
  replacements.forEach(({ facetId, targetFacetKeys }) => {
    updatedParts.push(`f-${facetId}=${targetFacetKeys.join(',')}`);
  });
  window.location.hash = updatedParts.join(joinWith);
};

export function observeShadowRoot(host, { onEmpty, onPopulate, onClear, onMutation, waitForElement = false } = {}) {
  let observer;
  const ready = () => {
    const root = host.shadowRoot;
    if (!root) {
      waitFor(ready, 250);
      return;
    }

    const hasContent = () =>
      !!host.shadowRoot.firstElementChild &&
      !!Array.from(host.shadowRoot.children).find((el) => el.tagName !== 'STYLE');
    let populated = hasContent();

    if (waitForElement && !populated && root.nodeName === '#document-fragment') {
      waitFor(ready, 300);
      return;
    }

    if (populated) {
      if (onPopulate) {
        onPopulate(root);
      }
    } else if (onEmpty) {
      onEmpty(root);
    }

    observer = new MutationObserver((muts) => {
      if (onMutation) {
        onMutation(muts, root);
      }

      const nowPopulated = hasContent();

      if (!populated && nowPopulated) {
        populated = true;
        if (onPopulate) {
          onPopulate(root);
        }
      } else if (populated && !nowPopulated) {
        populated = false;
        if (onClear) {
          onClear(root);
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true, attributes: true });
  };

  ready();
  return observer;
}

export function disconnectShadowObserver(observer) {
  if (observer && typeof observer.disconnect === 'function') {
    observer.disconnect();
  }
}

export const sleep = (callback, timeout = 20) => {
  const promise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, timeout);
  });
  promise.then(() => {
    callback();
  });
};

export function isUserClick(e) {
  if (typeof e.isTrusted === 'boolean') {
    return e.isTrusted;
  }
  return e.detail > 0;
}

const FACET_CONTENT_TYPE_ID = 'facetContentType';

/** Parent row for hierarchical facet: prefer data-facet-raw-value (engine) over localized data-contenttype. */
export function findParentFacetRow(parentWrapper, parentKey, preferRawValueAttr) {
  if (!parentWrapper || !parentKey) return null;
  const escaped = CSS.escape(parentKey);
  if (preferRawValueAttr) {
    const byRaw = parentWrapper.querySelector(`:scope > li[data-facet-raw-value="${escaped}"]`);
    if (byRaw && byRaw.dataset.childfacet !== 'true') return byRaw;
  }
  const byDisplay = parentWrapper.querySelector(`:scope > li[data-contenttype="${escaped}"]`);
  if (byDisplay && byDisplay.dataset.childfacet !== 'true') return byDisplay;
  return null;
}

export function isContentTypeFacet(atomicFacet) {
  return atomicFacet?.getAttribute('id') === FACET_CONTENT_TYPE_ID;
}

/**
 * Keeps parent/child content-type facet selections in sync after a user click.
 * @returns {boolean} true if any programmatic .click() ran to change filters
 */
export function syncFacetParentChildFilters({ facet, atomicElement, onlyOptionClicked = false }) {
  const isChildFacet = facet.dataset.childfacet === 'true';
  const isSelected = facet.firstElementChild.ariaChecked === 'false'; // Will take some to update the state.
  const valuesList = facet.parentElement;
  const parentFacet = isChildFacet
    ? findParentFacetRow(valuesList, facet.dataset.parent, isContentTypeFacet(atomicElement))
    : facet;
  const parentFacetIsSelected = isChildFacet ? parentFacet?.firstElementChild?.ariaChecked === 'true' : isSelected;
  let filtersChanged = false;
  if (isChildFacet) {
    // child facet click.
    if (onlyOptionClicked === true) {
      const parentFacetType = facet.dataset.parent;
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
      const allChildFacets = Array.from(facet.parentElement.querySelectorAll(`[data-parent="${parentFacetType}"]`));
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
    // Parent facet click — use raw facet value so localized labels still sync children.
    const parentFacetType = parentFacet.dataset.facetRawValue || parentFacet.dataset.contenttype;
    const parentFacetValue = parentFacetIsSelected ? 'true' : 'false';
    const allChildFacets = facet.parentElement.querySelectorAll(`[data-parent="${parentFacetType}"]`);
    allChildFacets.forEach((childFacet) => {
      if (childFacet.firstElementChild.ariaChecked !== parentFacetValue) {
        filtersChanged = true;
        childFacet.firstElementChild.click();
      }
    });
  }
  return filtersChanged;
}

export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const extractSelectedFacets = (data) =>
  Object.entries(data).reduce((result, [key, { request }]) => {
    if (request && request.currentValues) {
      const selectedValues = request.currentValues
        .filter((item) => item.state === 'selected')
        .map((item) => item.value);

      if (selectedValues.length > 0) {
        result[key.replace('el_', '')] = selectedValues;
      }
    }
    return result;
  }, {});

export const generateAdobeTrackingData = (searchState) => {
  const { search, query, facetSet, sortCriteria } = searchState;
  const { response } = search;
  if (typeof response.totalCount !== 'number') {
    return null;
  }
  const filter = facetSet ? extractSelectedFacets(facetSet) : {};
  const data = {
    count: response.totalCount,
    filter,
    solution: '',
    sortBy: sortCriteria,
    depth: 1,
    term: query.q,
    tool: 'coveo',
  };
  return data;
};

export const BLOCK_SKELETON_PARTIAL_CLASS = 'atomic-skeleton-partial-results-ready';

function areBlockFacetsRendered(block) {
  const facets = block.querySelectorAll('atomic-facet');
  if (facets.length === 0) {
    return true;
  }
  return [...facets].every((facet) => facet.dataset.rendered === 'true');
}

export function resolveBlockLevelSkeleton(block) {
  const skeleton = block.querySelector('.atomic-search-load-skeleton');
  if (!skeleton) {
    return;
  }
  if (areBlockFacetsRendered(block)) {
    skeleton.classList.remove(BLOCK_SKELETON_PARTIAL_CLASS);
    skeleton.remove();
  } else if (!skeleton.classList.contains(BLOCK_SKELETON_PARTIAL_CLASS)) {
    skeleton.classList.add(BLOCK_SKELETON_PARTIAL_CLASS);
  }
}
