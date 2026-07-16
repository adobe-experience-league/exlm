import { decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';
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

const FACET_CONTROLLER_MAP = {
  el_product: 'headlessProductFacet',
  el_event_series: 'headlessEventSeriesFacet',
  el_contenttype: 'headlessTypeFacet',
};
// Tracks active render pass per block; queues the next subscription fire instead of running two renders at once.
const headlessSubscriptionSyncDepth = new WeakMap();
/** Literal tokens authors enter in placeholders for dynamic counts. */
/* eslint-disable no-template-curly-in-string -- not JS templates; match placeholders sheet text */
const PLACEHOLDER_COUNT_TOKEN = '${count}';
const PLACEHOLDER_PG_COUNT_TOKEN = '${pgCount}';
/* eslint-enable no-template-curly-in-string */
const RESULTS_SCROLL_ADJUSTMENT_OFFSET = -12;
const MAX_VISIBLE_FILTER_OPTIONS = 11;

// Filter UI helpers

/**
 * Caps the options list height to MAX_VISIBLE_FILTER_OPTIONS rows using the actual rendered row
 * height (measured from the DOM rather than assumed via CSS) so the scrollbar kicks in at the
 * right point regardless of font metrics. Only measurable while the group is expanded/visible.
 */
function applyFilterOptionsScrollCap(groupEl) {
  const optionsList = groupEl?.querySelector('.events-search-filter-options-list');
  if (!optionsList) return;
  const options = optionsList.querySelectorAll('.events-search-filter-option');
  if (options.length <= MAX_VISIBLE_FILTER_OPTIONS) {
    optionsList.style.maxHeight = '';
    return;
  }
  if (optionsList.offsetParent === null) return;
  const listTop = optionsList.getBoundingClientRect().top;
  const lastVisibleBottom = options[MAX_VISIBLE_FILTER_OPTIONS - 1].getBoundingClientRect().bottom;
  const capHeight = lastVisibleBottom - listTop;
  if (capHeight > 0) optionsList.style.maxHeight = `${Math.ceil(capHeight)}px`;
}

function recalcExpandedFilterScrollCaps(block) {
  block.querySelectorAll('.events-search-filter-group.is-expanded').forEach((groupEl) => {
    applyFilterOptionsScrollCap(groupEl);
  });
}

function removeFilterGroupOptionsShimmer(optionsContainer) {
  optionsContainer?.querySelector('.events-search-filter-options-shimmer')?.remove();
}

function hasFilterGroupOptionsShimmer(optionsContainer) {
  return Boolean(optionsContainer?.querySelector('.events-search-filter-options-shimmer'));
}

function renderFilterGroupOptionsShimmer(optionsContainer, rowCount = 5) {
  if (!optionsContainer) return;
  removeFilterGroupOptionsShimmer(optionsContainer);
  const shimmerRoot = createTag('div', { class: 'events-search-filter-options-shimmer', 'aria-hidden': 'true' });
  for (let i = 0; i < rowCount; i += 1) {
    shimmerRoot.append(createTag('div', { class: 'events-search-filter-option-shimmer' }));
  }
  optionsContainer.append(shimmerRoot);
}

function renderFilterOptionCountShimmer(optionEl) {
  const checkbox = optionEl?.querySelector('input[type="checkbox"]');
  const optionLabelEl = optionEl?.querySelector('.events-search-filter-option-label');
  if (!checkbox || !optionLabelEl) return;
  const optionLabel = checkbox.getAttribute('data-label') || checkbox.value;
  optionLabelEl.replaceChildren(
    document.createTextNode(String(optionLabel ?? '')),
    createTag('span', {
      class: 'events-search-filter-option-count events-search-filter-count-shimmer',
      'aria-hidden': 'true',
    }),
  );
}

function updateFilterOptionCount(optionEl, count, optionLabel) {
  const checkbox = optionEl?.querySelector('input[type="checkbox"]');
  const optionLabelEl = optionEl?.querySelector('.events-search-filter-option-label');
  if (!checkbox || !optionLabelEl) return;
  if (typeof count === 'number' && count >= 0) {
    checkbox.setAttribute('data-count', String(count));
    const countEl = createTag('span', { class: 'events-search-filter-option-count' });
    countEl.textContent = ` (${count})`;
    optionLabelEl.replaceChildren(document.createTextNode(String(optionLabel ?? '')), countEl);
  } else {
    checkbox.removeAttribute('data-count');
    optionLabelEl.textContent = String(optionLabel ?? '');
  }
}

function buildFilterOptionRow({ groupId, item, index }) {
  const optionValue = item.value || item.title;
  const optionLabel = item.title || item.value;
  const optionId = `${groupId}-${index + 1}-${String(optionValue).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const optionEl = createTag('div', {
    class: `events-search-filter-option${item.selected ? ' checked' : ''}`,
  });
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = optionId;
  checkbox.value = String(optionValue ?? '');
  checkbox.checked = Boolean(item.selected);
  checkbox.setAttribute('data-label', String(optionLabel ?? ''));
  if (item.count != null) checkbox.setAttribute('data-count', String(item.count));
  const optionLabelEl = createTag('label', { class: 'events-search-filter-option-label', for: optionId });
  const labelText = document.createTextNode(String(optionLabel ?? ''));
  if (item.count != null) {
    const countEl = createTag('span', { class: 'events-search-filter-option-count' });
    countEl.textContent = ` (${item.count})`;
    optionLabelEl.append(labelText, countEl);
  } else {
    optionLabelEl.append(labelText);
  }
  optionEl.append(checkbox, optionLabelEl);
  return optionEl;
}

// Dynamic facets (Headless v2)
const DYNAMIC_FACET_FIELDS = ['el_product', 'el_event_series'];

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

function showDynamicFilterGroupShimmers(block, { refreshCountsOnly = false } = {}) {
  DYNAMIC_FACET_FIELDS.forEach((field) => {
    const groupEl = block.querySelector(`.events-search-filter-group[data-filter-type="${field}"]`);
    const optionsContainer = groupEl?.querySelector('.events-search-filter-options');
    if (!groupEl || !optionsContainer) return;
    if (refreshCountsOnly && groupEl.querySelector('.events-search-filter-option')) {
      groupEl.classList.add('is-filter-loading');
      return;
    }
    if (!groupEl.querySelector('.events-search-filter-option') && !hasFilterGroupOptionsShimmer(optionsContainer)) {
      renderFilterGroupOptionsShimmer(optionsContainer);
    }
  });
}

function renderDynamicGroupOptions(groupEl, group) {
  const optionsContainer = groupEl.querySelector('.events-search-filter-options');
  if (!optionsContainer) return;
  removeFilterGroupOptionsShimmer(optionsContainer);
  optionsContainer.innerHTML = '';
  const optionsList = createTag('div', { class: 'events-search-filter-options-list' });
  group.items.forEach((item, index) => {
    optionsList.append(buildFilterOptionRow({ groupId: group.id, item, index }));
  });
  optionsContainer.append(optionsList);
  decorateIcons(optionsContainer);
}

function syncDynamicFacetGroup(block, group) {
  const groupEl = block.querySelector(`.events-search-filter-group[data-filter-type="${group.id}"]`);
  if (!groupEl) return;
  const optionsContainer = groupEl.querySelector('.events-search-filter-options');
  const controller = window[FACET_CONTROLLER_MAP[group.id]];
  const items = (controller?.state?.values ?? [])
    .filter((v) => v.state === 'selected' || (v.numberOfResults ?? 0) > 0)
    .map((v) => ({
      id: v.value,
      value: v.value,
      title: v.value.split('|').join(' | '),
      count: v.numberOfResults ?? 0,
      selected: v.state === 'selected',
    }))
    .sort(sortItemsAlphabetically);

  if (!items.length) {
    removeFilterGroupOptionsShimmer(optionsContainer);
    groupEl.classList.remove('is-filter-loading');
    groupEl.style.display = 'none';
    return;
  }

  groupEl.style.display = '';
  const wasExpanded = groupEl.classList.contains('is-expanded');
  group.items = items;
  renderDynamicGroupOptions(groupEl, group);
  groupEl.classList.remove('is-filter-loading');
  if (wasExpanded) {
    groupEl.classList.add('is-expanded');
    groupEl.querySelector('.events-search-filter-group-header')?.setAttribute('aria-expanded', 'true');
    applyFilterOptionsScrollCap(groupEl);
  }
}

function syncEventTypeFilterCounts(block) {
  const controller = window[FACET_CONTROLLER_MAP.el_contenttype];
  const groupEl = block.querySelector('.events-search-filter-group[data-filter-type="el_contenttype"]');
  if (!controller || !groupEl) return;
  const facetValues = controller.state?.values ?? [];
  let visibleCount = 0;
  groupEl.querySelectorAll('.events-search-filter-option').forEach((optionEl) => {
    const checkbox = optionEl.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    const facetValue = facetValues.find((fv) => fv.value === checkbox.value);
    const count = facetValue?.numberOfResults ?? 0;
    updateFilterOptionCount(optionEl, count, checkbox.getAttribute('data-label') || checkbox.value);
    const isVisible = checkbox.checked || count > 0;
    optionEl.style.display = isVisible ? '' : 'none';
    if (isVisible) visibleCount += 1;
  });
  groupEl.style.display = visibleCount > 0 ? '' : 'none';
  groupEl.classList.remove('is-filter-loading');
}

// Skips facet UI updates triggered before the search response arrives, preventing stale counts.
const lastSyncedSearchResponseId = new WeakMap();

function syncDynamicFacetGroupsFromHeadless(block, groups) {
  if (!(window.headlessStatusControllers?.state?.firstSearchExecuted ?? false)) return;

  // Only sync facet UI when a new search response has arrived.
  const searchResponseId = window.headlessSearchEngine?.state?.search?.searchResponseId;
  if (searchResponseId && lastSyncedSearchResponseId.get(block) === searchResponseId) return;
  if (searchResponseId) lastSyncedSearchResponseId.set(block, searchResponseId);

  const totalResults = window.headlessSearchEngine?.state?.search?.response?.totalCount ?? 0;
  block.classList.toggle('has-no-results', !totalResults);
  groups.forEach((group) => {
    if (DYNAMIC_FACET_FIELDS.includes(group.id)) syncDynamicFacetGroup(block, group);
  });
  syncEventTypeFilterCounts(block);
}

/** Builds the composite key used to identify a filter in pendingRemovals and callout data-key attributes. */
const toCompositeKey = (filterType, value) => `${filterType}:${value}`;

/** Splices the tag out of activeTags and registers it in pendingRemovals (browse-filters removeFromTags pattern). */
function removeActiveTag(activeTags, pendingRemovals, filterType, value) {
  const tagIndex = activeTags.findIndex((t) => t.filterType === filterType && t.value === value);
  if (tagIndex !== -1) activeTags.splice(tagIndex, 1);
  pendingRemovals.add(toCompositeKey(filterType, value));
}

const viewSwitcherInstances = new WeakMap();
/** AbortController + MutationObserver teardown for Coveo document listeners (re-decorate or DOM removal). */
const eventsSearchLoadingUiCleanups = new WeakMap();
/** Per-block AbortController for open sort dropdown document listeners (click-outside + Escape). */
const eventsSearchSortDropdownOpenAbort = new WeakMap();
/** Per-block filter state: { tags: [], pendingRemovals: Set, isClearing: boolean }. */
const eventsSearchActiveTags = new WeakMap();

function getFilterState(block) {
  let state = eventsSearchActiveTags.get(block);
  if (!state) {
    state = { tags: [], pendingRemovals: new Set(), isClearing: false };
    eventsSearchActiveTags.set(block, state);
  }
  return state;
}

function getBaseFilterGroups(placeholders) {
  return [
    {
      id: 'el_product',
      name: placeholders.eventSearchFilterProductLabel || 'Product',
      items: [],
      selected: 0,
    },
    {
      id: 'el_contenttype',
      name: placeholders.eventSearchFilterEventTypeLabel || 'Event Type',
      items: eventTypeOptions.items.map((item) => ({ ...item })).sort(sortItemsAlphabetically),
      selected: 0,
    },
    {
      id: 'el_event_series',
      name: placeholders.eventSearchFilterEventSeriesLabel || 'Series',
      items: [],
      selected: 0,
    },
  ];
}

function createLayout(block, placeholders) {
  block.innerHTML = '';
  const filtersPanelId = `events-search-filters-panel-${crypto.randomUUID()}`;
  const layout = createTag('div', { class: 'events-search-layout' });
  const filterColumn = createTag('aside', {
    class: 'events-search-filters-column',
    'aria-label': String(placeholders.eventSearchFiltersLabel || 'Filters'),
  });
  const resultColumn = createTag('section', { class: 'events-search-results-column' });

  filterColumn.innerHTML = `
    <button class="events-search-mobile-filter-toggle" type="button" aria-expanded="false" aria-controls="${filtersPanelId}">
      <span class="icon icon-atomic-search-filter"></span>
      <span>${placeholders.eventSearchFiltersLabel || 'Filters'}</span>
      <span class="icon icon-chevron"></span>
    </button>
    <div class="events-search-filters-panel" id="${filtersPanelId}">
      <div class="events-search-filters-header">
        <h2 class="events-search-filters-heading">${placeholders.eventSearchFiltersLabel || 'Filters'}</h2>
        <button type="button" class="events-search-clear-filters">${
          placeholders.eventSearchClearFiltersLabel || 'Clear all filters'
        }</button>
      </div>
      <div class="events-search-filter-groups"></div>
    </div>
  `;

  resultColumn.innerHTML = `
    <div class="events-search-topbar">
      <div class="events-search-keyword">
        <span class="icon icon-search-gray"></span>
        <input type="text" class="events-search-keyword-input" placeholder="${
          placeholders.eventSearchKeywordPlaceholder || 'Search events'
        }" aria-label="${
          placeholders.eventSearchKeywordAriaLabel || placeholders.eventSearchKeywordPlaceholder || 'Search events'
        }" />
      </div>
      <div class="events-search-active-filters" hidden role="group" aria-label="${
        placeholders.eventSearchActiveFiltersAriaLabel || 'Active filters'
      }"></div>
      <div class="events-search-meta-row">
        <div
          class="events-search-results-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        ></div>
        <div class="events-search-controls">
          <div class="events-search-view-switcher"></div>
          <div class="sort-container">
            <button type="button" class="sort-drop-btn">
              <span class="sort-drop-btn-prefix">${placeholders.eventSearchFilterSortLabel || 'Sort:'}</span>
              <span class="sort-drop-btn-value">${placeholders.filterSortRelevanceLabel || 'Relevance'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="events-search-results-body browse-cards-block">
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
    </div>
  `;

  layout.append(filterColumn, resultColumn);
  block.append(layout);
}

function setMobileFilterPanelState(block, shouldOpen) {
  const toggleButton = block.querySelector('.events-search-mobile-filter-toggle');
  if (!toggleButton) return;

  block.classList.toggle('is-filters-open', shouldOpen);
  toggleButton.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
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

function bindSortDropdownToggle(block) {
  const dropDownBtn = block.querySelector('.sort-drop-btn');
  if (!dropDownBtn) return;

  const closeSortDropdown = () => {
    const sortOpenAc = eventsSearchSortDropdownOpenAbort.get(block);
    if (sortOpenAc) {
      eventsSearchSortDropdownOpenAbort.delete(block);
      sortOpenAc.abort();
    }
    const sortDropdown = dropDownBtn.nextElementSibling;
    sortDropdown?.classList.remove('show');
    dropDownBtn.classList.remove('active');
  };

  dropDownBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    dropDownBtn.classList.toggle('active');
    const sortDropdown = dropDownBtn.nextElementSibling;
    sortDropdown?.classList.toggle('show');

    if (sortDropdown?.classList.contains('show')) {
      const sortOpenAc = new AbortController();
      eventsSearchSortDropdownOpenAbort.set(block, sortOpenAc);

      const onDocumentClose = () => {
        closeSortDropdown();
      };

      document.addEventListener('click', onDocumentClose, { once: true, signal: sortOpenAc.signal });
      document.addEventListener(
        'keydown',
        (ev) => {
          if (ev.key !== 'Escape') return;
          ev.preventDefault();
          onDocumentClose();
        },
        { signal: sortOpenAc.signal },
      );
    } else {
      closeSortDropdown();
    }
  });
}

function renderFilterGroups(block, groups) {
  const groupsRoot = block.querySelector('.events-search-filter-groups');
  if (!groupsRoot) return;

  groupsRoot.innerHTML = '';
  groups.forEach((group, groupIndex) => {
    const groupEl = createTag('section', {
      class: 'events-search-filter-group',
      'data-filter-type': group.id,
    });
    const groupOptionsRegionId = `${group.id}-options-${groupIndex}`;
    groupEl.innerHTML = `
      <button class="events-search-filter-group-header" type="button" aria-expanded="false" aria-controls="${groupOptionsRegionId}">
        <span class="events-search-filter-group-title">${group.name}</span>
        <span class="events-search-filter-group-count"></span>
        <span class="icon icon-chevron"></span>
      </button>
      <div class="events-search-filter-options" id="${groupOptionsRegionId}"></div>
    `;

    const optionsContainer = groupEl.querySelector('.events-search-filter-options');
    const isDynamicFacetGroup = DYNAMIC_FACET_FIELDS.includes(group.id);

    if (isDynamicFacetGroup && group.items.length === 0) {
      renderFilterGroupOptionsShimmer(optionsContainer);
    } else {
      const optionsList = createTag('div', { class: 'events-search-filter-options-list' });
      group.items.forEach((item, index) => {
        const optionRow = buildFilterOptionRow({ groupId: group.id, item, index });
        if (group.id === 'el_contenttype') {
          renderFilterOptionCountShimmer(optionRow);
        }
        optionsList.append(optionRow);
      });
      optionsContainer.append(optionsList);
    }

    groupsRoot.append(groupEl);
  });

  // Filter chevrons are rendered dynamically and need icon decoration after insertion.
  decorateIcons(groupsRoot);
}

function updateGroupSelectionCount(block, groupId, selectedCount) {
  const groupEl = block.querySelector(`.events-search-filter-group[data-filter-type="${groupId}"]`);
  if (!groupEl) return;
  const countEl = groupEl.querySelector('.events-search-filter-group-count');
  if (!countEl) return;
  countEl.textContent = selectedCount > 0 ? `(${selectedCount})` : '';
}

function updateClearFiltersButtonState(block) {
  const clearBtn = block.querySelector('.events-search-clear-filters');
  if (!clearBtn) return;
  const hasCheckedFilter = !!block.querySelector('.events-search-filter-option input[type="checkbox"]:checked');
  const input = block.querySelector('.events-search-keyword-input');
  const keywordFromInput = input?.value?.trim() ?? '';
  const keywordFromHeadless = String(window.headlessSearchBox?.state?.value ?? '').trim();
  const hasKeyword = Boolean(keywordFromInput || keywordFromHeadless);
  clearBtn.classList.toggle('is-active', hasCheckedFilter || hasKeyword);
}

function syncFilterUIFromHeadlessState(block, groups) {
  const { tags: activeTags, pendingRemovals } = getFilterState(block);

  Object.entries(FACET_CONTROLLER_MAP).forEach(([groupId, controllerName]) => {
    const controller = window[controllerName];
    const groupEl = block.querySelector(`.events-search-filter-group[data-filter-type="${groupId}"]`);
    if (!controller || !groupEl) return;

    const selectedValues = new Set(
      (controller.state?.values || []).filter((item) => item.state === 'selected').map((item) => item.value),
    );

    const checkboxes = groupEl.querySelectorAll('.events-search-filter-option input[type="checkbox"]');

    checkboxes.forEach((checkbox) => {
      const compositeKey = toCompositeKey(groupId, checkbox.value);
      const isSelected = selectedValues.has(checkbox.value) && !pendingRemovals.has(compositeKey);
      checkbox.checked = isSelected;

      // Mirror checkbox state into ordered tags array (browse-filters handleUriHash/appendTag pattern).
      // This ensures callouts appear correctly when filters are restored from URL on page load.
      const existingIndex = activeTags.findIndex((t) => t.filterType === groupId && t.value === checkbox.value);
      if (isSelected && existingIndex === -1 && !pendingRemovals.has(compositeKey)) {
        activeTags.push({
          filterType: groupId,
          value: checkbox.value,
          label: checkbox.getAttribute('data-label') || checkbox.value,
        });
      } else if (!isSelected) {
        if (existingIndex !== -1) activeTags.splice(existingIndex, 1);
        pendingRemovals.delete(compositeKey);
      }
      checkbox.closest('.events-search-filter-option')?.classList.toggle('checked', checkbox.checked);
    });

    const selectedCount = groupEl.querySelectorAll('input[type="checkbox"]:checked').length;
    const targetGroup = groups.find((group) => group.id === groupId);
    if (targetGroup) {
      targetGroup.selected = selectedCount;
    }
    updateGroupSelectionCount(block, groupId, selectedCount);
  });
  updateClearFiltersButtonState(block);
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
  const resultsTop = block.querySelector('.events-search-topbar');
  if (!resultsBody || !grid || !pagination) return;

  const ac = new AbortController();
  let disconnectMo;
  function teardownEventsSearchLoadingUi() {
    eventsSearchSortDropdownOpenAbort.get(block)?.abort();
    eventsSearchSortDropdownOpenAbort.delete(block);
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
    showDynamicFilterGroupShimmers(block, { refreshCountsOnly: hasCompletedInitialSearchResponse });
    block
      .querySelector('.events-search-filter-group[data-filter-type="el_contenttype"]')
      ?.classList.add('is-filter-loading');
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

function findFacetValueInController(controller, value) {
  const want = String(value);
  const values = controller?.state?.values || [];
  return (
    values.find((v) => v.value === want) ||
    values.find((v) => String(v.value).trim() === want.trim()) ||
    values.find((v) => String(v.value).toLowerCase() === want.toLowerCase())
  );
}

function getFacetController(filterType) {
  const controllerName = FACET_CONTROLLER_MAP[filterType];
  return controllerName ? window[controllerName] : null;
}

function applyCoveoFacetValueSelection(controller, value, shouldSelect) {
  const facetValue = findFacetValueInController(controller, value);
  if (facetValue) {
    const selected = facetValue.state === 'selected';
    if (selected !== shouldSelect) {
      controller.toggleSelect(facetValue);
    }
    return;
  }
  if (shouldSelect) {
    controller.toggleSelect({ value, state: 'selected' });
  }
}

function toggleFacetSelection(filterType, value, isChecked) {
  const controller = getFacetController(filterType);
  if (!controller || value === '' || value == null) return;

  applyCoveoFacetValueSelection(controller, value, isChecked);
}

function renderActiveFilterCallouts(block) {
  const container = block.querySelector('.events-search-active-filters');
  if (!container) return;

  // Use the ordered tags array (browse-filters pattern) so callouts reflect user selection order.
  const { tags: activeTags, pendingRemovals } = getFilterState(block);

  // Skip full DOM teardown if the ordered set of selected filters hasn't changed.
  const currentValues = [...container.querySelectorAll('.events-search-active-filter-tag')].map((t) => t.dataset.key);
  const newValues = activeTags.map((tag) => toCompositeKey(tag.filterType, tag.value));
  const unchanged = currentValues.length === newValues.length && currentValues.every((v, i) => v === newValues[i]);
  if (unchanged) return;

  // Save focused callout composite key before teardown so focus can be restored after rebuild.
  const focusedTag = container.querySelector('.events-search-active-filter-tag-remove:focus');
  const focusedKey = focusedTag?.closest('.events-search-active-filter-tag')?.dataset.key ?? null;

  container.innerHTML = '';

  if (!activeTags.length) {
    container.hidden = true;
    if (focusedKey) {
      block.querySelector('.events-search-keyword-input')?.focus();
    }
    return;
  }

  activeTags.forEach((tag) => {
    const { filterType, value, label } = tag;
    const callout = createTag('span', {
      class: 'events-search-active-filter-tag',
      'data-value': value,
      'data-key': toCompositeKey(filterType, value),
    });
    const calloutLabel = createTag('span', { class: 'events-search-active-filter-tag-label' });
    calloutLabel.textContent = label;

    const calloutRemove = createTag('button', {
      class: 'events-search-active-filter-tag-remove',
      type: 'button',
      'aria-label': `Remove filter: ${label}`,
    });
    const calloutRemoveIcon = createTag('span', { class: 'icon icon-close-events', 'aria-hidden': 'true' });
    calloutRemove.append(calloutRemoveIcon);

    const handleRemove = () => {
      // Uncheck the corresponding checkbox in the filter panel (browse-filters removeFromTags pattern).
      const matchedCheckbox = [
        ...block.querySelectorAll(
          `.events-search-filter-group[data-filter-type="${filterType}"] input[type="checkbox"]`,
        ),
      ].find((cb) => cb.value === value);
      if (matchedCheckbox) matchedCheckbox.checked = false;

      // Remove from ordered tags array and register as pending removal to prevent the Coveo
      // subscription from re-adding the tag before Coveo state catches up.
      removeActiveTag(activeTags, pendingRemovals, filterType, value);

      toggleFacetSelection(filterType, value, false);
      const groupEl = block.querySelector(`.events-search-filter-group[data-filter-type="${filterType}"]`);
      if (groupEl) {
        const newCount = groupEl.querySelectorAll('input[type="checkbox"]:checked').length;
        updateGroupSelectionCount(block, filterType, newCount);
      }
      if (window.headlessPager) {
        window.headlessPager.selectPage(1);
      }
      executeSearch();
      renderActiveFilterCallouts(block);
      updateClearFiltersButtonState(block);
    };

    calloutRemove.addEventListener('click', handleRemove, { once: true });

    callout.append(calloutLabel, calloutRemove);
    container.append(callout);
  });

  decorateIcons(container);
  container.hidden = false;

  // Restore focus to the adjacent × button (same index position after removal), or the search input if none remain.
  if (focusedKey) {
    const tags = [...container.querySelectorAll('.events-search-active-filter-tag')];
    const removedIndex = currentValues.indexOf(focusedKey);
    const nextTag = tags[removedIndex] ?? tags[tags.length - 1];
    const nextFocus =
      nextTag?.querySelector('.events-search-active-filter-tag-remove') ??
      block.querySelector('.events-search-keyword-input');
    nextFocus?.focus();
  }
}

function updateResultsCount(block, totalCount = 0, placeholders = {}) {
  const countEl = block.querySelector('.events-search-results-count');
  if (!countEl) return;
  const formatter = new Intl.NumberFormat();
  const countText = formatter.format(totalCount || 0);
  const suffix = placeholders.eventSearchResultsCountSuffix || 'events and recordings';
  const countStrong = createTag('strong', { class: 'events-search-results-count-value' }, countText);
  countEl.replaceChildren(countStrong, document.createTextNode(` ${suffix}`));
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

  grid.innerHTML = '';
  await Promise.all(
    normalizedCards.map(async (cardData) => {
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
    block.querySelector('.events-search-clear-filters')?.click();
  });
  noResultsEl.append(msgEl, clearBtn);
}

async function handleSearchEngineSubscription(block, groups, placeholders) {
  if (!window.headlessSearchEngine || window.headlessStatusControllers?.state?.isLoading) return;

  const state = getFilterState(block);
  if (state.isClearing) return;

  const syncDepth = headlessSubscriptionSyncDepth.get(block) ?? 0;
  if (syncDepth > 0) {
    headlessSubscriptionSyncDepth.set(block, -1);
    return;
  }
  headlessSubscriptionSyncDepth.set(block, 1);
  try {
    syncDynamicFacetGroupsFromHeadless(block, groups);
    syncFilterUIFromHeadlessState(block, groups);
    const search = window.headlessSearchEngine.state.search || {};
    const { results = [], searchResponseId = '', response = {} } = search;
    updateResultsCount(block, response.totalCount || 0, placeholders);
    renderActiveFilterCallouts(block);
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

function bindFilterInteractions(block, groups) {
  const panel = block.querySelector('.events-search-filters-panel');
  if (!panel) return;

  // Recompute the scroll cap on resize so it stays accurate across breakpoints.
  const resizeObserver = new ResizeObserver(() => recalcExpandedFilterScrollCaps(block));
  resizeObserver.observe(panel);

  panel.addEventListener('click', (event) => {
    const groupHeader = event.target.closest('.events-search-filter-group-header');
    if (!groupHeader) return;

    const groupEl = groupHeader.closest('.events-search-filter-group');
    const isExpanded = groupEl.classList.contains('is-expanded');
    groupEl.classList.toggle('is-expanded', !isExpanded);
    groupHeader.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    if (!isExpanded) applyFilterOptionsScrollCap(groupEl);
  });

  panel.addEventListener('change', (event) => {
    const checkbox = event.target.matches('input[type="checkbox"]') ? event.target : null;
    if (!checkbox) return;

    const groupEl = checkbox.closest('.events-search-filter-group');
    const filterType = groupEl?.dataset.filterType;
    if (!filterType) return;

    // Skip processing if we're in the middle of a clear all operation
    const state = getFilterState(block);
    if (state.isClearing) {
      return;
    }

    // Maintain ordered tags array (browse-filters appendTag/removeFromTags pattern).
    const { tags: activeTags, pendingRemovals } = state;
    if (checkbox.checked) {
      pendingRemovals.delete(toCompositeKey(filterType, checkbox.value));
      const alreadyTracked = activeTags.some((t) => t.filterType === filterType && t.value === checkbox.value);
      if (!alreadyTracked) {
        activeTags.push({
          filterType,
          value: checkbox.value,
          label: checkbox.getAttribute('data-label') || checkbox.value,
        });
      }
    } else {
      removeActiveTag(activeTags, pendingRemovals, filterType, checkbox.value);
    }

    const selectedCount = groupEl.querySelectorAll('input[type="checkbox"]:checked').length;
    const targetGroup = groups.find((group) => group.id === filterType);
    if (targetGroup) {
      targetGroup.selected = selectedCount;
    }
    updateGroupSelectionCount(block, filterType, selectedCount);
    toggleFacetSelection(filterType, checkbox.value, checkbox.checked);
    if (window.headlessPager) {
      window.headlessPager.selectPage(1);
    }
    executeSearch();
    renderActiveFilterCallouts(block);
    updateClearFiltersButtonState(block);
  });
}

function bindTopbarSearch(block) {
  const input = block.querySelector('.events-search-keyword-input');
  const keywordRow = block.querySelector('.events-search-keyword');
  if (!input) return;

  const submitSearch = () => {
    if (!window.headlessSearchBox) return;
    const query = input.value.trim();
    window.headlessSearchBox.updateText(query);
    if (window.headlessPager) {
      window.headlessPager.selectPage(1);
    }
    // Coveo urlManager syncs `q` from the hash; updateText + executeSearch alone does not run keyword search.
    handleCoverSearchSubmit(query);
    updateClearFiltersButtonState(block);
  };

  input.addEventListener('input', () => {
    updateClearFiltersButtonState(block);
  });

  keywordRow?.addEventListener('click', (event) => {
    if (event.target.closest('.icon-search-gray')) {
      submitSearch();
    }
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitSearch();
    }
  });
}

function bindClearFilters(block, groups) {
  const clearBtn = block.querySelector('.events-search-clear-filters');
  if (!clearBtn) return;

  clearBtn.addEventListener('click', () => {
    const state = getFilterState(block);
    const { tags: activeTags, pendingRemovals } = state;

    // Uncheck all checkboxes without per-checkbox Headless toggles
    block.querySelectorAll('.events-search-filter-option input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = false;
      checkbox.closest('.events-search-filter-option')?.classList.remove('checked');
    });

    // Reset ordered tags array (browse-filters clearAllSelectedTag pattern).
    activeTags.length = 0;
    pendingRemovals.clear();
    groups.forEach((group) => {
      group.selected = 0;
      updateGroupSelectionCount(block, group.id, 0);
    });

    state.isClearing = true;

    // deselect all Headless facet controllers.
    ['el_product', 'el_event_series', 'el_contenttype'].forEach((filterType) => {
      getFacetController(filterType)?.deselectAll?.();
    });

    if (window.headlessSearchBox) {
      window.headlessSearchBox.updateText('');
      const searchInput = block.querySelector('.events-search-keyword-input');
      if (searchInput) {
        searchInput.value = '';
      }
    }

    state.isClearing = false;

    if (window.headlessPager) {
      window.headlessPager.selectPage(1);
    }

    const hashBeforeClear = window.location.hash;
    const [currentSearchString] = hashBeforeClear.match(/\bq=([^&#]*)/) || [];
    if (currentSearchString) {
      let updatedHash = hashBeforeClear.replace(currentSearchString, '');
      if (updatedHash.slice(1).startsWith('&')) {
        updatedHash = `#${updatedHash.slice(2)}`;
      }
      window.location.hash = updatedHash;
    }
    if (window.location.hash === hashBeforeClear) {
      executeSearch();
    }
    renderActiveFilterCallouts(block);
    updateClearFiltersButtonState(block);
  });
}

