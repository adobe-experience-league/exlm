import {
  fetchLanguagePlaceholders,
  fetchWithFallback,
  getPathDetails,
  xssSanitizeQueryParamValue,
} from '../../scripts.js';
import {
  createCollectionSortPolicy,
  createCourseSortPolicy,
  createEventSortPolicy,
  createPerspectiveSortPolicy,
  readCourseSort,
  readEventSort,
  readPerspectiveSort,
} from '../components/sort-control.js';
import {
  alphabetical,
  createCourseLegacyFilterMapper,
  getCourseFacetItems,
  getCoveoFacetItems,
  getPlaylistFacetItems,
} from '../components/filters.js';
import { createCourseCardHandlers, createCourseStatusView, renderPlaylistCard } from '../components/cards.js';
import { migrateLegacyCourseUrlParams } from '../state/url-state.js';

function createPlaylistConfig({ placeholders, filters, sort, viewSwitcher, pagination }) {
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
      clearSearch: placeholders.playlistClearSearchLabel || placeholders.filterClearSearchLabel || 'Clear search',
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

async function createEventConfig({ placeholders, filters, sort, viewSwitcher, pagination }) {
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
    getFacetItems: getCoveoFacetItems,
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

async function createPerspectiveConfig({ placeholders, filters, sort, viewSwitcher, pagination }) {
  const { lang: pathLang } = getPathDetails();
  const lang = pathLang || 'en';
  const filterUtilsPromise = import('../../../blocks/browse-filters/browse-filter-utils.js');
  const [constants, filterUtils, perspectiveIndex] = await Promise.all([
    import('../../browse-card/browse-cards-constants.js'),
    filterUtilsPromise,
    filterUtilsPromise.then(({ fetchPerspectiveIndex }) =>
      fetchPerspectiveIndex(lang).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(
          'faceted-search perspective: failed to load the perspective index; using Coveo product values',
          error,
        );
        return null;
      }),
    ),
  ]);
  const { BASE_COVEO_ADVANCED_QUERY } = constants;
  const { authorOptions, getBrowseFiltersResultCount, roleOptions } = filterUtils;

  let productItems = [];
  if (perspectiveIndex) {
    const solutions = perspectiveIndex
      .flatMap((entry) => entry?.coveoSolution?.split(/[,;]/) ?? [])
      .map((solution) => solution.trim())
      .filter((solution) => solution && !solution.includes('|'));
    productItems = Array.from(new Set(solutions))
      .sort((a, b) => a.localeCompare(b, lang, { sensitivity: 'base' }))
      .map((solution) => ({ description: '', id: solution.toLowerCase(), title: solution, value: solution }));
  }

  const pageSize = getBrowseFiltersResultCount();
  return {
    groups: [
      {
        id: 'el_product',
        name: placeholders.filterProductLabel || 'Product',
        ...(productItems.length && { items: productItems }),
      },
      { id: roleOptions.id, name: placeholders.filterRoleLabel || 'Role', items: roleOptions.items },
      { id: authorOptions.id, name: placeholders.filterAuthorLabel || 'Author Type', items: authorOptions.items },
    ],
    filters,
    search: true,
    pageSize,
    resultsPrefix: 'perspectives-search',
    cardColumns: false,
    labels: {
      filtersLabel: placeholders.filterLabel || 'Filters',
      filterClearLabel: placeholders.filterClearLabel || 'Clear filters',
      searchPlaceholder: placeholders.filterSearchPlaceholder || placeholders.searchPlaceholder || 'Search',
      clearSearchLabel: placeholders.filterClearSearchLabel || 'Clear search',
      activeFiltersAriaLabel: placeholders.filterActiveFiltersAriaLabel || 'Active filters',
      sort: placeholders.filterSortLabel || 'Sort:',
      resultsSuffix: placeholders.filterResultsLabel || 'results',
      noResultsPrefix: placeholders.noResultsPrefixBrowse,
      noResults:
        placeholders.noResultsTextBrowse ||
        'We are sorry, no results found matching the criteria. Try adjusting your search to view more content.',
      clearSearch: placeholders.filterClearSearchLabel || 'Clear search',
      error: placeholders.filterSearchErrorMessage || 'Perspectives could not be loaded. Please try again.',
    },
    sort: sort ? createPerspectiveSortPolicy(placeholders) : false,
    pagination: pagination
      ? {
          pageSize,
          labels: {
            previous: placeholders.filterPreviousPageLabel || 'Previous page',
            next: placeholders.filterNextPageLabel || 'Next page',
            pageInput: placeholders.filterPageInputLabel || 'Enter page number',
            pages: placeholders.filterPagesLabel || 'of {count} pages',
            page: placeholders.filterPageLabel || 'of {count} page',
          },
        }
      : false,
    source: {
      readSort: readPerspectiveSort,
      facetOverrides: {
        el_product: { numberOfValues: 500, options: { filterFacetCount: true, sortCriteria: 'alphanumeric' } },
      },
      hideAqFromUrl: true,
      baseAdvancedQuery: `(@el_contenttype=="Perspective") AND ${BASE_COVEO_ADVANCED_QUERY}`,
    },
    getFacetItems: getCoveoFacetItems,
    cards: { type: 'perspective', viewSwitcher },
    scrollToResults: true,
  };
}

