/**
 * Read Coveo Headless facet state and map localized facet labels → raw index values
 * for el_contenttype hierarchical UI (parent/child grouping).
 */

const EL_CONTENTTYPE_FIELD = 'el_contenttype';

/** Align with caption-el_contenttype in atomic-search.js (single-segment values). */
const elContentTypeCaptionMap = (ph) => ({
  Community: ph.searchContentTypeCommunityLabel || 'Community',
  Documentation: ph.searchContentTypeDocumentationLabel || 'Documentation',
  Troubleshooting: ph.searchContentTypeTroubleshootingLabel || 'Troubleshooting',
  Tutorial: ph.searchContentTypeTutorialLabel || 'Tutorial',
  Event: ph.searchContentTypeEventLabel || 'Event',
  Playlist: ph.searchContentTypePlaylistLabel || 'Playlist',
  Course: ph.searchContentTypeCourseLabel || 'Course',
  'upcoming-event': ph.searchContentTypeUpcomingEventLabel || 'Upcoming Event',
  Perspective: ph.searchContentTypePerspectiveLabel || 'Perspective',
  Certification: ph.searchContentTypeCertificationLabel || 'Certification',
  Blogs: ph.searchContentTypeCommunityBlogsLabel || 'Blogs',
  Discussions: ph.searchContentTypeCommunityDiscussionsLabel || 'Discussions',
  Ideas: ph.searchContentTypeCommunityIdeasLabel || 'Ideas',
  Questions: ph.searchContentTypeCommunityQuestionsLabel || 'Questions',
});

const singleValueCaption = (ph, raw) => elContentTypeCaptionMap(ph)[raw] ?? raw;

const PLACEHOLDER_CAPTION_RAW_KEYS = Object.keys(elContentTypeCaptionMap({}));

/**
 * Coveo facet values that include `|` — same keys as caption-el_contenttype (hierarchical rows).
 * Add matching placeholders in AEM for each locale (e.g. searchContentTypeCommunityAmaLabel).
 */
const elContentTypeHierarchicalCaptionMap = (ph) => ({
  'Community|AMA': ph.searchContentTypeCommunityAmaLabel || 'AMA',
  'Community|Community Pulse': ph.searchContentTypeCommunityPulseLabel || 'Community Pulse',
  'Community|Conversations': ph.searchContentTypeCommunityConversationsLabel || 'Conversations',
  'Community|Groups': ph.searchContentTypeCommunityGroupsLabel || 'Groups',
  'Community|Ideas': ph.searchContentTypeCommunityIdeasLabel || 'Ideas',
  'Community|Questions': ph.searchContentTypeCommunityQuestionsLabel || 'Questions',
  'Community|Releases': ph.searchContentTypeCommunityReleasesLabel || 'Releases',
  'Community|Articles': ph.searchContentTypeCommunityArticlesLabel || 'Articles',
  'Event|On Demand Event': ph.searchContentTypeEventOnDemandEventLabel || 'On Demand Event',
  'Event|Upcoming Event':
    ph.searchContentTypeEventUpcomingEventLabel || ph.searchContentTypeUpcomingEventLabel || 'Upcoming Event',
});

/**
 * Single object for Atomic i18n `caption-el_contenttype` (flat + hierarchical).
 */
export function buildCaptionElContentTypeResourceBundle(placeholders) {
  return {
    ...elContentTypeCaptionMap(placeholders),
    ...elContentTypeHierarchicalCaptionMap(placeholders),
  };
}

/**
 * Localized label for a child row (we replace Atomic’s value-label text with the short child name).
 */
export function getLocalizedElContentTypeChildLabel(fullRawValue, childSegment, placeholders) {
  const hierarchical = elContentTypeHierarchicalCaptionMap(placeholders);
  if (fullRawValue && hierarchical[fullRawValue]) {
    return hierarchical[fullRawValue];
  }
  const seg = (childSegment || '').trim();
  if (seg) {
    const single = elContentTypeCaptionMap(placeholders);
    if (single[seg]) return single[seg];
  }
  return seg || fullRawValue || '';
}

