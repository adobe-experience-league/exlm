import { loadCSS } from '../../scripts/lib-franklin.js';
import { createTag, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { BASE_COVEO_ADVANCED_QUERY_EVENTS } from '../../scripts/browse-card/browse-cards-constants.js';
import {
  normalizeOnDemandEventModel,
  normalizeUpcomingEventModel,
} from '../../scripts/browse-card/browse-cards-delegate.js';
import BrowseCardsCoveoDataAdaptor from '../../scripts/browse-card/browse-cards-coveo-data-adaptor.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import BrowseCardViewSwitcher from '../../scripts/browse-card/browse-cards-view-switcher.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { COVEO_SEARCH_CUSTOM_EVENTS } from '../../scripts/search/search-utils.js';
import {
  eventTypeOptions,
  getBrowseFiltersResultCount,
  handleCoverSearchSubmit,
} from '../browse-filters/browse-filter-utils.js';
import { pushEventsFilterSearchEvent, pushEventsClearFiltersEvent } from '../../scripts/analytics/lib-analytics.js';
import {
  createFilterStore,
  createSearchFilterUI,
  createSidebarLayout,
  createSortControl,
} from '../../scripts/search-filter/search-filter.js';

const FACET_CONTROLLER_MAP = {
  el_product: 'headlessProductFacet',
  el_event_series: 'headlessEventSeriesFacet',
  el_contenttype: 'headlessTypeFacet',
};
const GROUP_IDS = ['el_product', 'el_contenttype', 'el_event_series'];

// Tracks active render pass per block; queues the next subscription fire instead of running two renders at once.
const headlessSubscriptionSyncDepth = new WeakMap();
/** Literal tokens authors enter in placeholders for dynamic counts. */
/* eslint-disable no-template-curly-in-string -- not JS templates; match placeholders sheet text */
const PLACEHOLDER_COUNT_TOKEN = '${count}';
const PLACEHOLDER_PG_COUNT_TOKEN = '${pgCount}';
/* eslint-enable no-template-curly-in-string */
const RESULTS_SCROLL_ADJUSTMENT_OFFSET = -12;
/** Max subscription passes we wait for Headless to catch up with a user interaction before syncing anyway. */
const MAX_PENDING_SYNC_PASSES = 12;

/**
 * Per-block filter context created in setupFilters:
 * { store, ui, sort (shared sort control), awaiting: { intent, passes }|null, isClearing, lastResponseId, itemKeys: Map }
 */
const filterContexts = new WeakMap();

const viewSwitcherInstances = new WeakMap();
/** AbortController + MutationObserver teardown for Coveo document listeners (re-decorate or DOM removal). */
const eventsSearchLoadingUiCleanups = new WeakMap();
/** Facet values behind the Event Type checkboxes, from the shared Coveo pipeline constants */
const EVENTS_SEARCH_UPCOMING_VALUE = CONTENT_TYPES.UPCOMING_EVENT_V2.MAPPING_KEY;
const EVENTS_SEARCH_ON_DEMAND_VALUE = CONTENT_TYPES.ON_DEMAND_EVENT.MAPPING_KEY;
/**
 * Per-block sort state: { selected: 'relevance'|'date'|'popularity', hasShownControl, sortController,
 * criteria, lastAppliedKey, placeholders, urlRestorePending, urlRestoreGraceRemaining, lastHasQuery }.
 */
const eventsSearchSortState = new WeakMap();
/**
 * Per-block analytics intent captured at interaction time.
 * { pendingType: 'filter'|'search'|null, lastSearchId: string|null, intent: { byFilterType, term }|null }.
 */
const eventsSearchAnalyticsState = new WeakMap();

// Helpers

// Fills count value into a placeholder string
function fillPlaceholderCount(template, value) {
  const s = String(value);
  return String(template)
    .replaceAll(PLACEHOLDER_COUNT_TOKEN, s)
    .replaceAll(PLACEHOLDER_PG_COUNT_TOKEN, s)
    .replaceAll('{}', s)
    .replaceAll('{count}', s);
}

function sortItemsAlphabetically(a, b) {
  const titleA = (a.title || '').toLowerCase();
  const titleB = (b.title || '').toLowerCase();
  return titleA.localeCompare(titleB, document.documentElement.lang || 'en');
}

function getEventsSearchHeadlessFacetOverrides() {
  return {
    el_product: { numberOfValues: 500, options: { filterFacetCount: true, sortCriteria: 'alphanumeric' } },
    el_event_series: { numberOfValues: 100, options: { filterFacetCount: true, sortCriteria: 'alphanumeric' } },
  };
}

function getEventsSearchAnalyticsState(block) {
  let state = eventsSearchAnalyticsState.get(block);
  if (!state) {
    state = { pendingType: null, lastSearchId: null, intent: null };
    eventsSearchAnalyticsState.set(block, state);
  }
  return state;
}

const ANALYTICS_FILTER_TYPE_TO_KEY = {
  el_product: 'product',
  el_contenttype: 'eventType',
  el_event_series: 'series',
};

function getFacetController(filterType) {
  const controllerName = FACET_CONTROLLER_MAP[filterType];
  return controllerName ? window[controllerName] : null;
}

/** Values currently selected for a filter group (from the shared filter store). */
function getCheckedFilterValues(block, filterType) {
  return filterContexts.get(block)?.store.get().filters[filterType] ?? [];
}

/**
 * True once the engine state has settled onto the captured intent: every facet controller's selected
 * values (per group) and the executed query equal the snapshot. The controllers and the search
 * response commit together but trail each interaction by one commit, so intermediate subscription
 * fires still show the previous selection; this gate rejects those until the controllers catch up to
 * the snapshot, at which point response.totalCount is the matching count (browse-filters pattern).
 */
function responseMatchesEventsSearchIntent(intent) {
  const search = window.headlessSearchEngine?.state?.search;
  if (!search?.response || !intent) return false;
  const filtersMatch = Object.keys(ANALYTICS_FILTER_TYPE_TO_KEY).every((filterType) => {
    const want = intent.byFilterType[filterType] ?? [];
    const controller = window[FACET_CONTROLLER_MAP[filterType]];
    const got = (controller?.state?.values ?? []).filter((v) => v.state === 'selected').map((v) => v.value);
    if (want.length !== got.length) return false;
    const wantSet = new Set(want);
    return got.every((v) => wantSet.has(v));
  });
  if (!filtersMatch) return false;
  return String(search.queryExecuted ?? '').trim() === intent.term;
}

/** Returns the per-block sort state, lazily creating it with defaults on first access. */
function getEventsSearchSortState(block) {
  let state = eventsSearchSortState.get(block);
  if (!state) {
    state = {
      selected: 'relevance',
      hasShownControl: false,
      sortController: null,
      criteria: null,
      lastAppliedKey: null,
      placeholders: {},
      urlRestorePending: false,
      urlRestoreGraceRemaining: null,
      lastHasQuery: false,
    };
    eventsSearchSortState.set(block, state);
  }
  return state;
}

/** Reads the current sort selection, normalizing the UI's "Relevance" label to the spec's "relevancy". */
function getEventsSearchSortBy(block) {
  const { selected } = getEventsSearchSortState(block);
  return selected === 'relevance' ? 'relevancy' : selected;
}

/** Derives the current filter/query state that determines which sort options are available. */
function getEventsSearchSortContext(block) {
  const checkedTypes = getCheckedFilterValues(block, 'el_contenttype');
  const upcomingChecked = checkedTypes.includes(EVENTS_SEARCH_UPCOMING_VALUE);
  const onDemandChecked = checkedTypes.includes(EVENTS_SEARCH_ON_DEMAND_VALUE);
  const upcomingOnly = upcomingChecked && !onDemandChecked;
  const onDemandOnly = onDemandChecked && !upcomingChecked;
  const hasQuery = Boolean(String(window.headlessSearchBox?.state?.value ?? '').trim());
  return { hasQuery, upcomingOnly, onDemandOnly, mixed: !upcomingOnly && !onDemandOnly };
}

/**
 * Sort options available for the current state: no control with no query and no
 * filter; Relevance only appears once a query is entered; Popularity only appears On-demand-only.
 */
function getAvailableEventsSearchSortOptions({ hasQuery, onDemandOnly, mixed }) {
  if (!hasQuery && mixed) return [];
  const options = [];
  if (hasQuery) options.push('relevance');
  options.push('date');
  if (onDemandOnly) options.push('popularity');
  return options;
}

/** Returns the localized dropdown/caption label for a sort option, falling back to English defaults. */
function getEventsSearchSortOptionLabel(option, placeholders) {
  if (option === 'date') return placeholders.eventSearchFilterSortDateLabel || 'Date';
  if (option === 'popularity') return placeholders.filterSortPopularityLabel || 'Popularity';
  return placeholders.filterSortRelevanceLabel || 'Relevance';
}

/**
 * True when results need the fixed Upcoming-then-On-demand grouped order applied client-side
 * (default view, and "Date" selected while mixed) rather than a single native Coveo field sort
 * (used directly for Upcoming-only/On-demand-only/Popularity, where one field sort is sufficient).
 */
function shouldGroupEventsSearchResults(block) {
  const context = getEventsSearchSortContext(block);
  if (!context.mixed) return false;
  const { selected } = getEventsSearchSortState(block);
  return !context.hasQuery || selected === 'date';
}

/**
 * Groups cards: Upcoming (soonest first), then On-demand (most recent first).
 * Event date is at `card.event.date` (ISO for Upcoming, unix-ms for On-demand) — both parse via `new Date()`.
 */
function groupUpcomingThenOnDemand(cards) {
  const isUpcoming = (card) =>
    card?.contentType?.toLowerCase() === CONTENT_TYPES.UPCOMING_EVENT_V2.MAPPING_KEY.toLowerCase();
  const eventDate = (card) => new Date(card?.event?.date ?? NaN);
  const upcoming = cards.filter(isUpcoming).sort((a, b) => eventDate(a) - eventDate(b));
  const onDemand = cards.filter((card) => !isUpcoming(card)).sort((a, b) => eventDate(b) - eventDate(a));
  return [...upcoming, ...onDemand];
}

/** Coveo sort criterion per option/context: Popularity→el_view_count, Upcoming Date-el_event_start_time, On-demand Date-date; mixed Date stays relevance (re-grouped client-side). */
function resolveEventsSearchSortCriterion(state, option, context) {
  const { criteria } = state;
  if (option === 'popularity') return criteria.field('el_view_count', 'descending');
  if (option === 'date') {
    if (context.upcomingOnly) return criteria.field('el_event_start_time', 'ascending');
    if (context.onDemandOnly) return criteria.date('descending');
  }
  return criteria.relevance();
}

/** Dispatches the resolved Coveo sort criterion, skipping the call when the same key was already applied. */
function applyEventsSearchSort(block, option, context) {
  const state = getEventsSearchSortState(block);
  if (!state.sortController) return;
  const appliedKey = `${option}:${context.upcomingOnly}:${context.onDemandOnly}`;
  if (state.lastAppliedKey === appliedKey) return;
  state.lastAppliedKey = appliedKey;
  state.sortController.sortBy(resolveEventsSearchSortCriterion(state, option, context));
}

/** Resets sort back to its default so Clear removes the sort along with filters and query. */
function resetEventsSearchSort(block, { dispatch = true } = {}) {
  const state = getEventsSearchSortState(block);
  state.selected = 'relevance';
  state.hasShownControl = false;
  state.lastAppliedKey = null;
  state.urlRestorePending = false;
  state.urlRestoreGraceRemaining = null;
  state.lastHasQuery = false;
  if (dispatch && state.sortController && state.criteria) {
    state.sortController.sortBy(state.criteria.relevance());
  }
}

/** Renders the sort dropdown anchors and the button caption for the given options and selection. */
function renderEventsSearchSortOptions(block, options, selected, placeholders) {
  const sortControl = filterContexts.get(block)?.sort;
  if (!sortControl) return;
  sortControl.setOptions(
    options.map((option) => ({ value: option, label: getEventsSearchSortOptionLabel(option, placeholders) })),
    selected,
  );
}

/** Handles a sort option click: updates state, re-renders the dropdown, and applies the criterion. */
function selectEventsSearchSortOption(block, option) {
  const state = getEventsSearchSortState(block);
  state.selected = option;
  const context = getEventsSearchSortContext(block);
  renderEventsSearchSortOptions(block, getAvailableEventsSearchSortOptions(context), option, state.placeholders);
  // sortBy() always dispatches (even switching between two options that resolve to the same
  // relevance criterion, e.g. Relevance <-> Date while mixed), which re-fires the search engine
  // subscription and re-renders results picking up the grouped client-side order via
  // shouldGroupEventsSearchResults for the mixed+Date case.
  state.lastAppliedKey = null;
  applyEventsSearchSort(block, option, context);
}

/**
 * Maps the URL hash `sortCriteria` back to a sort option (shared/bookmarked links, back/forward).
 * Must run before `initiateCoveoHeadlessSearch`, whose urlManager strips `sortCriteria` from the hash.
 */
function parseEventsSearchSortSelectionFromHash() {
  const sortParam = window.location.hash
    .slice(1)
    .split('&')
    .find((item) => item.startsWith('sortCriteria='));
  if (!sortParam) return null;
  const value = decodeURIComponent(sortParam.split('=')[1] || '');
  if (value === '@el_view_count descending') return 'popularity';
  if (value === 'date descending' || value === '@el_event_start_time ascending') return 'date';
  if (value === 'relevancy') return 'relevance';
  return null;
}

/**
 * Max search responses a URL-restored sort selection may look "invalid" before being abandoned —
 * the facet checkbox state lags the URL hash by several commits (~6-7) on initial load.
 */
const EVENTS_SEARCH_URL_RESTORE_MAX_GRACE_PASSES = 20;

/** Recomputes sort visibility/options from filter+query state, resets an invalid selection, and applies the criterion. */
function updateEventsSearchSortUI(block, placeholders) {
  const sortControl = filterContexts.get(block)?.sort;
  if (!sortControl) return;
  const state = getEventsSearchSortState(block);
  state.placeholders = placeholders;
  const context = getEventsSearchSortContext(block);
  const options = getAvailableEventsSearchSortOptions(context);
  // Capture the no-query, query transition before the early return.
  const queryJustEntered = context.hasQuery && !state.lastHasQuery;
  state.lastHasQuery = context.hasQuery;

  if (!options.length) {
    sortControl.setHidden(true);
    return;
  }

  if (!state.hasShownControl) {
    state.hasShownControl = true;
    state.selected = options.includes('relevance') ? 'relevance' : 'date';
  } else if (state.urlRestorePending) {
    const restored = options.includes(state.selected);
    state.urlRestoreGraceRemaining = (state.urlRestoreGraceRemaining ?? EVENTS_SEARCH_URL_RESTORE_MAX_GRACE_PASSES) - 1;
    if (restored || state.urlRestoreGraceRemaining <= 0) {
      state.urlRestorePending = false;
      if (!restored) state.selected = options.includes('date') ? 'date' : options[0];
    }
    // else: still waiting for the facet selection to catch up to the URL — leave selected as-is.
  } else if (queryJustEntered) {
    // Entering a query defaults the sort to Relevance
    state.selected = 'relevance';
  } else if (!options.includes(state.selected)) {
    state.selected = options.includes('date') ? 'date' : options[0];
  }

  sortControl.setHidden(false);
  renderEventsSearchSortOptions(block, options, state.selected, placeholders);
  applyEventsSearchSort(block, state.selected, context);
}

/**
 * Fires the eventsFilterSearch data layer event once per interaction, only when a filter or keyword
 * interaction is pending and the committed response matches the captured intent. The count comes from
 * that same matching response; the filter values come from the immutable intent snapshot. Guarded by
 * searchResponseId so duplicate post-commit subscription fires are ignored.
 */
function fireEventsFilterSearchAnalytics(block, searchResponseId) {
  const state = getEventsSearchAnalyticsState(block);
  if (!state.pendingType || !state.intent || !searchResponseId || state.lastSearchId === searchResponseId) return;
  if (!responseMatchesEventsSearchIntent(state.intent)) return;
  state.lastSearchId = searchResponseId;
  const { pendingType, intent } = state;
  state.pendingType = null;
  state.intent = null;
  const filter = {
    product: intent.byFilterType.el_product ?? [],
    eventType: intent.byFilterType.el_contenttype ?? [],
    series: intent.byFilterType.el_event_series ?? [],
  };
  const count = window.headlessSearchEngine?.state?.search?.response?.totalCount ?? 0;
  const linkMeta =
    pendingType === 'search'
      ? { linkTitle: 'search events', linkType: 'search text box' }
      : { linkTitle: 'events filter apply', linkType: 'filter' };
  pushEventsFilterSearchEvent({ ...linkMeta, count, filter, sortBy: getEventsSearchSortBy(block), term: intent.term });
}

function getBaseFilterGroups(placeholders) {
  return [
    {
      id: 'el_product',
      name: placeholders.eventSearchFilterProductLabel || 'Product',
      items: [],
    },
    {
      id: 'el_contenttype',
      name: placeholders.eventSearchFilterEventTypeLabel || 'Event Type',
      items: eventTypeOptions.items.map((item) => ({ ...item })).sort(sortItemsAlphabetically),
    },
    {
      id: 'el_event_series',
      name: placeholders.eventSearchFilterEventSeriesLabel || 'Series',
      items: [],
    },
  ];
}

function createLayout(block, placeholders) {
  const { ui, sort } = filterContexts.get(block);
  block.innerHTML = '';

  // Sidebar, keyword box, active-filter tags, results count and mobile toggle all come from the shared layout.
  // cardColumns: false -> events keeps its own results grid / list-grid view switcher styling.
  const { layout, results, controls } = createSidebarLayout({
    ui,
    placeholders: { filtersLabel: placeholders.eventSearchFiltersLabel },
    cardColumns: false,
  });
  controls.append(createTag('div', { class: 'events-search-view-switcher' }), sort.el);

  const resultsBody = createTag('div', { class: 'events-search-results-body browse-cards-block' });
  resultsBody.innerHTML = `
    <div class="events-search-no-results" hidden role="status" aria-live="polite"></div>
    <div class="events-search-results-grid browse-cards-block-content"></div>
    <div class="events-search-pagination">
      <button class="nav-arrow" type="button" aria-label="${
        placeholders.eventSearchPaginationPreviousAriaLabel || 'previous page'
      }"></button>
      <input type="text" class="events-search-pg-input" inputmode="numeric" aria-label="${
        placeholders.eventSearchPaginationPageInputAriaLabel || 'Enter page number'
      }" value="1" />
      <span class="events-search-pagination-text"></span>
      <button class="nav-arrow right-nav-arrow" type="button" aria-label="${
        placeholders.eventSearchPaginationNextAriaLabel || 'next page'
      }"></button>
    </div>
  `;
  results.append(resultsBody);
  block.append(layout);
}

async function initEventsSearchViewSwitcher(block) {
  const resultsBody = block.querySelector('.events-search-results-body');
  const switcherContainer = block.querySelector('.events-search-view-switcher');
  if (!resultsBody || !switcherContainer) return;

  const viewSwitcher = await BrowseCardViewSwitcher.create({ block: resultsBody });
  viewSwitcher.appendTo(switcherContainer);
  viewSwitcherInstances.set(block, viewSwitcher);
}

async function loadEventsCardStyles() {
  await Promise.all([
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-upcoming-events.css`),
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-on-demand-events.css`),
  ]);
}

