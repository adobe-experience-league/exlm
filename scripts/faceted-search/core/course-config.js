import { createTag } from '../../scripts.js';
import { createCourseSortPolicy, readCourseSort } from '../components/sort-control.js';
import { alphabetical, getCoveoFacetItems } from '../components/filters.js';

/**
 * Coveo Search API `tab` / UA `originLevel2` for the Courses Hub interface only.
 * @see EXLM-6193
 */
export const COURSES_SEARCH_TAB = 'Courses';
const COURSE_CONTENT_TYPE = 'Course';
/** Courses are not paginated; one request returns the whole catalog (Coveo's maximum page size). */
const NUMBER_OF_RESULTS = 1000;
const LEVEL_PRIORITY = ['Beginner', 'Intermediate', 'Experienced'];

function rankLevel(value) {
  const index = LEVEL_PRIORITY.findIndex((level) => level.toLowerCase() === String(value).toLowerCase());
  return index < 0 ? LEVEL_PRIORITY.length : index;
}

/** Legacy product links may differ from Coveo only by `|`. */
function matchesSanitizedFilter(a, b) {
  if (a === b) return true;
  const stripPipes = (s) => s?.replace(/\|/g, '');
  return stripPipes(a) === stripPipes(b);
}

/** Map selected products onto Coveo values (pipe-insensitive). false = retry later. */
function remapProductFilters(store, snapshot) {
  const selected = store.get().filters.el_product || [];
  if (!selected.length) return true;
  const facetValues = (snapshot.facets?.el_product || []).map((value) => value.value);
  if (!facetValues.length) return false;
  const mapped = selected.map((legacy) => facetValues.find((value) => matchesSanitizedFilter(value, legacy)) || legacy);
  if (mapped.some((value, index) => value !== selected[index])) store.setGroup('el_product', mapped);
  return true;
}

/** Product uses shared Coveo facet helper; Level keeps Beginner → Experienced order. */
function getCourseFacetItems(group, values, state, placeholders) {
  if (group.id !== 'el_level') return getCoveoFacetItems(group, values, state);
  const selected = new Set(state.filters[group.id]);
  return values
    .filter((value) => selected.has(value.value) || value.count > 0)
    .map((value) => ({
      ...value,
      title: placeholders[`filterExpLevel${value.value}Title`] || value.value,
      description: placeholders[`filterExpLevel${value.value}Description`] || '',
    }))
    .sort((a, b) => rankLevel(a.value) - rankLevel(b.value) || alphabetical(a, b));
}

/**
 * Status filter chrome for signed-in users. Status comes from profile enrichment, not Coveo.
 * Mounted into the shared toolbar; toggles `hidden` on rendered cards only.
 */
