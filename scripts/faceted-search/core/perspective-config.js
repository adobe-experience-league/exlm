import { getPathDetails } from '../../scripts.js';
import { createPerspectiveSortPolicy, readPerspectiveSort } from '../components/sort-control.js';
import { getCoveoFacetItems } from '../components/filters.js';

/**
 * Builds the faceted-search preset for Perspectives (Coveo Headless, no Tab).
 * AQ scopes to Perspective; product options come from the perspective index when available.
 */
export default async function createPerspectiveConfig({ placeholders, filters, sort, pagination, filterLabel }) {
  const [
    { BASE_COVEO_ADVANCED_QUERY },
    { authorOptions, fetchPerspectiveIndex, getBrowseFiltersResultCount, roleOptions },
  ] = await Promise.all([
    import('../../browse-card/browse-cards-constants.js'),
    import('../../../blocks/browse-filters/browse-filter-utils.js'),
  ]);

  let productItems = [];
  try {
    const { lang } = getPathDetails();
    const perspectiveIndex = await fetchPerspectiveIndex(lang || 'en');
    const solutions = perspectiveIndex
      .flatMap((entry) => entry?.coveoSolution?.split(/[,;]/) ?? [])
      .map((solution) => solution.trim())
      .filter((solution) => solution && !solution.includes('|'));
    productItems = Array.from(new Set(solutions))
      .sort()
      .map((solution) => ({ description: '', id: solution.toLowerCase(), title: solution, value: solution }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      'faceted-search perspective: failed to load the perspective index; using Coveo product values',
      error,
    );
  }

  const pageSize = getBrowseFiltersResultCount();
  const advancedQuery = `(@el_contenttype=="Perspective") AND ${BASE_COVEO_ADVANCED_QUERY}`;

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
      filtersLabel: filterLabel || placeholders.filterLabel || 'Filters',
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
      numberOfResults: pageSize,
      facetOverrides: {
        el_product: { numberOfValues: 500, options: { filterFacetCount: true, sortCriteria: 'alphanumeric' } },
      },
      hideAqFromUrl: true,
      baseAdvancedQuery: advancedQuery,
    },
    getFacetItems: getCoveoFacetItems,
    cards: { type: 'perspective' },
    // Boolean form is supported by the controller (same as events); see createFacetedSearch scrollToResults.
    scrollToResults: true,
  };
}
