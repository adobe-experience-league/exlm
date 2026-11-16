import { BASE_COVEO_ADVANCED_QUERY_EVENTS } from '../../scripts/browse-card/browse-cards-constants.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { eventTypeOptions, getBrowseFiltersResultCount } from '../browse-filters/browse-filter-utils.js';
import { pushEventsFilterSearchEvent, pushEventsClearFiltersEvent } from '../../scripts/analytics/lib-analytics.js';
import createCoveoSource from '../../scripts/faceted-search/sources/coveo-source.js';
import createEventSortPolicy, { readEventSort } from './events-search-sort.js';
import { prepareEventItems, renderEventItem, createEventView } from './events-search-results.js';

function alphabetical(a, b) {
  return a.title.localeCompare(b.title, document.documentElement.lang || 'en', { sensitivity: 'base' });
}

export default function createEventsSearchConfig(placeholders) {
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
    createSource: ({ groups: facets, initialSort, pageSize: resultsPerPage }) =>
      createCoveoSource({
        groups: facets,
        initialSort,
        readSort: readEventSort,
        numberOfResults: resultsPerPage,
        facetOverrides: {
          el_product: { numberOfValues: 500, options: { filterFacetCount: true, sortCriteria: 'alphanumeric' } },
          el_event_series: { numberOfValues: 100, options: { filterFacetCount: true, sortCriteria: 'alphanumeric' } },
        },
        hideAqFromUrl: true,
        baseAdvancedQuery: BASE_COVEO_ADVANCED_QUERY_EVENTS,
        tabId: 'Events Hub',
      }),
    getFacetItems(group, values, state) {
      const selected = new Set(state.filters[group.id]);
      if (group.items) {
        return group.items
          .map((item) => ({ ...item, count: values.find((value) => value.value === item.value)?.count ?? 0 }))
          .filter((item) => selected.has(item.value) || item.count > 0);
      }
      return values
        .filter((value) => selected.has(value.value) || value.count > 0)
        .map((value) => ({ ...value, title: value.value.split('|').join(' | ') }))
        .sort(alphabetical);
    },
    resultClasses: { body: 'browse-cards-block', grid: 'browse-cards-block-content' },
    createLoading: () => new BrowseCardShimmer(pageSize),
    prepareItems: prepareEventItems,
    renderItem: renderEventItem,
    createView: createEventView,
    scrollToResults(results) {
      const { top } = results.getBoundingClientRect();
      if (top < 0 || top > window.innerHeight) {
        results.scrollIntoView({ behavior: 'auto', block: 'start' });
        window.scrollBy({ top: -12 });
      }
    },
    analytics: {
      onClear: pushEventsClearFiltersEvent,
      onCommit({ action, state, snapshot }) {
        const linkMeta =
          action === 'keyword'
            ? { linkTitle: 'search events', linkType: 'search text box' }
            : { linkTitle: 'events filter apply', linkType: 'filter' };
        pushEventsFilterSearchEvent({
          ...linkMeta,
          count: snapshot.total,
          filter: {
            product: state.filters.el_product,
            eventType: state.filters.el_contenttype,
            series: state.filters.el_event_series,
          },
          sortBy: state.sort === 'relevance' ? 'relevancy' : state.sort,
          term: state.keyword,
        });
      },
    },
  };
}