function executeSearch() {
  if (!window.headlessSearchActionCreators || !window.headlessSearchEngine) return;
  const logSubmit = window.logSearchboxSubmit;
  const searchAction = window.headlessSearchActionCreators.executeSearch(
    typeof logSubmit === 'function' ? logSubmit() : undefined,
  );
  window.headlessSearchEngine.dispatch(searchAction);
}

/**
 * Updates pagination UI from headless pager state (same pattern as browse-filters).
 * @param {HTMLElement} block
 */
function renderEventsSearchPageNumbers(block, placeholders) {
  const filtersPaginationEl = block.querySelector('.events-search-pagination');
  const resultsGrid = block.querySelector('.events-search-results-grid');
  if (!filtersPaginationEl || !window.headlessPager) {
    return;
  }

  const currentPageNumber = window.headlessPager.state?.currentPage || 1;
  const pgCount = window.headlessPager.state?.maxPage || 1;
  const paginationTextEl = filtersPaginationEl.querySelector('.events-search-pagination-text');
  const inputText = filtersPaginationEl.querySelector('input.events-search-pg-input');
  if (inputText) {
    inputText.value = String(currentPageNumber);
  }
  if (paginationTextEl) {
    const pg = String(pgCount);
    if (pgCount > 1) {
      const label = placeholders?.eventSearchPagesLabel;
      paginationTextEl.textContent = label ? fillPlaceholderCount(label, pg) : `of ${pgCount} pages`;
    } else {
      const label = placeholders?.eventSearchPageLabel;
      paginationTextEl.textContent = label ? fillPlaceholderCount(label, pg) : `of ${pgCount} page`;
    }
  }

  const leftNavButton = filtersPaginationEl.querySelector('.nav-arrow:not(.right-nav-arrow)');
  const rightNavButton = filtersPaginationEl.querySelector('.nav-arrow.right-nav-arrow');
  if (leftNavButton) {
    if (currentPageNumber === 1) {
      leftNavButton.classList.add('nav-arrow-hidden');
      leftNavButton.disabled = true;
    } else {
      leftNavButton.classList.remove('nav-arrow-hidden');
      leftNavButton.disabled = false;
    }
  }
  if (rightNavButton) {
    if (currentPageNumber === pgCount) {
      rightNavButton.classList.add('nav-arrow-hidden');
      rightNavButton.disabled = true;
    } else {
      rightNavButton.classList.remove('nav-arrow-hidden');
      rightNavButton.disabled = false;
    }
  }
  if (pgCount === 1) {
    filtersPaginationEl.classList.add('events-search-pagination-hidden');
    resultsGrid?.classList.add('events-search-one-pg-result');
  } else {
    filtersPaginationEl.classList.remove('events-search-pagination-hidden');
    resultsGrid?.classList.remove('events-search-one-pg-result');
  }
}

