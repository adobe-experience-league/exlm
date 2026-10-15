/**
 * Browse Courses Block
 * Filterable grid of courses (product, level, and status for signed-in users)
 * rendered with the shared search-filter sidebar.
 *
 * - Product + Level changes trigger an API fetch
 * - Status changes filter client-side (no API call)
 * - Product + Level are reflected in the URL (?product=a,b&level=x)
 */

import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { fetchLanguagePlaceholders, xssSanitizeQueryParamValue, createTag } from '../../scripts/scripts.js';
import { loadCSS } from '../../scripts/lib-franklin.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { COURSE_STATUS } from '../../scripts/browse-card/browse-cards-constants.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import {
  createFilterStore,
  createSearchFilterUI,
  createSidebarLayout,
  readFiltersFromUrl,
  readKeywordFromUrl,
  bindFiltersToUrl,
  createStoreSort,
  getDefaultSortOptions,
  sortItems,
} from '../../scripts/search-filter/search-filter.js';

/** Module-level placeholders for internationalization */
let placeholders = {};
const numberOfResults = 1000;

// Keyword search goes to the API as this param (same idea as Events' `q`).
// Set USE_API_KEYWORD to false to fall back to filtering the loaded courses in the browser.
const USE_API_KEYWORD = true;
const KEYWORD_PARAM = 'q';

const CSS_CLASSES = {
  HEADER: 'browse-cards-block-header',
  TITLE: 'browse-cards-block-title',
  CONTENT: 'browse-cards-block-content',
};

const LEVEL_PRIORITY = {
  Beginner: 0,
  Intermediate: 1,
  Experienced: 2,
};

/** Product values may have their pipe separators stripped by URL sanitizing. */
function matchesSanitizedFilter(a, b) {
  if (a === b) return true;
  const stripPipes = (s) => s?.replace(/\|/g, '');
  return stripPipes(a) === stripPipes(b);
}

/** Case-insensitive; every word must appear in the card's title, description, product or level. */
function matchesKeyword(course, keyword) {
  const terms = String(keyword).toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = [course.title, course.description, course.product, course.el_level]
    .flat()
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

/** Level names -> sorted [{ title, value }] */
function transformLevelsForDropdown(levels) {
  const sortedLevels = [...levels].sort((a, b) => (LEVEL_PRIORITY[a] ?? -1) - (LEVEL_PRIORITY[b] ?? -1));
  return sortedLevels.map((level) => ({
    title: placeholders?.[`filterExpLevel${level}Title`] || level,
    value: level,
  }));
}

function getResponsiveShimmerCount() {
  const viewportWidth = window.innerWidth;
  if (viewportWidth >= 1200) return 3;
  if (viewportWidth >= 600) return 2;
  return 1;
}

function addShimmerWrapper(block, shimmer) {
  const contentDiv = block.querySelector(`.${CSS_CLASSES.CONTENT}`);
  if (!contentDiv) return;
  contentDiv.innerHTML = '';
  const shimmerWrapper = document.createElement('div');
  shimmerWrapper.className = 'shimmer-grid-wrapper';
  contentDiv.appendChild(shimmerWrapper);
  shimmer.updateCount(getResponsiveShimmerCount());
  shimmer.addShimmer(shimmerWrapper);
}

async function renderCards(block, courseData, shimmer) {
  const contentDiv = block.querySelector(`.${CSS_CLASSES.CONTENT}`);
  if (!contentDiv) return;

  try {
    shimmer.removeShimmer();
    contentDiv.innerHTML = '';

    if (courseData?.length > 0) {
      const fragment = document.createDocumentFragment();
      courseData.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        buildCard(cardDiv, cardData);
        fragment.appendChild(cardDiv);
      });
      contentDiv.appendChild(fragment);
    } else {
      const noResultsMessage = placeholders?.courseNoResultsText || 'No courses found for the selected filters.';
      contentDiv.innerHTML = `<div class="course-no-results">${noResultsMessage}</div>`;
    }
  } catch (error) {
    shimmer.removeShimmer();
    // eslint-disable-next-line no-console
    console.error('Error rendering browse cards:', error);
    const errorMessage = placeholders?.courseLoadError || 'Failed to load courses. Please try again.';
    contentDiv.innerHTML = `<div class="course-no-results">${errorMessage}</div>`;
  }
}

function getValidFacets(facetsResponse, facetKey) {
  const facets = facetsResponse?.find((facet) => facet.field === facetKey)?.values || [];
  return facets.filter((facet) => facet.numberOfResults > 0).map((facet) => facet.value);
}

function populateValidFacets(facetsResponse, state) {
  state.validLevels = getValidFacets(facetsResponse, 'el_level');
  state.validProducts = getValidFacets(facetsResponse, 'el_product');
}

