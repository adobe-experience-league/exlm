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

export const extractFacetName = (fieldName) => {
  if (typeof fieldName !== 'string') {
    return { parentName: undefined, facetName: undefined };
  }
  const splitContent = fieldName.split('|');
  let parentName = splitContent[0];
  const facetName = splitContent[1];
  // Handle format like "Community;Community|Ideas" -> extract "Community" as parent
  if (parentName && parentName.includes(';')) {
    [parentName] = parentName.split(';');
  }
  return {
    parentName,
    facetName,
  };
};

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
export const updateHash = (filterCondition, joinWith = '&') => {
  const currentHash = fragment();
  const updatedParts = currentHash.split('&').filter(filterCondition);
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

/**
 * Builds i18n resource bundle objects from placeholders for Coveo atomic search.
 * Returned object has keys: el_product, el_contenttype, date, el_role, el_status, translation.
 * Used with searchInterface.i18n.addResourceBundle(languageCode, namespace, bundles[key]).
 * @param {Object} placeholders - Placeholders from fetchLanguagePlaceholders() (may be {})
 * @returns {{ el_product: Object, el_contenttype: Object, date: Object, el_role: Object, el_status: Object, translation: Object }}
 */
export function buildI18nResourceBundles(placeholders = {}) {
  const contentTypeBundle = {
    Community: placeholders.searchContentTypeCommunityLabel || 'Community',
    Documentation: placeholders.searchContentTypeDocumentationLabel || 'Documentation',
    Troubleshooting: placeholders.searchContentTypeTroubleshootingLabel || 'Troubleshooting',
    Tutorial: placeholders.searchContentTypeTutorialLabel || 'Tutorial',
    Event: placeholders.searchContentTypeEventLabel || 'Event',
    Playlist: placeholders.searchContentTypePlaylistLabel || 'Playlist',
    Course: placeholders.searchContentTypeCourseLabel || 'Course',
    'upcoming-event': placeholders.searchContentTypeUpcomingEventLabel || 'Upcoming Event',
    Perspective: placeholders.searchContentTypePerspectiveLabel || 'Perspective',
    Certification: placeholders.searchContentTypeCertificationLabel || 'Certification',
    Blogs: placeholders.searchContentTypeCommunityBlogsLabel || 'Blogs',
    Discussions: placeholders.searchContentTypeCommunityDiscussionsLabel || 'Discussions',
    Ideas: placeholders.searchContentTypeCommunityIdeasLabel || 'Ideas',
    Questions: placeholders.searchContentTypeCommunityQuestionsLabel || 'Questions',
    'Community|Questions': placeholders.searchContentTypeCommunityQuestionsLabel || 'Questions',
    'Community|Blogs': placeholders.searchContentTypeCommunityBlogsLabel || 'Blogs',
    'Community|Discussions': placeholders.searchContentTypeCommunityDiscussionsLabel || 'Discussions',
    'Community|Ideas': placeholders.searchContentTypeCommunityIdeasLabel || 'Ideas',
    'Community|Groups': placeholders.searchContentTypeCommunityGroupsLabel || 'Groups',
    'Community|Releases': placeholders.searchContentTypeCommunityReleasesLabel || 'Releases',
    'Community|Community Resources': placeholders.searchContentTypeCommunityResourcesLabel || 'Community Resources',
    'Community|Community Pulse': placeholders.searchContentTypeCommunityPulseLabel || 'Community Pulse',
    'Community|Conversations': placeholders.searchContentTypeCommunityConversationsLabel || 'Conversations',
    'Community;Community|Questions': placeholders.searchContentTypeCommunityQuestionsLabel || 'Questions',
    'Community;Community|Blogs': placeholders.searchContentTypeCommunityBlogsLabel || 'Blogs',
    'Community;Community|Discussions': placeholders.searchContentTypeCommunityDiscussionsLabel || 'Discussions',
    'Community;Community|Ideas': placeholders.searchContentTypeCommunityIdeasLabel || 'Ideas',
    'Community;Community|Releases': placeholders.searchContentTypeCommunityReleasesLabel || 'Releases',
    'Community;Community|Community Resources':
      placeholders.searchContentTypeCommunityResourcesLabel || 'Community Resources',
    'Community;Community|Groups': placeholders.searchContentTypeCommunityGroupsLabel || 'Groups',
    'Community;Community|Community Pulse': placeholders.searchContentTypeCommunityPulseLabel || 'Community Pulse',
    'Community;Community|Conversations': placeholders.searchContentTypeCommunityConversationsLabel || 'Conversations',
  };

  const roleBundle = {
    Admin: placeholders.searchRoleAdminLabel || 'Admin',
    Developer: placeholders.searchRoleDeveloperLabel || 'Developer',
    Leader: placeholders.searchRoleLeaderLabel || 'Leader',
    User: placeholders.searchRoleUserLabel || 'User',
  };

  const statusBundle = {
    true: placeholders.searchResolvedLabel || 'Resolved',
    false: placeholders.searchUnresolvedLabel || 'Unresolved',
    Solved: placeholders.searchResolvedLabel || 'Solved',
    Unsolved: placeholders.searchUnresolvedLabel || 'Unsolved',
  };

  const translation = {
    Name: placeholders.searchNameLabel || 'Name',
    'Content Type': placeholders.searchContentTypeLabel || 'Content Type',
    Content: placeholders.searchContentLabel || 'Content',
    Product: placeholders.searchProductLabel || 'Product',
    Updated: placeholders.searchUpdatedLabel || 'Updated',
    Role: placeholders.searchRoleLabel || 'Role',
    Date: placeholders.searchDateLabel || 'Date',
    'Newest First': placeholders.searchNewestFirstLabel || 'Newest First',
    'Oldest First': placeholders.searchOldestFirstLabel || 'Oldest First',
    'Most Likes': placeholders.searchMostLikesLabel || 'Most Likes',
    'Most Replies': placeholders.searchMostRepliesLabel || 'Most Replies',
    'Most Views': placeholders.searchMostViewsLabel || 'Most Views',
    clear: placeholders.searchClearLabel || 'Clear',
    filters: placeholders.searchFiltersLabel || 'Filters',
  };

  return {
    el_product: {},
    el_contenttype: contentTypeBundle,
    date: {},
    el_role: roleBundle,
    el_status: statusBundle,
    translation,
  };
}
