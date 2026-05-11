import { decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';
import { createTag, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { BASE_COVEO_ADVANCED_QUERY_UPCOMING_EVENT } from '../../scripts/browse-card/browse-cards-constants.js';
import BrowseCardsDelegate, {
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
const INITIAL_VISIBLE_FILTER_OPTIONS = 5;
const RESULTS_SCROLL_ADJUSTMENT_OFFSET = -12;
const viewSwitcherInstances = new WeakMap();

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

function getBaseFilterGroups() {
  return [
    {
      id: 'el_product',
      name: placeholders.eventSearchFilterProductLabel || 'Product',
      items: [],
      selected: 0,
    },
    {
      id: 'el_event_series',
      name: placeholders.eventSearchFilterEventSeriesLabel || 'Series',
      items: [],
      selected: 0,
    },
    {
      id: 'el_contenttype',
      name: placeholders.eventSearchFilterEventTypeLabel || 'Event Type',
      items: eventTypeOptions.items.map((item) => ({ ...item })),
      selected: 0,
    },
  ];
}

function createLayout(block) {
  block.innerHTML = '';
  const layout = createTag('div', { class: 'events-search-layout' });
  const filterColumn = createTag('aside', { class: 'events-search-filters-column' });
  const resultColumn = createTag('section', { class: 'events-search-results-column' });

  filterColumn.innerHTML = `
    <button class="events-search-mobile-filter-toggle" type="button" aria-expanded="false">
      <span class="icon icon-atomic-search-filter"></span>
      <span>${placeholders.eventSearchFiltersLabel || 'Filters'}</span>
      <span class="icon icon-chevron"></span>
    </button>
    <div class="events-search-filters-panel">
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
        <span class="icon icon-search"></span>
        <input type="text" class="events-search-keyword-input" placeholder="${
          placeholders.eventSearchKeywordPlaceholder || 'Search events'
        }" />
      </div>
      <div class="events-search-meta-row">
        <div class="events-search-results-count"></div>
        <div class="events-search-controls">
          <div class="events-search-view-switcher"></div>
          <div class="sort-container">
            <button type="button" class="sort-drop-btn">
              <span class="sort-drop-btn-prefix">${placeholders.eventSearchfilterSortLabel || 'Sort:'}</span>
              <span class="sort-drop-btn-value">${placeholders.filterSortRelevanceLabel || 'Relevance'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="events-search-results-body browse-cards-block">
      <div class="events-search-results-grid browse-cards-block-content"></div>
      <div class="events-search-pagination">
        <button class="nav-arrow" type="button" aria-label="${
          placeholders.eventSearchPaginationPreviousAriaLabel || 'previous page'
        }"></button>
        <input type="text" class="events-search-pg-input" aria-label="${
          placeholders.eventSearchPaginationPageInputAriaLabel || 'Enter page number'
        }" value="1" />
        <span class="events-search-pagination-text"></span>
        <button class="nav-arrow right-nav-arrow" type="button" aria-label="${
          placeholders.eventSearchPaginationNextAriaLabel || 'next page'
        }"></button>
      </div>
      <div class="events-search-no-results" hidden role="status">${
        placeholders.eventSearchNoResults || 'No Results'
      }</div>
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

  dropDownBtn.addEventListener('click', () => {
    dropDownBtn.classList.toggle('active');
    const sortDropdown = dropDownBtn.nextElementSibling;
    sortDropdown?.classList.toggle('show');
    setTimeout(() => {
      // Close dropdown when user clicks outside of sort menu/button.
      document.addEventListener(
        'click',
        (event) => {
          const isInsideDropdown = !!sortDropdown && sortDropdown.contains(event.target);
          const isOnButton = event.target === dropDownBtn;
          const shouldHide = !isInsideDropdown && (!isOnButton || !dropDownBtn.classList.contains('active'));
          if (shouldHide) {
            sortDropdown?.classList.remove('show');
          }
        },
        { once: true },
      );
    });
  });
}

function getShowMoreLabel(count) {
  const template = placeholders.eventSearchShowMoreLabel;
  if (template?.includes('{}')) {
    return template.replace('{}', String(count));
  }
  return template || `Show ${count} more`;
}

function updateShowMoreButtonState(groupEl) {
  const showMoreButton = groupEl.querySelector('.events-search-filter-show-more');
  if (!showMoreButton) return;

  const hiddenOptionsCount = groupEl.querySelectorAll('.events-search-filter-option.is-overflow-hidden').length;
  if (hiddenOptionsCount <= 0) {
    showMoreButton.setAttribute('hidden', '');
    return;
  }

  showMoreButton.textContent = getShowMoreLabel(hiddenOptionsCount);
  showMoreButton.removeAttribute('hidden');
}

function renderFilterGroups(block, groups) {
  const groupsRoot = block.querySelector('.events-search-filter-groups');
  if (!groupsRoot) return;

  groupsRoot.innerHTML = '';
  groups.forEach((group, groupIndex) => {
    const isInitiallyExpanded = groupIndex === 0;
    const groupEl = createTag('section', {
      class: `events-search-filter-group${isInitiallyExpanded ? ' is-expanded' : ''}`,
      'data-filter-type': group.id,
    });
    groupEl.innerHTML = `
      <button class="events-search-filter-group-header" type="button" aria-expanded="${
        isInitiallyExpanded ? 'true' : 'false'
      }">
        <span class="events-search-filter-group-title">${group.name}</span>
        <span class="events-search-filter-group-count"></span>
        <span class="icon icon-chevron"></span>
      </button>
      <div class="events-search-filter-options"></div>
    `;

    const optionsContainer = groupEl.querySelector('.events-search-filter-options');
    group.items.forEach((item, index) => {
      const optionValue = item.value || item.title;
      const optionLabel = item.title || item.value;
      const optionId = `${group.id}-${index + 1}`;
      const overflowClass = index >= INITIAL_VISIBLE_FILTER_OPTIONS ? ' is-overflow-hidden' : '';
      const optionEl = createTag('div', { class: `events-search-filter-option${overflowClass}` });
      optionEl.innerHTML = `
        <input type="checkbox" id="${optionId}" value="${optionValue}" data-label="${optionLabel}" />
        <span class="events-search-filter-option-label">${optionLabel}</span>
      `;
      optionsContainer.append(optionEl);
    });

    if (group.items.length > INITIAL_VISIBLE_FILTER_OPTIONS) {
      const remainingCount = group.items.length - INITIAL_VISIBLE_FILTER_OPTIONS;
      const showMoreButton = createTag(
        'button',
        { class: 'events-search-filter-show-more', type: 'button' },
        getShowMoreLabel(remainingCount),
      );
      optionsContainer.append(showMoreButton);
      updateShowMoreButtonState(groupEl);
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
  Object.entries(FACET_CONTROLLER_MAP).forEach(([groupId, controllerName]) => {
    const controller = window[controllerName];
    const groupEl = block.querySelector(`.events-search-filter-group[data-filter-type="${groupId}"]`);
    if (!controller || !groupEl) return;

    const selectedValues = new Set(
      (controller.state?.values || []).filter((item) => item.state === 'selected').map((item) => item.value),
    );

    const checkboxes = groupEl.querySelectorAll('.events-search-filter-option input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectedValues.has(checkbox.value);
    });

    const selectedCount = selectedValues.size;
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
  const searchAction = window.headlessSearchActionCreators.executeSearch(window.logSearchboxSubmit());
  window.headlessSearchEngine.dispatch(searchAction);
}

/**
 * Updates pagination UI from headless pager state (same pattern as browse-filters).
 * @param {HTMLElement} block
 */
function renderEventsSearchPageNumbers(block) {
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
    if (pgCount > 1) {
      paginationTextEl.textContent = placeholders?.eventSearchPagesLabel
        ? placeholders.eventSearchPagesLabel.replace('{}', pgCount)
        : `of ${pgCount} pages`;
    } else {
      paginationTextEl.textContent = placeholders?.eventSearchPageLabel
        ? placeholders.eventSearchPageLabel.replace('{}', pgCount)
        : `of ${pgCount} page`;
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
 * Loading shimmer + hide results while Coveo search is in flight (browse-filters pattern).
 * @param {HTMLElement} block
 */
function bindEventsSearchLoadingUI(block) {
  const resultsBody = block.querySelector('.events-search-results-body');
  const grid = block.querySelector('.events-search-results-grid');
  const pagination = block.querySelector('.events-search-pagination');
  const noResults = block.querySelector('.events-search-no-results');
  const resultsTop = block.querySelector('.events-search-topbar');
  if (!resultsBody || !grid || !pagination) return;

  const shimmer = new BrowseCardShimmer(getBrowseFiltersResultCount());

  const placeShimmerBeforeGrid = () => {
    const shimmerEl = resultsBody.querySelector(':scope > .browse-card-shimmer');
    if (shimmerEl) {
      resultsBody.insertBefore(shimmerEl, grid);
    }
  };

  const onPreprocess = (e) => {
    const { method = '' } = e.detail ?? {};
    if (method !== 'search' || !block.isConnected) return;
    if (resultsTop) {
      resultsTop.scrollIntoView({ behavior: 'auto', block: 'start' });
      window.scrollBy({ top: RESULTS_SCROLL_ADJUSTMENT_OFFSET });
    }
    shimmer.addShimmer(resultsBody);
    placeShimmerBeforeGrid();
    grid.style.display = 'none';
    pagination.style.display = 'none';
    if (noResults) {
      noResults.style.display = 'none';
    }
  };

  const onProcessSearchResponse = () => {
    if (!block.isConnected) return;
    shimmer.removeShimmer();
    grid.style.display = '';
    pagination.style.display = '';
    if (noResults) {
      noResults.style.removeProperty('display');
    }
  };

  document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.PREPROCESS, onPreprocess);
  document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.PROCESS_SEARCH_RESPONSE, onProcessSearchResponse);
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

function toggleFacetSelection(filterType, value, isChecked) {
  const controllerName = FACET_CONTROLLER_MAP[filterType];
  if (!controllerName) return;
  const controller = window[controllerName];
  if (!controller || !value) return;

  controller.toggleSelect({
    value,
    state: isChecked ? 'selected' : 'idle',
  });
}

function updateResultsCount(block, totalCount = 0) {
  const countEl = block.querySelector('.events-search-results-count');
  if (!countEl) return;
  const formatter = new Intl.NumberFormat('en-US');
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
    grid.setAttribute('hidden', '');
    noResults.classList.add('no-results');
    noResults.removeAttribute('hidden');
    return;
  }

  const shouldRender =
    !grid.dataset.searchresponseid ||
    grid.dataset.searchresponseid !== searchResponseId ||
    !grid.querySelector('.events-search-card-item');
  if (!shouldRender) return;

  grid.dataset.searchresponseid = searchResponseId;
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

  noResults.classList.remove('no-results');
  noResults.setAttribute('hidden', '');
  grid.removeAttribute('hidden');

  const resultsBody = block.querySelector('.events-search-results-body');
  const viewSwitcher = viewSwitcherInstances.get(block);
  if (resultsBody?.classList.contains('list') && viewSwitcher) {
    viewSwitcher.enhanceCardsForListView();
  }
}

async function handleSearchEngineSubscription(block, groups) {
  if (!window.headlessSearchEngine || window.headlessStatusControllers?.state?.isLoading) return;
  syncFilterUIFromHeadlessState(block, groups);
  const search = window.headlessSearchEngine.state.search || {};
  const { results = [], searchResponseId = '', response = {} } = search;
  updateResultsCount(block, response.totalCount || 0);
  await renderResults(block, results, searchResponseId);
}

function bindFilterInteractions(block, groups) {
  const panel = block.querySelector('.events-search-filters-panel');
  if (!panel) return;

  panel.addEventListener('click', (event) => {
    const showMoreButton = event.target.closest('.events-search-filter-show-more');
    if (showMoreButton) {
      const groupEl = showMoreButton.closest('.events-search-filter-group');
      if (!groupEl) return;

      const hiddenOptions = groupEl.querySelectorAll('.events-search-filter-option.is-overflow-hidden');
      hiddenOptions.forEach((option) => {
        option.classList.remove('is-overflow-hidden');
      });
      updateShowMoreButtonState(groupEl);
      return;
    }

    const groupHeader = event.target.closest('.events-search-filter-group-header');
    if (!groupHeader) return;

    const groupEl = groupHeader.closest('.events-search-filter-group');
    const isExpanded = groupEl.classList.contains('is-expanded');
    groupEl.classList.toggle('is-expanded', !isExpanded);
    groupHeader.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
  });

  panel.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.events-search-filter-option input[type="checkbox"]');
    if (!checkbox) return;

    const groupEl = checkbox.closest('.events-search-filter-group');
    const filterType = groupEl?.dataset.filterType;
    if (!filterType) return;

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
    if (event.target.closest('.icon-search')) {
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
    const checkboxes = block.querySelectorAll('.events-search-filter-option input[type="checkbox"]:checked');
    checkboxes.forEach((checkbox) => {
      const groupEl = checkbox.closest('.events-search-filter-group');
      const filterType = groupEl?.dataset.filterType;
      checkbox.checked = false;
      toggleFacetSelection(filterType, checkbox.value, false);
    });
    groups.forEach((group) => {
      group.selected = 0;
      updateGroupSelectionCount(block, group.id, 0);
    });
    if (window.headlessSearchBox) {
      window.headlessSearchBox.updateText('');
      const searchInput = block.querySelector('.events-search-keyword-input');
      if (searchInput) {
        searchInput.value = '';
      }
    }
    handleCoverSearchSubmit('');
    if (window.headlessPager) {
      window.headlessPager.selectPage(1);
    }
    executeSearch();
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
}

async function loadDynamicFacetValues(groups) {
  const facetDetails = await BrowseCardsDelegate.fetchCoveoFacetFields(['el_event_series', 'el_product']);
  groups.forEach((group) => {
    if (group.id !== 'el_event_series' && group.id !== 'el_product') return;
    const groupValues = facetDetails[group.id] || [];
    group.items = groupValues.map((item) => ({
      id: item,
      value: item,
      title: item.split('|').join(' | '),
      description: '',
    }));
  });
}

async function initHeadlessSearch(block, groups) {
  const { default: initiateCoveoHeadlessSearch } = await import('../../scripts/coveo-headless/index.js');
  const renderPageNumbers = () => renderEventsSearchPageNumbers(block);
  await initiateCoveoHeadlessSearch({
    handleSearchEngineSubscription: () => handleSearchEngineSubscription(block, groups),
    renderPageNumbers,
    numberOfResults: getBrowseFiltersResultCount(),
    renderSearchQuerySummary: () => {
      const totalCount = window.headlessQuerySummary?.state?.total || 0;
      updateResultsCount(block, totalCount);
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

  if (window.headlessQueryActionCreators && window.headlessSearchEngine) {
    const action = window.headlessQueryActionCreators.updateAdvancedSearchQueries({
      aq: BASE_COVEO_ADVANCED_QUERY_UPCOMING_EVENT,
    });
    window.headlessSearchEngine.dispatch(action);
    executeSearch();
  }

  bindEventsSearchLoadingUI(block);
  bindEventsSearchPagination(block);
  renderPageNumbers();
  updateClearFiltersButtonState(block);
}

export default async function decorate(block) {
  await loadEventsCardStyles();
  const groups = getBaseFilterGroups();
  try {
    await loadDynamicFacetValues(groups);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching event facets:', error);
  }

  createLayout(block);
  decorateIcons(block);
  renderFilterGroups(block, groups);
  bindFilterInteractions(block, groups);
  bindTopbarSearch(block);
  bindClearFilters(block, groups);
  bindMobileFilterToggle(block);
  await initEventsSearchViewSwitcher(block);
  bindSortDropdownToggle(block);
  await initHeadlessSearch(block, groups);
}