function createStatusView(placeholders) {
  const selectedStatuses = new Set();
  const resultsSuffix = placeholders.courseResultsCountSuffix || 'courses';
  return async ({ block, body, controls, store }) => {
    const [{ default: Dropdown }, { COURSE_STATUS }] = await Promise.all([
      import('../../dropdown/dropdown.js'),
      import('../../browse-card/browse-cards-constants.js'),
    ]);
    const label = placeholders.filterCourseStatusLabel || 'Status';
    const container = createTag('form', { class: 'browse-courses-status' });
    const emptyMessage = createTag('div', { class: 'browse-courses-status-empty', role: 'status', hidden: '' });
    emptyMessage.textContent = placeholders.courseNoResultsText || 'No courses found for the selected filters.';
    controls.prepend(container);
    body.append(emptyMessage);

    let dropdown = null;
    let optionsKey = '';
    let coveoTotal = null;
    const items = () => [...body.querySelectorAll('.browse-courses-card-item')];

    function syncResultCount() {
      const countEl = block.querySelector('.fs-results-count');
      if (!countEl || coveoTotal == null) return;
      const display = selectedStatuses.size > 0 ? items().filter((card) => !card.hidden).length : coveoTotal;
      const value = createTag('strong', { class: 'fs-results-count-value' });
      value.textContent = new Intl.NumberFormat().format(display);
      countEl.replaceChildren(value, document.createTextNode(` ${resultsSuffix}`));
    }

    function applyStatus() {
      const cards = items();
      cards.forEach((card) => {
        const hide = selectedStatuses.size > 0 && !selectedStatuses.has(card.dataset.courseStatus);
        card.hidden = hide;
      });
      emptyMessage.hidden = !cards.length || cards.some((card) => !card.hidden);
      syncResultCount();
    }

    function resetStatus() {
      selectedStatuses.clear();
      dropdown?.reset();
      applyStatus();
    }

    function syncOptions() {
      const present = new Set(
        items()
          .map((card) => card.dataset.courseStatus)
          .filter(Boolean),
      );
      const all = [
        { value: COURSE_STATUS.NOT_STARTED, title: placeholders.courseStatusNotStarted || 'Not Started' },
        { value: COURSE_STATUS.IN_PROGRESS, title: placeholders.courseStatusInProgress || 'In Progress' },
        { value: COURSE_STATUS.COMPLETED, title: placeholders.courseStatusCompleted || 'Completed' },
      ];
      const options = all.filter(({ value }) => present.has(value));
      [...selectedStatuses].forEach((value) => {
        if (!present.has(value)) selectedStatuses.delete(value);
      });
      const key = options.map(({ value }) => value).join();
      if (key === optionsKey) return;
      optionsKey = key;
      dropdown?.remove();
      dropdown = null;
      if (!options.length) return;
      dropdown = new Dropdown(container, label, options, 'multi-select', 'status-dropdown');
      dropdown.updateDropdownValues(Object.fromEntries([...selectedStatuses].map((value) => [value, true])));
      dropdown.handleOnChange((selected) => {
        selectedStatuses.clear();
        String(selected || '')
          .split(',')
          .filter(Boolean)
          .forEach((value) => selectedStatuses.add(value));
        applyStatus();
      });
    }

    const onClear = (event) => {
      if (!event.target.closest('.fs-clear-filters, .browse-courses-no-results-clear')) return;
      resetStatus();
    };
    block.addEventListener('click', onClear);
    const unsubClear = store?.subscribe((_state, action) => {
      if (action === 'clear') resetStatus();
    });

    return {
      afterRender({ snapshot } = {}) {
        if (typeof snapshot?.total === 'number') coveoTotal = snapshot.total;
        syncOptions();
        applyStatus();
      },
      destroy() {
        block.removeEventListener('click', onClear);
        unsubClear?.();
        dropdown?.remove();
        container.remove();
        emptyMessage.remove();
      },
    };
  };
}

function hasModuleCount(card) {
  return card.el_course_module_count != null && card.el_course_module_count !== '';
}

async function enrichModuleCount(wrapper, card) {
  const [{ getCurrentCourseMeta }, { buildCard }] = await Promise.all([
    import('../../courses/course-utils.js'),
    import('../../browse-card/browse-card.js'),
  ]);
  const courseMeta = await getCurrentCourseMeta(card.viewLink);
  if (!wrapper.isConnected || !Array.isArray(courseMeta?.modules) || hasModuleCount(card)) return;

  // eslint-disable-next-line no-param-reassign
  card.el_course_module_count = String(courseMeta.modules.length);
  const statusRow = wrapper.querySelector('.browse-card-status-row');
  if (!statusRow || statusRow.querySelector('.browse-card-module-count')) return;

  if (!wrapper.isConnected) return;
  const scratch = createTag('div');
  await buildCard(scratch, card);
  if (!wrapper.isConnected) return;
  const moduleCount = scratch.querySelector('.browse-card-module-count');
  if (moduleCount && !statusRow.querySelector('.browse-card-module-count')) statusRow.append(moduleCount);
}

