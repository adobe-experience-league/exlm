import { BASE_COVEO_ADVANCED_QUERY_EVENTS } from '../../scripts/browse-card/browse-cards-constants.js';
import { eventTypeOptions, getBrowseFiltersResultCount } from '../browse-filters/browse-filter-utils.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { createFacetedSearch } from '../../scripts/faceted-search/faceted-search.js';
import createEventSortPolicy, {
  alphabetical,
  readEventSort,
  getEventFacetItems,
  eventsSearchAnalytics,
} from '../../scripts/faceted-search/policies/events.js';

function createEventsSearchConfig(placeholders) {
  const pageSize = getBrowseFiltersResultCount();
  const groups = [
    { id: 'el_product', name: placeholders.eventSearchFilterProductLabel || 'Product' },
    {
      id: 'el_contenttype',
      name: placeholders.eventSearchFilterEventTypeLabel || 'Event Type',
      items: eventTypeOptions.items
        .map((item) => ({ value: item.value || item.title, title: item.title || item.value }))
        .sort(alphabetical),
    },
    { id: 'el_event_series', name: placeholders.eventSearchFilterEventSeriesLabel || 'Series' },
  ];
  return {
    groups,
    resultsPrefix: 'events-search',
    cardColumns: false,
    labels: {
      filtersLabel: placeholders.eventSearchFiltersLabel,
      filterClearLabel: placeholders.eventSearchClearFiltersLabel || 'Clear all filters',
      searchPlaceholder: placeholders.eventSearchKeywordPlaceholder || 'Search events',
      clearSearchLabel: placeholders.eventSearchClearSearchLabel,
      activeFiltersAriaLabel: placeholders.eventSearchActiveFiltersAriaLabel,
      sort: placeholders.eventSearchFilterSortLabel || 'Sort:',
      resultsSuffix: placeholders.eventSearchResultsCountSuffix || 'events and recordings',
      noResultsPrefix: placeholders.eventSearchNoResultsPrefix,
      noResults: placeholders.eventSearchNoResultsMessage,
      clearSearch: placeholders.eventSearchClearSearchLabel,
      error: placeholders.eventSearchErrorMessage,
    },
    sort: createEventSortPolicy(placeholders),
    pagination: {
      pageSize,
      labels: {
        previous: placeholders.eventSearchPaginationPreviousAriaLabel,
        next: placeholders.eventSearchPaginationNextAriaLabel,
        pageInput: placeholders.eventSearchPaginationPageInputAriaLabel,
        pages: placeholders.eventSearchPagesLabel,
        page: placeholders.eventSearchPageLabel,
      },
    },
    source: {
      readSort: readEventSort,
      facetOverrides: {
        el_product: { numberOfValues: 500, options: { filterFacetCount: true, sortCriteria: 'alphanumeric' } },
        el_event_series: { numberOfValues: 100, options: { filterFacetCount: true, sortCriteria: 'alphanumeric' } },
      },
      hideAqFromUrl: true,
      baseAdvancedQuery: BASE_COVEO_ADVANCED_QUERY_EVENTS,
      tabId: 'Events Hub',
    },
    getFacetItems: getEventFacetItems,
    cards: { type: 'events', viewSwitcher: true },
    scrollToResults: true,
    analytics: eventsSearchAnalytics,
  };
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('events-search: failed to load placeholders; using default labels', error);
  }
  await createFacetedSearch(block, createEventsSearchConfig(placeholders));
}
