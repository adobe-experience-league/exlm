import {
  fetchLanguagePlaceholders,
  fetchWithFallback,
  getPathDetails,
  xssSanitizeQueryParamValue,
} from '../../scripts.js';
import { createCollectionSortPolicy, createEventSortPolicy, readEventSort } from '../components/sort-control.js';
import { alphabetical, getEventFacetItems, getPlaylistFacetItems } from '../components/filters.js';
import { renderPlaylistCard } from '../components/cards.js';

const SUPPORTED_CONTENT_TYPES = ['event', 'playlist', 'perspective'];

export default async function createContentConfig({
  contentType,
  filters = false,
  sort = false,
  viewSwitcher = false,
  pagination = false,
  filterLabel,
}) {
  if (!SUPPORTED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Faceted-search configuration is not implemented for content type: ${contentType}`);
  }
  const features = { filters, sort, viewSwitcher, pagination };
  Object.entries(features).forEach(([name, value]) => {
    if (typeof value !== 'boolean') throw new Error(`Faceted-search ${name} must be a boolean`);
  });
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('faceted-search: failed to load placeholders; using default labels', error);
  }

  if (contentType === 'perspective') {
    const { default: createPerspectiveConfig } = await import('./perspective-config.js');
    return createPerspectiveConfig({ placeholders, filters, sort, pagination, filterLabel });
  }

  if (contentType === 'playlist') {
    const pageSize = pagination ? 12 : Infinity;
    return {
      groups: [
        { id: 'solution', name: placeholders.filterProductLabel || 'Product' },
        {
          id: 'role',
          name: placeholders.filterRoleLabel || 'Role',
          items: [
            {
              value: 'Developer',
              title: placeholders.filterRoleDeveloperTitle || 'Developer',
              description: placeholders.filterRoleDeveloperDescription,
            },
            {
              value: 'User',
              title: placeholders.filterRoleUserTitle || 'User',
              description: placeholders.filterRoleUserDescription,
            },
            {
              value: 'Leader',
              title: placeholders.filterRoleLeaderTitle || 'Leader',
              description: placeholders.filterRoleLeaderDescription,
            },
            {
              value: 'Admin',
              title: placeholders.filterRoleAdminTitle || 'Admin',
              description: placeholders.filterRoleAdminDescription,
            },
          ],
        },
        {
          id: 'level',
          name: placeholders.filterExperienceLevelLabel || 'Experience Level',
          items: [
            {
              value: 'Beginner',
              title: placeholders.filterExpLevelBeginnerTitle || 'Beginner',
              description: placeholders.filterExpLevelBeginnerDescription,
            },
            {
              value: 'Intermediate',
              title: placeholders.filterExpLevelIntermediateTitle || 'Intermediate',
              description: placeholders.filterExpLevelIntermediateDescription,
            },
            {
              value: 'Experienced',
              title: placeholders.filterExpLevelExperiencedTitle || 'Experienced',
              description: placeholders.filterExpLevelExperiencedDescription,
            },
          ],
        },
      ],
      filters,
      search: true,
      pageSize,
      resultsPrefix: 'playlist-browse',
      resultClasses: { body: 'browse-cards-block', grid: 'browse-cards-block-content playlist-browse-cards' },
      labels: {
        filtersLabel: placeholders.filterLabel || 'Filters',
        filterClearLabel: placeholders.filterClearLabel || 'Clear filters',
        searchPlaceholder: placeholders.playlistSearchPlaceholder || 'Search playlists',
        clearSearchLabel: placeholders.playlistClearSearchLabel || 'Clear search',
        resultsSuffix: placeholders.playlistsLabel || 'playlists',
        sort: placeholders.filterSortLabel || 'Sort:',
        noResults:
          placeholders.noResultsTextBrowse ||
          'We are sorry, no results found matching the criteria. Try adjusting your search to view more content.',
        clearSearch: placeholders.filterClearLabel || 'Clear filters',
      },
      sort: sort
        ? createCollectionSortPolicy({
            options: [
              { value: '', label: placeholders.sortDefaultLabel || 'Default' },
              { value: 'title-asc', label: placeholders.sortTitleAscLabel || 'Title (A-Z)' },
              { value: 'title-desc', label: placeholders.sortTitleDescLabel || 'Title (Z-A)' },
            ],
          })
        : false,
      pagination: pagination
        ? {
            pageSize,
            labels: {
              previous: placeholders.playlistPreviousLabel || 'Previous',
              next: placeholders.playlistNextLabel || 'Next',
              pages: `${placeholders.playlistOfLabel || 'of'} {count}`,
              page: `${placeholders.playlistOfLabel || 'of'} {count}`,
            },
          }
        : false,
      source: {
        type: 'collection',
        url: {
          format: 'repeat',
          keywordParam: 'q',
          pageParam: pagination ? 'page' : null,
          sortParam: sort ? 'sort' : null,
          sanitize: xssSanitizeQueryParamValue,
        },
        async loadItems() {
          const { lang } = getPathDetails();
          const response = await fetchWithFallback(
            `${window.hlx.codeBasePath}/${lang}/playlists.json`,
            `${window.hlx.codeBasePath}/en/playlists.json`,
          );
          if (!response.ok) throw new Error(`Failed to load playlists (${response.status})`);
          const data = await response.json();
          return data.data;
        },
      },
      getFacetItems: getPlaylistFacetItems,
      cards: { type: 'playlist', dataFormat: 'models', viewSwitcher },
      renderItem: (wrapper, item) => renderPlaylistCard(wrapper, item, placeholders),
      scrollToResults: () => window.scrollTo({ top: 0 }),
    };
  }

  const [
    { BASE_COVEO_ADVANCED_QUERY_EVENTS },
    { eventTypeOptions, getBrowseFiltersResultCount },
    { CONTENT_TYPES },
    { pushEventsFilterSearchEvent, pushEventsClearFiltersEvent },
  ] = await Promise.all([
    import('../../browse-card/browse-cards-constants.js'),
    import('../../../blocks/browse-filters/browse-filter-utils.js'),
    import('../../data-service/coveo/coveo-exl-pipeline-constants.js'),
    import('../../analytics/lib-analytics.js'),
  ]);
  const pageSize = getBrowseFiltersResultCount();
  return {
    groups: [
      { id: 'el_product', name: placeholders.eventSearchFilterProductLabel || 'Product' },
      {
        id: 'el_contenttype',
        name: placeholders.eventSearchFilterEventTypeLabel || 'Event Type',
        items: eventTypeOptions.items
          .map((item) => ({ value: item.value || item.title, title: item.title || item.value }))
          .sort(alphabetical),
      },
      { id: 'el_event_series', name: placeholders.eventSearchFilterEventSeriesLabel || 'Series' },
    ],
    filters,
    pageSize,
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
    sort: sort ? createEventSortPolicy(placeholders, CONTENT_TYPES) : false,
    pagination: pagination
      ? {
          pageSize,
          labels: {
            previous: placeholders.eventSearchPaginationPreviousAriaLabel,
            next: placeholders.eventSearchPaginationNextAriaLabel,
            pageInput: placeholders.eventSearchPaginationPageInputAriaLabel,
            pages: placeholders.eventSearchPagesLabel,
            page: placeholders.eventSearchPageLabel,
          },
        }
      : false,
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
    cards: { type: 'events', viewSwitcher },
    scrollToResults: true,
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