/**
 * Fetches course data (auto-enriched with meta.courseInfo.courseStatus for signed-in users).
 */
async function fetchCourseData(selectedFilters = [], selectedLevels = [], state = {}, keyword = '') {
  const param = {
    contentType: CONTENT_TYPES.COURSE.MAPPING_KEY.toLowerCase().split(','),
    ...(selectedFilters.length > 0 && { product: selectedFilters }),
    ...(selectedLevels.length > 0 && { level: selectedLevels, el_level_all: state?.allLevels }),
    ...(keyword && { [KEYWORD_PARAM]: keyword }),
    el_product_all: state?.allProducts,
    noOfResults: numberOfResults,
  };

  const data = await BrowseCardsDelegate.fetchCardData(param);
  const facetsResponse = BrowseCardsDelegate.fetchFacetsData(param);
  state.facetsResponse = facetsResponse;
  populateValidFacets(facetsResponse, state);

  return data;
}

function analyzeCourseStatuses(courseData) {
  const statuses = { hasNotStarted: false, hasInProgress: false, hasCompleted: false };
  (courseData || []).forEach((course) => {
    const status = course.meta?.courseInfo?.courseStatus;
    if (status === COURSE_STATUS.NOT_STARTED) statuses.hasNotStarted = true;
    else if (status === COURSE_STATUS.IN_PROGRESS) statuses.hasInProgress = true;
    else if (status === COURSE_STATUS.COMPLETED) statuses.hasCompleted = true;
  });
  return statuses;
}

/** Unique values for a property (handles array and string properties). */
function analyzeCourseData(courseData, propertyName) {
  const valuesSet = new Set();
  (courseData || []).forEach((course) => {
    const prop = course[propertyName];
    if (Array.isArray(prop)) {
      prop.forEach((value) => value && valuesSet.add(value.trim()));
    } else if (prop && typeof prop === 'string') {
      valuesSet.add(prop.trim());
    }
  });
  return valuesSet;
}

function filterItemsForCourseData(allItems, courseData, propertyName) {
  const itemsInData = analyzeCourseData(courseData, propertyName);
  if (itemsInData.size === 0) return [];
  return allItems.filter((item) => itemsInData.has(item));
}

/** Status options present in the dataset -> [{ title, value }] */
function createStatusFilterOptions(courseData) {
  const statuses = analyzeCourseStatuses(courseData);
  const options = [];
  if (statuses.hasNotStarted) {
    options.push({
      title: placeholders?.courseStatusNotStarted || 'Not Started',
      value: COURSE_STATUS.NOT_STARTED,
    });
  }
  if (statuses.hasInProgress) {
    options.push({
      title: placeholders?.courseStatusInProgress || 'In Progress',
      value: COURSE_STATUS.IN_PROGRESS,
    });
  }
  if (statuses.hasCompleted) {
    options.push({
      title: placeholders?.courseStatusCompleted || 'Completed',
      value: COURSE_STATUS.COMPLETED,
    });
  }
  return options;
}