/**
 * Toggle the no-results banner. When `suppressWhileShimmer` is set, keep it hidden while the
 * loading shimmer is present so a stale empty subscription cannot stack no-results above shimmer.
 */
function setEventsSearchNoResultsVisibility(block, { resultCount, searchResponseId, suppressWhileShimmer = false }) {
  const noResults = block.querySelector('.events-search-no-results');
  if (!noResults) return;
  if (suppressWhileShimmer) {
    const resultsBody = block.querySelector('.events-search-results-body');
    if (resultsBody?.querySelector(':scope > .browse-card-shimmer')) {
      noResults.setAttribute('hidden', '');
      return;
    }
  }
  if (resultCount === 0) {
    /* Avoid flashing no-results on first paint: Coveo can emit an empty results slice before any response id exists. */
    if (searchResponseId) {
      noResults.removeAttribute('hidden');
    } else {
      noResults.setAttribute('hidden', '');
    }
  } else {
    noResults.setAttribute('hidden', '');
  }
}

/**
 * Loading shimmer + hide results while Coveo search is in flight (browse-filters pattern).
 * @param {HTMLElement} block
 */
function bindEventsSearchLoadingUI(block) {
  eventsSearchLoadingUiCleanups.get(block)?.();

  const resultsBody = block.querySelector('.events-search-results-body');
  const grid = block.querySelector('.events-search-results-grid');
  const pagination = block.querySelector('.events-search-pagination');
  const noResults = block.querySelector('.events-search-no-results');
  const resultsTop = block.querySelector('.sf-results-column');
  if (!resultsBody || !grid || !pagination) return;

  const ac = new AbortController();
  let disconnectMo;
  function teardownEventsSearchLoadingUi() {
    ac.abort();
    disconnectMo?.disconnect();
    eventsSearchLoadingUiCleanups.delete(block);
  }
  disconnectMo = new MutationObserver(() => {
    if (!block.isConnected) {
      teardownEventsSearchLoadingUi();
    }
  });
  disconnectMo.observe(block.parentElement || document.body, { childList: true });
  eventsSearchLoadingUiCleanups.set(block, teardownEventsSearchLoadingUi);

  const shimmer = new BrowseCardShimmer(getBrowseFiltersResultCount());
  /** Avoid jumping to results on first Coveo run; scroll only after subsequent filter/pagination/etc. searches. */
  let hasCompletedInitialSearchResponse = false;

  const placeShimmerBeforeGrid = () => {
    const shimmerEl = resultsBody.querySelector(':scope > .browse-card-shimmer');
    if (shimmerEl) {
      resultsBody.insertBefore(shimmerEl, grid);
    }
  };

  const onPreprocess = (e) => {
    const { method = '' } = e.detail ?? {};
    if (method !== 'search' || !block.isConnected) return;

    // scroll to results only if they're not currently visible
    if (resultsTop && hasCompletedInitialSearchResponse) {
      const rect = resultsTop.getBoundingClientRect();
      const isResultsVisible = rect.top >= 0 && rect.top <= window.innerHeight;

      // Only scroll if results are not visible
      if (!isResultsVisible) {
        resultsTop.scrollIntoView({ behavior: 'auto', block: 'start' });
        window.scrollBy({ top: RESULTS_SCROLL_ADJUSTMENT_OFFSET });
      }
    }

    shimmer.addShimmer(resultsBody);
    placeShimmerBeforeGrid();
    filterContexts.get(block)?.ui.setLoading(true);
    grid.style.display = 'none';
    pagination.style.display = 'none';
    if (noResults) {
      noResults.setAttribute('hidden', '');
    }
  };

  const onProcessSearchResponse = () => {
    if (!block.isConnected) return;
    hasCompletedInitialSearchResponse = true;
    shimmer.removeShimmer();
    filterContexts.get(block)?.ui.setLoading(false);
    grid.style.display = '';
    pagination.style.display = '';
    const search = window.headlessSearchEngine?.state?.search || {};
    const { results: responseResults = [], searchResponseId: responseSearchId = '' } = search;
    setEventsSearchNoResultsVisibility(block, {
      resultCount: responseResults.length,
      searchResponseId: responseSearchId,
    });
  };

  document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.PREPROCESS, onPreprocess, { signal: ac.signal });
  document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.PROCESS_SEARCH_RESPONSE, onProcessSearchResponse, {
    signal: ac.signal,
  });
}