function bindMobileFilterToggle(block) {
  const toggleButton = block.querySelector('.events-search-mobile-filter-toggle');
  if (!toggleButton) return;

  setMobileFilterPanelState(block, false);
  toggleButton.addEventListener('click', () => {
    const isOpen = block.classList.contains('is-filters-open');
    setMobileFilterPanelState(block, !isOpen);
  });

  block.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') return;
      if (!block.classList.contains('is-filters-open')) return;
      event.preventDefault();
      setMobileFilterPanelState(block, false);
      toggleButton.focus();
    },
    true,
  );
}

async function initHeadlessSearch(block, groups, placeholders) {
  const { default: initiateCoveoHeadlessSearch } = await import('../../scripts/coveo-headless/index.js');
  const renderPageNumbers = () => renderEventsSearchPageNumbers(block, placeholders);
  await initiateCoveoHeadlessSearch({
    handleSearchEngineSubscription: () => handleSearchEngineSubscription(block, groups, placeholders),
    renderPageNumbers,
    numberOfResults: getBrowseFiltersResultCount(),
    facetOverrides: getEventsSearchHeadlessFacetOverrides(),
    hideAqFromUrl: true,
    baseAdvancedQuery: BASE_COVEO_ADVANCED_QUERY_EVENTS,
    renderSearchQuerySummary: () => {
      const totalCount = window.headlessQuerySummary?.state?.total || 0;
      updateResultsCount(block, totalCount, placeholders);
    },
    handleSearchBoxSubscription: () => {
      const input = block.querySelector('.events-search-keyword-input');
      if (!input || !window.headlessSearchBox) return;
      if (input.value !== window.headlessSearchBox.state.value) {
        input.value = window.headlessSearchBox.state.value || '';
      }
      updateClearFiltersButtonState(block);
    },
  });

  bindEventsSearchLoadingUI(block);
  bindEventsSearchPagination(block);

  // aq is now set up-front via baseAdvancedQuery and reasserted on every hash change.
  if (window.headlessSearchEngine) {
    executeSearch();
  }
  renderPageNumbers();
  updateClearFiltersButtonState(block);
}

export default async function decorate(block) {
  await loadEventsCardStyles();
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
  const groups = getBaseFilterGroups(placeholders);

  createLayout(block, placeholders);
  decorateIcons(block);
  renderFilterGroups(block, groups);
  bindFilterInteractions(block, groups);
  bindTopbarSearch(block);
  bindClearFilters(block, groups);
  bindMobileFilterToggle(block);
  await initEventsSearchViewSwitcher(block);
  bindSortDropdownToggle(block);
  await initHeadlessSearch(block, groups, placeholders);
}