/**
 * Main decoration function for the browse-courses block.
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', error);
  }
  loadCSS(`${window.hlx.codeBasePath}/scripts/search-filter/search-filter.css`).catch(() => {});

  const headingElement = block.firstElementChild?.firstElementChild;
  const headingHtml = headingElement?.innerHTML || '';

  const isSignedIn = await isSignedInUser().catch(() => false);

  // All possible products/levels via Coveo facet fields
  const facetDetails = (await BrowseCardsDelegate.fetchCoveoFacetFields(['el_product', 'el_level'])) || {};
  const allProducts = facetDetails.el_product || [];
  const allLevels = facetDetails.el_level || [];

  const groups = [
    { id: 'product', name: placeholders.filterProductLabel || 'Product' },
    { id: 'level', name: placeholders.filterLevelLabel || 'Level' },
    ...(isSignedIn ? [{ id: 'status', name: placeholders.filterCourseStatusLabel || 'Status' }] : []),
  ];
  const groupIds = groups.map((g) => g.id);

  const sortOptions = getDefaultSortOptions(placeholders);
  const urlSort = readKeywordFromUrl('sort', xssSanitizeQueryParamValue);
  const store = createFilterStore({
    groupIds,
    initial: {
      ...readFiltersFromUrl(['product', 'level'], { format: 'comma', sanitize: xssSanitizeQueryParamValue }),
      keyword: readKeywordFromUrl('q', xssSanitizeQueryParamValue),
      sort: sortOptions.some((option) => option.value === urlSort) ? urlSort : '',
    },
  });
  const ui = createSearchFilterUI({
    store,
    groups,
    placeholders: {
      filtersLabel: placeholders.filterLabel,
      filterClearLabel: placeholders.filterClearLabel,
      searchPlaceholder: placeholders.courseSearchPlaceholder || 'Search courses',
      clearSearchLabel: placeholders.courseClearSearchLabel || 'Clear search',
    },
    withKeyword: true,
  });
  // status is not URL-backed
  bindFiltersToUrl(store, ['product', 'level'], { format: 'comma', keywordParam: 'q', sortParam: 'sort' });

  // Build DOM
  block.textContent = '';
  const header = createTag('div', { class: CSS_CLASSES.HEADER });
  header.append(createTag('div', { class: CSS_CLASSES.TITLE }, headingHtml));
  const contentDiv = createTag('div', { class: CSS_CLASSES.CONTENT });
  const { layout, results, controls } = createSidebarLayout({
    ui,
    placeholders: { filtersLabel: placeholders.filterLabel },
  });
  // sort is always visible
  const sort = createStoreSort({ store, ui, options: sortOptions, label: placeholders.sortLabel || 'Sort:' });
  controls.append(sort.el);
  results.append(contentDiv);
  block.append(header, layout);

  const shimmer = new BrowseCardShimmer(getResponsiveShimmerCount());
  const state = { courseData: [], isSignedIn, allLevels, allProducts };
  let lastApiKey = null;
  let requestId = 0;

  async function onChange({ filters, keyword, sort: sortBy }) {
    requestId += 1;
    const currentRequest = requestId;

    const apiKeyword = USE_API_KEYWORD ? keyword : '';
    const apiKey = JSON.stringify([filters.product, filters.level, apiKeyword]);
    if (apiKey !== lastApiKey) {
      lastApiKey = apiKey;
      ui.setLoading(true);
      ui.setResultCount(null);
      addShimmerWrapper(block, shimmer);

      let courseData;
      try {
        courseData = await fetchCourseData(filters.product, filters.level, state, apiKeyword);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching courses:', error);
        ui.setLoading(false);
        lastApiKey = null;
        await renderCards(block, [], shimmer);
        return;
      }
      // a newer change started while we were waiting; let it render
      if (currentRequest !== requestId) return;
      state.courseData = courseData;
      ui.setLoading(false);

      const productValues = state.validProducts?.length
        ? state.validProducts
        : filterItemsForCourseData(allProducts, courseData, 'product');
      const levelValues = state.validLevels?.length
        ? state.validLevels
        : filterItemsForCourseData(allLevels, courseData, 'el_level');

      // Without a keyword, selections that are no longer valid are dropped. With a keyword a selected
      // filter can simply have 0 matches, so it is kept (and stays listed so it can still be unchecked).
      const prune = !apiKeyword;
      const nextProducts =
        prune && !productValues.length
          ? filters.product
          : filters.product
              .map((p) => productValues.find((v) => matchesSanitizedFilter(v, p)) ?? (prune ? null : p))
              .filter(Boolean);
      const nextLevels =
        prune && levelValues.length ? filters.level.filter((l) => levelValues.includes(l)) : filters.level;

      ui.setGroupItems(
        'product',
        [...new Set([...productValues, ...nextProducts])].map((value) => ({ value })),
      );
      ui.setGroupItems('level', transformLevelsForDropdown([...new Set([...levelValues, ...nextLevels])]));

      // A real change emits, which re-enters onChange with a new API key and refetches.
      if (store.setGroup('product', nextProducts)) return;
      if (store.setGroup('level', nextLevels)) return;
    }

    // Status: client-side only
    let selectedStatuses = [];
    if (isSignedIn) {
      const statusOptions = createStatusFilterOptions(state.courseData);
      ui.setGroupItems('status', statusOptions);
      const available = statusOptions.map((o) => o.value);
      selectedStatuses = store.get().filters.status.filter((s) => available.includes(s));
      store.setGroup('status', selectedStatuses, { silent: true });
      ui.refresh();
    }

    const byStatus = selectedStatuses.length
      ? state.courseData.filter((c) => selectedStatuses.includes(c.meta?.courseInfo?.courseStatus))
      : state.courseData;
    // keyword is applied by the API (see USE_API_KEYWORD); the browser-side match is only the fallback
    const matched = !USE_API_KEYWORD && keyword ? byStatus.filter((c) => matchesKeyword(c, keyword)) : byStatus;
    // sort is client-side too, so changing it never triggers an API call
    const visible = sortItems(matched, sortBy);
    ui.setResultCount(
      visible.length,
      visible.length === 1
        ? placeholders.courseResultsCountSingular || 'course'
        : placeholders.courseResultsCountSuffix || 'courses',
    );

    await renderCards(block, visible, shimmer);
  }

  // Subscribe first so selection pruning inside onChange can trigger a refetch
  store.subscribe(onChange);
  await onChange(store.get());
}