function bindEventsSearchPagination(block) {
  const filtersPaginationEl = block.querySelector('.events-search-pagination');
  if (!filtersPaginationEl) return;

  const navButtons = Array.from(filtersPaginationEl.querySelectorAll('button.nav-arrow'));
  navButtons.forEach((navButton) => {
    navButton.addEventListener('click', (e) => {
      const jumpToPreviousPg = !e.currentTarget.classList.contains('right-nav-arrow');
      if (!window.headlessPager) return;
      const newPageNumber = window.headlessPager.state.currentPage + (jumpToPreviousPg ? -1 : 1);
      if (newPageNumber < 1 || newPageNumber > window.headlessPager.state.maxPage) {
        return;
      }
      window.headlessPager.selectPage(newPageNumber);
      executeSearch();
    });
  });

  const filterInputEl = filtersPaginationEl.querySelector('input.events-search-pg-input');
  if (filterInputEl) {
    filterInputEl.addEventListener('change', (e) => {
      let newPageNum = +e.target.value;
      if (newPageNum < 1) {
        newPageNum = 1;
        e.target.value = newPageNum;
      } else if (window.headlessPager?.state?.maxPage && newPageNum > window.headlessPager.state.maxPage) {
        newPageNum = window.headlessPager.state.maxPage;
        e.target.value = newPageNum;
      }
      if (!window.headlessPager) return;
      if (Number.isNaN(newPageNum)) {
        e.target.value = window.headlessPager.state?.currentPage || 1;
      } else {
        window.headlessPager.selectPage(newPageNum);
        executeSearch();
      }
    });
    filterInputEl.addEventListener('keyup', (e) => {
      const pgNumber = +e.target.value;
      if (window.headlessPager?.state) {
        if (Number.isNaN(pgNumber)) {
          e.target.value = window.headlessPager.state.currentPage || 1;
        } else if (pgNumber > window.headlessPager.state.maxPage) {
          e.target.value = window.headlessPager.state.maxPage;
        }
      }
      if (e.key === 'Enter' && window.headlessPager) {
        window.headlessPager.selectPage(+e.target.value);
        executeSearch();
      }
    });
  }
}