async function createCourseConfig({ placeholders, filters, sort, viewSwitcher, pagination }) {
  const { isSignedInUser } = await import('../../auth/profile.js');
  const signedIn = await isSignedInUser();
  migrateLegacyCourseUrlParams();
  const contentType = 'Course';
  const tabId = 'Courses';
  const pageSize = pagination ? 12 : 1000;
  const cardHandlers = createCourseCardHandlers({
    signedIn,
    originLevel2: tabId,
    pageSize: pagination ? pageSize : undefined,
  });
  const remapFilters = createCourseLegacyFilterMapper();
  return {
    groups: [
      { id: 'el_product', name: placeholders.filterProductLabel || 'Product' },
      { id: 'el_level', name: placeholders.filterLevelLabel || 'Level' },
    ],
    filters,
    search: true,
    pageSize,
    resultsPrefix: 'browse-courses',
    cardColumns: false,
    labels: {
      filtersLabel: placeholders.filterLabel || 'Filters',
      filterClearLabel: placeholders.filterClearLabel || 'Clear filters',
      searchPlaceholder: placeholders.courseSearchPlaceholder || placeholders.searchPlaceholder || 'Search courses',
      clearSearchLabel: placeholders.filterClearSearchLabel || 'Clear search',
      activeFiltersAriaLabel: placeholders.filterActiveFiltersAriaLabel || 'Active filters',
      sort: placeholders.filterSortLabel || 'Sort:',
      resultsSuffix: placeholders.courseResultsCountSuffix || 'courses',
      noResults: placeholders.courseNoResultsText || 'No courses found for the selected filters.',
      clearSearch: placeholders.filterClearSearchLabel || 'Clear search',
      error: placeholders.courseLoadError || 'Failed to load courses. Please try again.',
    },
    sort: sort ? createCourseSortPolicy(placeholders) : false,
    pagination: pagination
      ? {
          pageSize,
          labels: {
            previous: placeholders.filterPreviousPageLabel || 'Previous page',
            next: placeholders.filterNextPageLabel || 'Next page',
            pageInput: placeholders.filterPageInputLabel || 'Enter page number',
            pages: placeholders.filterPagesLabel || 'of {count} pages',
            page: placeholders.filterPageLabel || 'of {count} page',
          },
        }
      : false,
    source: {
      readSort: readCourseSort,
      facetOverrides: {
        el_product: { numberOfValues: 500, options: { filterFacetCount: true, sortCriteria: 'alphanumeric' } },
      },
      hideAqFromUrl: true,
      baseAdvancedQuery: `@el_contenttype=="${contentType}"`,
      lockedFacets: { el_contenttype: [contentType] },
      tabId,
    },
    getFacetItems: (group, values, state) => getCourseFacetItems(group, values, state, placeholders),
    cards: { type: 'course', viewSwitcher },
    ...cardHandlers,
    ...(signedIn && { createView: createCourseStatusView(placeholders) }),
    afterRender(context) {
      cardHandlers.afterRender();
      remapFilters(context);
    },
    scrollToResults: true,
  };
}

const CONTENT_CONFIGS = {
  event: createEventConfig,
  playlist: createPlaylistConfig,
  perspective: createPerspectiveConfig,
  course: createCourseConfig,
};

export default async function createContentConfig({
  contentType,
  filters = false,
  sort = false,
  viewSwitcher = false,
  pagination = false,
}) {
  if (!Object.hasOwn(CONTENT_CONFIGS, contentType)) {
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
  return CONTENT_CONFIGS[contentType]({ placeholders, ...features });
}