async function enrichWithCourseStatus(cards) {
  try {
    const [{ getCurrentCourses }, { default: BrowseCardsCourseEnricher }] = await Promise.all([
      import('../../courses/course-profile.js'),
      import('../../browse-card/browse-cards-course-enricher.js'),
    ]);
    return BrowseCardsCourseEnricher.enrichCardsWithCourseStatus(cards, await getCurrentCourses());
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('faceted-search course: course progress enrichment failed', error);
    return cards;
  }
}

/** Match browse-courses.css column counts (incl. 1024 sidebar). */
function getShimmerCount() {
  const width = window.innerWidth;
  if (width >= 1200) return 3;
  if (width >= 1024) return 2;
  if (width >= 900) return 3;
  if (width >= 600) return 2;
  return 1;
}

/**
 * Builds the faceted-search preset for Courses (Coveo Headless + Courses tab).
 * The Courses tab's query pipeline ignores aq/cq, so scope uses lockedFacets.
 */
export default async function createCourseConfig({
  placeholders,
  filters,
  sort,
  pagination,
  filterLabel,
  signedIn = false,
}) {
  const { default: BrowseCardShimmer } = await import('../../browse-card/browse-card-shimmer.js');
  const pageSize = pagination ? 12 : NUMBER_OF_RESULTS;
  let productRemapDone = false;

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
      filtersLabel: filterLabel || placeholders.filterLabel || 'Filters',
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
      numberOfResults: pageSize,
      facetOverrides: {
        el_product: { numberOfValues: 500, options: { filterFacetCount: true, sortCriteria: 'alphanumeric' } },
      },
      hideAqFromUrl: true,
      // Kept for analytics/debug; Courses tab ignores aq — lockedFacets carries the real scope.
      baseAdvancedQuery: `@el_contenttype=="${COURSE_CONTENT_TYPE}"`,
      lockedFacets: { el_contenttype: [COURSE_CONTENT_TYPE] },
      tabId: COURSES_SEARCH_TAB,
    },
    getFacetItems: (group, values, state) => getCourseFacetItems(group, values, state, placeholders),
    cards: { type: 'course' },
    createLoading: () => {
      const shimmer = new BrowseCardShimmer(getShimmerCount(), 'course');
      const addShimmer = shimmer.addShimmer.bind(shimmer);
      const removeShimmer = shimmer.removeShimmer.bind(shimmer);
      shimmer.addShimmer = (target) => {
        target?.closest('.browse-courses')?.classList.add('browse-courses-loading');
        return addShimmer(target);
      };
      shimmer.removeShimmer = () => {
        const host = shimmer.shimmerContainer?.closest('.browse-courses');
        const result = removeShimmer();
        host?.classList.remove('browse-courses-loading');
        return result;
      };
      return shimmer;
    },
    async prepareItems(results) {
      const { default: BrowseCardsCoveoDataAdaptor } = await import(
        '../../browse-card/browse-cards-coveo-data-adaptor.js'
      );
      let cards = await BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(results);
      cards.forEach((card) => {
        // eslint-disable-next-line no-param-reassign
        card.originLevel2 = COURSES_SEARCH_TAB;
      });
      if (signedIn) cards = await enrichWithCourseStatus(cards);
      return cards;
    },
    async renderItem(wrapper, card) {
      const { buildCard } = await import('../../browse-card/browse-card.js');
      await buildCard(wrapper, card);
      const status = card.meta?.courseInfo?.courseStatus;
      if (status) {
        // eslint-disable-next-line no-param-reassign
        wrapper.dataset.courseStatus = status;
      }
      if (!hasModuleCount(card) && card.viewLink) enrichModuleCount(wrapper, card).catch(() => undefined);
    },
    ...(signedIn && { createView: createStatusView(placeholders) }),
    afterRender({ store, snapshot }) {
      if (!productRemapDone) productRemapDone = remapProductFilters(store, snapshot);
    },
    scrollToResults: true,
  };
}