function updateResultsCount(block, totalCount = 0, placeholders = {}) {
  const ui = filterContexts.get(block)?.ui;
  if (!ui) return;
  ui.setResultCount(totalCount || 0, placeholders.eventSearchResultsCountSuffix || 'events and recordings');
}

async function renderResults(block, results = [], searchResponseId = '') {
  const grid = block.querySelector('.events-search-results-grid');
  const noResults = block.querySelector('.events-search-no-results');
  if (!grid || !noResults) return;

  if (!results.length) {
    grid.innerHTML = '';
    grid.classList.remove('browse-cards-block-content');
    grid.setAttribute('hidden', '');
    setEventsSearchNoResultsVisibility(block, {
      resultCount: 0,
      searchResponseId,
      suppressWhileShimmer: true,
    });
    return;
  }

  const shouldRender =
    !grid.dataset.searchresponseid ||
    grid.dataset.searchresponseid !== searchResponseId ||
    !grid.querySelector('.events-search-card-item');
  if (!shouldRender) return;

  grid.dataset.searchresponseid = searchResponseId;
  grid.classList.add('browse-cards-block-content');
  const cardsData = await BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(results);

  const normalizedCards = cardsData.map((model) => {
    if (model?.contentType?.toLowerCase() === CONTENT_TYPES.UPCOMING_EVENT_V2.MAPPING_KEY.toLowerCase()) {
      return normalizeUpcomingEventModel(model);
    }
    if (model?.contentType?.toLowerCase() === CONTENT_TYPES.ON_DEMAND_EVENT.MAPPING_KEY.toLowerCase()) {
      return normalizeOnDemandEventModel(model);
    }
    return model;
  });

  const orderedCards = shouldGroupEventsSearchResults(block)
    ? groupUpcomingThenOnDemand(normalizedCards)
    : normalizedCards;

  grid.innerHTML = '';
  await Promise.all(
    orderedCards.map(async (cardData) => {
      const cardWrapper = createTag('div', { class: 'events-search-card-item' });
      grid.append(cardWrapper);
      await buildCard(cardWrapper, cardData);
    }),
  );

  setEventsSearchNoResultsVisibility(block, { resultCount: results.length, searchResponseId });
  grid.removeAttribute('hidden');

  const resultsBody = block.querySelector('.events-search-results-body');
  const viewSwitcher = viewSwitcherInstances.get(block);
  if (resultsBody?.classList.contains('list') && viewSwitcher) {
    viewSwitcher.enhanceCardsForListView();
  }
}

