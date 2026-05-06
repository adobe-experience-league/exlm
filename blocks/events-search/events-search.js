import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createTag, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { BASE_COVEO_ADVANCED_QUERY_UPCOMING_EVENT } from '../../scripts/browse-card/browse-cards-constants.js';
import BrowseCardsDelegate, {
  normalizeOnDemandEventModel,
  normalizeUpcomingEventModel,
} from '../../scripts/browse-card/browse-cards-delegate.js';
import BrowseCardsCoveoDataAdaptor from '../../scripts/browse-card/browse-cards-coveo-data-adaptor.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { eventTypeOptions, getBrowseFiltersResultCount } from '../browse-filters/browse-filter-utils.js';

const FACET_CONTROLLER_MAP = {
  el_product: 'headlessProductFacet',
  el_event_series: 'headlessEventSeriesFacet',
  el_contenttype: 'headlessTypeFacet',
};

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
      name: placeholders.filterProductLabel || 'Product',
      items: [],
      selected: 0,
    },
    {
      id: 'el_event_series',
      name: placeholders.filterEventSeriesLabel || 'Series',
      items: [],
      selected: 0,
    },
    {
      id: 'el_contenttype',
      name: placeholders.filterEventTypeLabel || 'Event Type',
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
      <span class="icon icon-filter"></span>
      <span>${placeholders.filterLabel || 'Filters'}</span>
      <span class="icon icon-chevron"></span>
    </button>
    <div class="events-search-filters-panel"></div>
    <button class="events-search-clear-filters" type="button">${
      placeholders.filterClearFilterLabel || 'Clear all filters'
    }</button>
  `;

  resultColumn.innerHTML = `
    <div class="events-search-topbar">
      <div class="events-search-keyword">
        <span class="icon icon-search"></span>
        <input type="text" class="events-search-keyword-input" placeholder="${
          placeholders.filterKeywordSearch || 'Search events'
        }" />
      </div>
      <div class="events-search-results-count"></div>
    </div>
    <div class="events-search-results-grid"></div>
    <div class="events-search-no-results">${placeholders.noResultsTextBrowse || 'No Results'}</div>
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

function renderFilterGroups(block, groups) {
  const panel = block.querySelector('.events-search-filters-panel');
  if (!panel) return;

  panel.innerHTML = '';
  groups.forEach((group) => {
    const groupEl = createTag('section', {
      class: 'events-search-filter-group is-expanded',
      'data-filter-type': group.id,
    });
    groupEl.innerHTML = `
      <button class="events-search-filter-group-header" type="button" aria-expanded="true">
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
      const optionEl = createTag('div', { class: 'events-search-filter-option' });
      optionEl.innerHTML = `
        <input type="checkbox" id="${optionId}" value="${optionValue}" data-label="${optionLabel}" />
        <span class="events-search-filter-option-label">${optionLabel}</span>
      `;
      optionsContainer.append(optionEl);
    });

    panel.append(groupEl);
  });
}

function updateGroupSelectionCount(block, groupId, selectedCount) {
  const groupEl = block.querySelector(`.events-search-filter-group[data-filter-type="${groupId}"]`);
  if (!groupEl) return;
  const countEl = groupEl.querySelector('.events-search-filter-group-count');
  if (!countEl) return;
  countEl.textContent = selectedCount > 0 ? `(${selectedCount})` : '';
}

function executeSearch() {
  if (!window.headlessSearchActionCreators || !window.headlessSearchEngine) return;
  const searchAction = window.headlessSearchActionCreators.executeSearch(window.logSearchboxSubmit());
  window.headlessSearchEngine.dispatch(searchAction);
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
  const suffix = placeholders.eventsSearchResultsLabel || 'events and recordings';
  countEl.textContent = `${countText} ${suffix}`;
}

async function renderResults(block, results = [], searchResponseId = '') {
  const grid = block.querySelector('.events-search-results-grid');
  const noResults = block.querySelector('.events-search-no-results');
  if (!grid || !noResults) return;

  if (!results.length) {
    grid.innerHTML = '';
    grid.setAttribute('hidden', '');
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
  normalizedCards.forEach((cardData) => {
    const cardWrapper = createTag('div', { class: 'events-search-card-item' });
    buildCard(cardWrapper, cardData);
    grid.append(cardWrapper);
  });

  noResults.setAttribute('hidden', '');
  grid.removeAttribute('hidden');
}

async function handleSearchEngineSubscription(block) {
  if (!window.headlessSearchEngine || window.headlessStatusControllers?.state?.isLoading) return;
  const search = window.headlessSearchEngine.state.search || {};
  const { results = [], searchResponseId = '', response = {} } = search;
  updateResultsCount(block, response.totalCount || 0);
  await renderResults(block, results, searchResponseId);
}

function bindFilterInteractions(block, groups) {
  const panel = block.querySelector('.events-search-filters-panel');
  if (!panel) return;

  panel.addEventListener('click', (event) => {
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
  });
}

function bindTopbarSearch(block) {
  const input = block.querySelector('.events-search-keyword-input');
  if (!input) return;

  const submitSearch = () => {
    if (!window.headlessSearchBox) return;
    window.headlessSearchBox.updateText(input.value.trim());
    if (window.headlessPager) {
      window.headlessPager.selectPage(1);
    }
    executeSearch();
  };

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
    if (window.headlessPager) {
      window.headlessPager.selectPage(1);
    }
    executeSearch();
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

async function initHeadlessSearch(block) {
  const { default: initiateCoveoHeadlessSearch } = await import('../../scripts/coveo-headless/index.js');
  await initiateCoveoHeadlessSearch({
    handleSearchEngineSubscription: () => handleSearchEngineSubscription(block),
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
    },
  });

  if (window.headlessQueryActionCreators && window.headlessSearchEngine) {
    const action = window.headlessQueryActionCreators.updateAdvancedSearchQueries({
      aq: BASE_COVEO_ADVANCED_QUERY_UPCOMING_EVENT,
    });
    window.headlessSearchEngine.dispatch(action);
    executeSearch();
  }
}

export default async function decorate(block) {
  const groups = getBaseFilterGroups();
  try {
    await loadDynamicFacetValues(groups);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching event facets:', error);
  }

  createLayout(block);
  renderFilterGroups(block, groups);
  bindFilterInteractions(block, groups);
  bindTopbarSearch(block);
  bindClearFilters(block, groups);
  bindMobileFilterToggle(block);
  await initHeadlessSearch(block);
  decorateIcons(block);
}