/**
 * @param {{ state?: object } | null | undefined} engine
 * @param {string} fieldName
 * @returns {{ value: string, state?: string, numberOfResults?: number }[]}
 */
export function getRegularFacetValuesForField(engine, fieldName = EL_CONTENTTYPE_FIELD) {
  const state = engine?.state;
  if (!state) return [];

  const sets = [state.facetSet, state.regularFacetSet].filter(Boolean);
  for (let s = 0; s < sets.length; s += 1) {
    const facetSet = sets[s];
    if (facetSet && typeof facetSet === 'object') {
      const states = Object.values(facetSet);
      for (let i = 0; i < states.length; i += 1) {
        const facetState = states[i];
        if (
          facetState &&
          Array.isArray(facetState.values) &&
          (facetState.field === fieldName ||
            facetState.facetId === fieldName ||
            facetState.facetId === 'facetContentType')
        ) {
          return facetState.values;
        }
      }
    }
  }

  return [];
}

/**
 * Build display label → raw facet value: placeholder captions (always) + engine values (merge).
 */
export function buildElContentTypeDisplayToRawResolver(engineValues, placeholders) {
  const map = new Map();

  const addSingleSegment = (raw) => {
    if (raw == null || String(raw).includes('|')) return;
    const r = String(raw);
    map.set(r, r);
    const caption = singleValueCaption(placeholders, r);
    if (caption) map.set(String(caption), r);
  };

  PLACEHOLDER_CAPTION_RAW_KEYS.forEach((k) => addSingleSegment(k));
  addSingleSegment('Article'); // common index value; no dedicated placeholder in bundle

  if (Array.isArray(engineValues)) {
    engineValues.forEach(({ value }) => {
      if (!value) return;
      map.set(value, value);
      if (!String(value).includes('|')) {
        addSingleSegment(value);
      }
    });
  }

  const hierarchical = elContentTypeHierarchicalCaptionMap(placeholders);
  Object.entries(hierarchical).forEach(([raw, caption]) => {
    if (!raw || !caption) return;
    map.set(raw, raw);
    map.set(String(caption).trim(), raw);
  });

  return (display) => {
    if (!display) return '';
    return map.get(display) ?? display;
  };
}

/**
 * Sets data-facet-raw-value on each facet row <li> so hierarchy logic uses API values, not captions.
 * @param {HTMLElement} parentWrapper - ul[part="values"]
 * @param {ReturnType<typeof getRegularFacetValuesForField>} engineValues
 * @param {object} placeholders
 * @param {string} facetId - atomic-facet id attribute
 */
export function applyFacetRawValuesToDom(parentWrapper, engineValues, placeholders, facetId) {
  if (facetId !== 'facetContentType' || !parentWrapper) return;

  const lis = parentWrapper.querySelectorAll(':scope > li');
  if (!lis.length) return;

  const resolve = buildElContentTypeDisplayToRawResolver(engineValues || [], placeholders);

  lis.forEach((li) => {
    const display =
      li.dataset.contenttype?.trim() || li.querySelector('.value-label')?.getAttribute('title')?.trim() || '';
    const raw = resolve(display);
    if (!raw) return;
    if (li.dataset.facetRawValue && li.dataset.facetRawValue !== raw) {
      delete li.dataset.updated;
      delete li.dataset.childfacet;
      delete li.dataset.parent;
      li.querySelector('[part="only-facet-btn"]')?.remove();
      delete li.dataset.onlyfacet;
      li.part?.remove('facet-child-element');
      const labelEl = li.querySelector('label');
      labelEl?.part?.remove('facet-child-label');
    }
    li.dataset.facetRawValue = raw;
  });
}

export { EL_CONTENTTYPE_FIELD };