function updateNoResultsMessage(block, placeholders) {
  const noResultsEl = block.querySelector('.events-search-no-results');
  if (!noResultsEl || noResultsEl.hasAttribute('hidden')) return;
  const query = String(window.headlessSearchBox?.state?.value || '').trim();
  noResultsEl.innerHTML = '';
  const msgEl = createTag('p', { class: 'events-search-no-results-message' });
  if (query) {
    msgEl.append(
      `${placeholders.eventSearchNoResultsPrefix || 'Sorry, no results were found for'} `,
      Object.assign(createTag('strong', {}), { textContent: `"${query}"` }),
    );
  } else {
    msgEl.textContent = placeholders.eventSearchNoResultsMessage || 'Sorry, no results were found.';
  }
  const clearBtn = createTag('a', { href: '#', class: 'events-search-no-results-clear' });
  clearBtn.textContent = placeholders.eventSearchClearSearchLabel || 'Clear search';
  clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    filterContexts.get(block)?.store.clear();
  });
  noResultsEl.append(msgEl, clearBtn);
}

/* ------------------------------------------------------------------ */
/* Filters: shared store/UI  <->  Coveo Headless                       */
/* ------------------------------------------------------------------ */

/** Makes a facet controller's selection equal `wanted` (values not yet known to the controller are added). */
function reconcileFacetSelection(controller, wanted = []) {
  if (!controller) return;
  const want = new Set(wanted);
  const values = controller.state?.values ?? [];
  values.forEach((facetValue) => {
    if ((facetValue.state === 'selected') !== want.has(facetValue.value)) {
      controller.toggleSelect(facetValue);
    }
  });
  const known = new Set(values.map((facetValue) => facetValue.value));
  wanted.forEach((value) => {
    if (!known.has(value)) controller.toggleSelect({ value, state: 'selected' });
  });
}

/**
 * USER -> HEADLESS. The store only emits on user actions (backend syncs are silent), so every
 * emit here is a real filter / keyword / clear interaction.
 */
function applyStoreChangeToHeadless(block, ctx, snapshot, source) {
  const { filters, keyword } = snapshot;
  const intent = { byFilterType: filters, term: keyword };

  // Analytics: same rules as before — keyword search only counts when non-empty; clear has its own event.
  if (source === 'filter' || (source === 'keyword' && keyword)) {
    const analytics = getEventsSearchAnalyticsState(block);
    analytics.pendingType = source === 'keyword' ? 'search' : 'filter';
    analytics.intent = intent;
  }

  // Don't let a lagging Headless state overwrite this click until it has caught up (see syncFromHeadless).
  ctx.awaiting = { intent, passes: 0 };

  if (source === 'clear') {
    ctx.isClearing = true;
    GROUP_IDS.forEach((id) => getFacetController(id)?.deselectAll?.());
    window.headlessSearchBox?.updateText('');
    ctx.isClearing = false;
  } else {
    GROUP_IDS.forEach((id) => reconcileFacetSelection(getFacetController(id), filters[id]));
    if (source === 'keyword') window.headlessSearchBox?.updateText(keyword);
  }

  window.headlessPager?.selectPage(1);

  if (source === 'clear') {
    // Drop the whole hash at once
    const hadHash = Boolean(window.location.hash) && window.location.hash !== '#';
    // Clear resets the sort back to default.
    resetEventsSearchSort(block, { dispatch: !hadHash });
    if (hadHash) {
      window.location.hash = '';
    } else {
      executeSearch();
    }
    pushEventsClearFiltersEvent();
  } else if (source === 'keyword') {
    // Coveo urlManager syncs `q` from the hash; updateText + executeSearch alone does not run keyword search.
    handleCoverSearchSubmit(keyword);
  } else {
    executeSearch();
  }
}

function toEventTypeStaticItems(group) {
  return (group?.items ?? []).map((item) => ({
    value: item.value || item.title,
    title: item.title || item.value,
  }));
}

/** Builds the option list for a group from the Headless facet controller. */
function buildGroupItemsFromHeadless(group, ctx) {
  const controller = getFacetController(group.id);
  const facetValues = controller?.state?.values ?? [];
  const selected = new Set(ctx.store.get().filters[group.id]);

  if (group.id === 'el_contenttype') {
    // Static options; counts come from the facet, zero-count options are hidden unless selected.
    return toEventTypeStaticItems(group)
      .map((item) => {
        const facetValue = facetValues.find((fv) => fv.value === item.value);
        return { ...item, count: facetValue?.numberOfResults ?? 0 };
      })
      .filter((item) => selected.has(item.value) || item.count > 0);
  }

  return facetValues
    .filter((v) => v.state === 'selected' || (v.numberOfResults ?? 0) > 0)
    .map((v) => ({
      value: v.value,
      title: v.value.split('|').join(' | '),
      count: v.numberOfResults ?? 0,
    }))
    .sort(sortItemsAlphabetically);
}

/**
 * HEADLESS -> UI. Called from every search engine subscription fire.
 * 1) Mirrors the controllers' selected values and the search box into the store (silently).
 * 2) Refreshes option lists/counts once per new search response.
 */
function syncFromHeadless(block, groups) {
  const ctx = filterContexts.get(block);
  if (!ctx) return;
  if (!(window.headlessStatusControllers?.state?.firstSearchExecuted ?? false)) return;

  // A user interaction is in flight: wait until Headless has caught up with it before mirroring state back.
  if (ctx.awaiting) {
    ctx.awaiting.passes += 1;
    if (responseMatchesEventsSearchIntent(ctx.awaiting.intent) || ctx.awaiting.passes > MAX_PENDING_SYNC_PASSES) {
      ctx.awaiting = null;
    } else {
      return;
    }
  }

  const { store, ui } = ctx;
  const search = window.headlessSearchEngine?.state?.search ?? {};

  // 1) selections + keyword (also covers URL restore and back/forward navigation)
  groups.forEach((group) => {
    const selected = (getFacetController(group.id)?.state?.values ?? [])
      .filter((v) => v.state === 'selected')
      .map((v) => v.value);
    store.setGroup(group.id, selected, { silent: true });
  });
  store.setKeyword(window.headlessSearchBox?.state?.value ?? '', { silent: true });

  // 2) options + counts, only when a new response has arrived (avoids stale counts)
  const responseId = search.searchResponseId;
  if (responseId && ctx.lastResponseId !== responseId) {
    ctx.lastResponseId = responseId;
    block.classList.toggle('has-no-results', !(search.response?.totalCount ?? 0));
    groups.forEach((group) => {
      const items = buildGroupItemsFromHeadless(group, ctx);
      const key = JSON.stringify(items);
      if (ctx.itemKeys.get(group.id) !== key) {
        ctx.itemKeys.set(group.id, key);
        ui.setGroupItems(group.id, items);
      }
    });
  }

  ui.refresh();
}

function setupFilters(block, groups, placeholders) {
  const store = createFilterStore({ groupIds: GROUP_IDS });
  const ui = createSearchFilterUI({
    store,
    groups: groups.map(({ id, name }) => ({ id, name })),
    placeholders: {
      filtersLabel: placeholders.eventSearchFiltersLabel,
      filterClearLabel: placeholders.eventSearchClearFiltersLabel || 'Clear all filters',
      searchPlaceholder: placeholders.eventSearchKeywordPlaceholder || 'Search events',
      clearSearchLabel: placeholders.eventSearchClearSearchLabel,
      activeFiltersAriaLabel: placeholders.eventSearchActiveFiltersAriaLabel,
    },
  });

  // Which sort options exist (and whether the control shows at all) is Coveo/filter driven,
  // see updateEventsSearchSortUI. The shared control only renders them.
  const sort = createSortControl({
    label: placeholders.eventSearchFilterSortLabel || 'Sort:',
    onChange: (option) => selectEventsSearchSortOption(block, option),
  });
  sort.setHidden(true);

  const ctx = { store, ui, sort, awaiting: null, isClearing: false, lastResponseId: null, itemKeys: new Map() };
  filterContexts.set(block, ctx);

  // Event Type options are static; counts arrive from Headless later.
  ui.setGroupItems('el_contenttype', toEventTypeStaticItems(groups.find((g) => g.id === 'el_contenttype')));

  store.subscribe((snapshot, source) => applyStoreChangeToHeadless(block, ctx, snapshot, source));
}

async function handleSearchEngineSubscription(block, groups, placeholders) {
  if (!window.headlessSearchEngine || window.headlessStatusControllers?.state?.isLoading) return;

  const ctx = filterContexts.get(block);
  if (!ctx || ctx.isClearing) return;

  const syncDepth = headlessSubscriptionSyncDepth.get(block) ?? 0;
  if (syncDepth > 0) {
    headlessSubscriptionSyncDepth.set(block, -1);
    return;
  }
  headlessSubscriptionSyncDepth.set(block, 1);
  try {
    syncFromHeadless(block, groups);
    updateEventsSearchSortUI(block, placeholders);
    const search = window.headlessSearchEngine.state.search || {};
    const { results = [], searchResponseId = '', response = {} } = search;
    fireEventsFilterSearchAnalytics(block, searchResponseId);
    updateResultsCount(block, response.totalCount || 0, placeholders);
    await renderResults(block, results, searchResponseId);
    if (!response.totalCount) updateNoResultsMessage(block, placeholders);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('events-search: search engine subscription callback failed', err);
  } finally {
    const needsRerun = headlessSubscriptionSyncDepth.get(block) === -1;
    headlessSubscriptionSyncDepth.set(block, 0);
    if (needsRerun) {
      handleSearchEngineSubscription(block, groups, placeholders);
    }
  }
}

async function initHeadlessSearch(block, groups, placeholders) {
  const urlSortSelection = parseEventsSearchSortSelectionFromHash();
  const { default: initiateCoveoHeadlessSearch, buildEventsSearchSortController } = await import(
    '../../scripts/coveo-headless/index.js'
  );
  const renderPageNumbers = () => renderEventsSearchPageNumbers(block, placeholders);
  await initiateCoveoHeadlessSearch({
    handleSearchEngineSubscription: () => handleSearchEngineSubscription(block, groups, placeholders),
    renderPageNumbers,
    numberOfResults: getBrowseFiltersResultCount(),
    facetOverrides: getEventsSearchHeadlessFacetOverrides(),
    hideAqFromUrl: true,
    baseAdvancedQuery: BASE_COVEO_ADVANCED_QUERY_EVENTS,
    tabId: 'Events Hub',
    skipGenericSortDropdown: true,
    renderSearchQuerySummary: () => {
      const totalCount = window.headlessQuerySummary?.state?.total || 0;
      updateResultsCount(block, totalCount, placeholders);
    },
    handleSearchBoxSubscription: () => {
      const ctx = filterContexts.get(block);
      if (!ctx || ctx.awaiting || !window.headlessSearchBox) return;
      ctx.store.setKeyword(window.headlessSearchBox.state.value || '', { silent: true });
      ctx.ui.refresh();
    },
  });

  if (window.headlessSearchEngine) {
    try {
      const { controller, criteria } = await buildEventsSearchSortController(window.headlessSearchEngine);
      const sortState = getEventsSearchSortState(block);
      sortState.sortController = controller;
      sortState.criteria = criteria;
      // Seed lastAppliedKey to the controller's initial relevance criterion so the first UI pass doesn't re-dispatch a redundant sortBy.
      const initialContext = getEventsSearchSortContext(block);
      sortState.lastAppliedKey = `relevance:${initialContext.upcomingOnly}:${initialContext.onDemandOnly}`;
      if (urlSortSelection) {
        sortState.selected = urlSortSelection;
        sortState.hasShownControl = true;
        sortState.urlRestorePending = true;
      }
    } catch (err) {
      // Sort controller failed to build, leave sortController null so the control stays hidden; search still works.
      // eslint-disable-next-line no-console
      console.error('events-search: failed to build sort controller; sort disabled', err);
    }
  }

  bindEventsSearchLoadingUI(block);
  bindEventsSearchPagination(block);

  // aq is now set up-front via baseAdvancedQuery and reasserted on every hash change.
  if (window.headlessSearchEngine) {
    executeSearch();
  }
  renderPageNumbers();
}

export default async function decorate(block) {
  try {
    loadCSS(`${window.hlx.codeBasePath}/scripts/search-filter/search-filter.css`).catch(() => {});
    await loadEventsCardStyles().catch(() => {});
    let placeholders = {};
    try {
      placeholders = await fetchLanguagePlaceholders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
    const groups = getBaseFilterGroups(placeholders);

    setupFilters(block, groups, placeholders); // shared store + UI + sort control (not mounted yet)
    createLayout(block, placeholders); // mounts them via the shared sidebar layout
    await initEventsSearchViewSwitcher(block);
    await initHeadlessSearch(block, groups, placeholders);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('events-search: decorate failed', err);
  }
}
