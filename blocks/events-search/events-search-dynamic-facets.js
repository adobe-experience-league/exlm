import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createTag } from '../../scripts/scripts.js';
import { getRegularFacetValuesForField } from '../atomic-search/components/atomic-facet-engine-helpers.js';
import { getEventTypeUiOptionCount } from '../browse-filters/browse-filter-utils.js';
import {
  appendFilterGroupActions,
  buildFilterOptionRow,
  hasFilterGroupOptionsShimmer,
  removeFilterGroupOptionsShimmer,
  renderFilterGroupOptionsShimmer,
  updateFilterGroupActionButtons,
  updateFilterOptionCount,
} from './events-search-filter-ui.js';

/** Dynamic Product/Series facets are always on for events-search (URL flag kept for debug tooling only). */
export function isDynamicFacetsPocEnabled() {
  try {
    const param = new URLSearchParams(window.location.search).get('eventsDynamicFacets');
    if (param === 'false') return false;
  } catch {
    /* ignore */
  }
  return true;
}

/** Match atomic-search Product facet cap on /en/search. */
export const EVENTS_SEARCH_DYNAMIC_FACET_LIMITS = {
  el_product: 500,
  el_event_series: 100,
};

/** Fields whose checkbox lists are rebuilt from each Coveo search response. Event Type stays hardcoded. */
export const EVENTS_SEARCH_DYNAMIC_FACET_FIELDS = ['el_product', 'el_event_series'];

const FACET_CONTROLLER_MAP = {
  el_product: 'headlessProductFacet',
  el_event_series: 'headlessEventSeriesFacet',
  el_contenttype: 'headlessTypeFacet',
};

const INITIAL_VISIBLE_FILTER_OPTIONS = 5;

function sortItemsAlphabetically(a, b) {
  const titleA = (a.title || '').toLowerCase();
  const titleB = (b.title || '').toLowerCase();
  return titleA.localeCompare(titleB, document.documentElement.lang || 'en');
}

function formatFacetDisplayLabel(value) {
  return String(value ?? '')
    .split('|')
    .join(' | ');
}

function fillPlaceholderCount(template, value) {
  const s = String(value);
  // eslint-disable-next-line no-template-curly-in-string -- matches placeholders.json token
  return String(template).replaceAll('${count}', s).replaceAll('{}', s).replaceAll('{count}', s);
}

function getShowMoreLabel(count, placeholders) {
  const template = placeholders.eventSearchShowMoreLabel;
  if (!template) {
    return `Show ${count} more`;
  }
  return fillPlaceholderCount(template, count);
}

function getShowLessLabel(placeholders) {
  return placeholders.eventSearchShowLessLabel || 'Show less';
}

function updateShowMoreButtonState(groupEl, placeholders) {
  const showMoreButton = groupEl.querySelector('.events-search-filter-show-more');
  if (!showMoreButton) return;

  const totalOptions = groupEl.querySelectorAll('.events-search-filter-option').length;
  if (totalOptions <= INITIAL_VISIBLE_FILTER_OPTIONS) {
    showMoreButton.setAttribute('hidden', '');
    return;
  }

  const hiddenOptionsCount = groupEl.querySelectorAll('.events-search-filter-option.is-overflow-hidden').length;
  const labelEl = showMoreButton.querySelector('.events-search-filter-show-more-label');

  showMoreButton.removeAttribute('hidden');
  if (hiddenOptionsCount > 0) {
    showMoreButton.classList.remove('is-show-less');
    const nextText = getShowMoreLabel(hiddenOptionsCount, placeholders);
    if (labelEl) {
      labelEl.textContent = nextText;
    } else {
      showMoreButton.textContent = nextText;
    }
  } else {
    showMoreButton.classList.add('is-show-less');
    if (labelEl) {
      labelEl.textContent = getShowLessLabel(placeholders);
    } else {
      showMoreButton.textContent = getShowLessLabel(placeholders);
    }
  }
}

function getFacetResultCount(facetValue) {
  const count = facetValue?.numberOfResults ?? facetValue?.count;
  return typeof count === 'number' ? count : 0;
}

/**
 * Maps Coveo Headless facet controller values to events-search group items.
 * Keeps selected values even when count is 0 (search-context-aware facets).
 */
export function mapHeadlessFacetValuesToItems(facetValues = []) {
  return facetValues
    .filter((facetValue) => facetValue.state === 'selected' || getFacetResultCount(facetValue) > 0)
    .map((facetValue) => {
      const displayLabel = formatFacetDisplayLabel(facetValue.value);
      const count = getFacetResultCount(facetValue);
      return {
        id: facetValue.value,
        value: facetValue.value,
        title: displayLabel,
        description: '',
        count,
        selected: facetValue.state === 'selected',
      };
    })
    .sort(sortItemsAlphabetically);
}

/** Headless uses numberOfResults; Search API responses may use numberOfResults or count. */

/**
 * Reads facet values from controller state, engine facetSet, or the latest search response.
 * Controller state can lag behind the engine until the next subscription tick.
 */
function getHeadlessFacetValuesForField(field) {
  const controllerName = FACET_CONTROLLER_MAP[field];
  const controller = controllerName ? window[controllerName] : null;
  const fromController = controller?.state?.values;
  if (Array.isArray(fromController) && fromController.length > 0) {
    return fromController;
  }

  const fromEngine = getRegularFacetValuesForField(window.headlessSearchEngine, field);
  if (fromEngine.length > 0) {
    return fromEngine;
  }

  const responseFacets = window.headlessSearchEngine?.state?.search?.response?.facets || [];
  const responseFacet = responseFacets.find((facet) => facet.field === field);
  if (Array.isArray(responseFacet?.values) && responseFacet.values.length > 0) {
    return responseFacet.values;
  }

  return Array.isArray(fromController) ? fromController : [];
}

function captureSelectedValuesFromDom(groupEl) {
  const selected = new Set();
  groupEl.querySelectorAll('.events-search-filter-option input[type="checkbox"]:checked').forEach((checkbox) => {
    selected.add(checkbox.value);
  });
  return selected;
}

function mergeSelectedStateIntoItems(items, selectedFromDom) {
  return items.map((item) => ({
    ...item,
    selected: item.selected || selectedFromDom.has(item.value),
  }));
}

function updateExistingOptionCounts(groupEl, facetValues, placeholders) {
  groupEl.querySelectorAll('.events-search-filter-option').forEach((optionEl) => {
    const checkbox = optionEl.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    const facetValue = facetValues.find((value) => value.value === checkbox.value);
    const count = facetValue ? getFacetResultCount(facetValue) : undefined;
    const label = checkbox.getAttribute('data-label') || checkbox.value;

    if (facetValue && (count > 0 || facetValue.state === 'selected')) {
      updateFilterOptionCount(optionEl, count, label);
      optionEl.hidden = false;
      return;
    }

    if (checkbox.checked) {
      updateFilterOptionCount(optionEl, count ?? 0, label);
      optionEl.hidden = false;
      return;
    }

    optionEl.hidden = true;
  });

  updateFilterGroupActionButtons(groupEl, placeholders);
}

function hasCompletedHeadlessSearch() {
  return Boolean(window.headlessStatusControllers?.state?.firstSearchExecuted);
}

function renderGroupOptions(groupEl, group, placeholders) {
  const optionsContainer = groupEl.querySelector('.events-search-filter-options');
  if (!optionsContainer) return;

  removeFilterGroupOptionsShimmer(optionsContainer);
  optionsContainer.innerHTML = '';
  const optionsList = createTag('div', { class: 'events-search-filter-options-list' });

  group.items.forEach((item, index) => {
    optionsList.append(
      buildFilterOptionRow({
        groupId: group.id,
        item: { ...item, overflowHidden: index >= INITIAL_VISIBLE_FILTER_OPTIONS },
        index,
        placeholders,
      }),
    );
  });

  optionsContainer.append(optionsList);
  appendFilterGroupActions(optionsContainer, group, placeholders);

  if (group.items.length > INITIAL_VISIBLE_FILTER_OPTIONS) {
    const remainingCount = group.items.length - INITIAL_VISIBLE_FILTER_OPTIONS;
    const showMoreButton = createTag('button', { class: 'events-search-filter-show-more', type: 'button' });
    const showMoreLabel = createTag('span', { class: 'events-search-filter-show-more-label' });
    showMoreLabel.textContent = getShowMoreLabel(remainingCount, placeholders);
    const showMoreIcon = createTag('span', { class: 'icon icon-arrow', 'aria-hidden': 'true' });
    showMoreButton.append(showMoreLabel, showMoreIcon);
    optionsContainer.append(showMoreButton);
  }

  updateShowMoreButtonState(groupEl, placeholders);
  updateFilterGroupActionButtons(groupEl, placeholders);
  decorateIcons(optionsContainer);
}

/**
 * Rebuilds one filter group's checkbox list from Headless facet controller state.
 */
export function syncDynamicFacetGroupFromHeadless(block, group, placeholders) {
  const groupEl = block.querySelector(`.events-search-filter-group[data-filter-type="${group.id}"]`);
  if (!groupEl) return;

  const optionsContainer = groupEl.querySelector('.events-search-filter-options');
  const facetValues = getHeadlessFacetValuesForField(group.id);
  let items = mapHeadlessFacetValuesToItems(facetValues);
  const selectedFromDom = captureSelectedValuesFromDom(groupEl);
  const hasOptionsInDom = groupEl.querySelector('.events-search-filter-option');

  if (items.length === 0) {
    if (hasOptionsInDom && group.items.length > 0) {
      updateExistingOptionCounts(groupEl, facetValues, placeholders);
      groupEl.classList.remove('is-filter-loading');
      return;
    }
    if (!hasCompletedHeadlessSearch()) {
      if (!hasFilterGroupOptionsShimmer(optionsContainer)) {
        renderFilterGroupOptionsShimmer(optionsContainer);
      }
      return;
    }
    removeFilterGroupOptionsShimmer(optionsContainer);
    groupEl.classList.remove('is-filter-loading');
    return;
  }

  items = mergeSelectedStateIntoItems(items, selectedFromDom);

  const wasExpanded = groupEl.classList.contains('is-expanded');
  group.items = items;
  group.selected = items.filter((item) => item.selected).length;

  renderGroupOptions(groupEl, group, placeholders);
  groupEl.classList.remove('is-filter-loading');

  if (wasExpanded) {
    groupEl.classList.add('is-expanded');
    groupEl.querySelector('.events-search-filter-group-header')?.setAttribute('aria-expanded', 'true');
  }

  const countEl = groupEl.querySelector('.events-search-filter-group-count');
  if (countEl) {
    countEl.textContent = group.selected > 0 ? `(${group.selected})` : '';
  }
}

/**
 * Reserve filter option space while Coveo search is in flight (avoids CLS).
 * @param {HTMLElement} block
 * @param {{ refreshCountsOnly?: boolean }} [options]
 */
export function showDynamicFilterGroupShimmers(block, { refreshCountsOnly = false } = {}) {
  if (!isDynamicFacetsPocEnabled()) return;

  EVENTS_SEARCH_DYNAMIC_FACET_FIELDS.forEach((field) => {
    const groupEl = block.querySelector(`.events-search-filter-group[data-filter-type="${field}"]`);
    const optionsContainer = groupEl?.querySelector('.events-search-filter-options');
    if (!groupEl || !optionsContainer) return;

    const hasOptions = groupEl.querySelector('.events-search-filter-option');
    if (refreshCountsOnly && hasOptions) {
      groupEl.classList.add('is-filter-loading');
      return;
    }

    if (!hasOptions && !hasFilterGroupOptionsShimmer(optionsContainer)) {
      renderFilterGroupOptionsShimmer(optionsContainer);
    }
  });
}

/** @param {HTMLElement} block */
export function hideDynamicFilterGroupShimmers(block) {
  EVENTS_SEARCH_DYNAMIC_FACET_FIELDS.forEach((field) => {
    const groupEl = block.querySelector(`.events-search-filter-group[data-filter-type="${field}"]`);
    groupEl?.classList.remove('is-filter-loading');
    removeFilterGroupOptionsShimmer(groupEl?.querySelector('.events-search-filter-options'));
  });
}

/**
 * Updates Event Type checkbox labels with contextual counts from Headless (filtering still uses cq).
 */
export function syncEventTypeFilterCounts(block) {
  const controller = window.headlessTypeFacet;
  const groupEl = block.querySelector('.events-search-filter-group[data-filter-type="el_contenttype"]');
  if (!controller || !groupEl) return;

  const facetValues = getHeadlessFacetValuesForField('el_contenttype');
  groupEl.querySelectorAll('.events-search-filter-option').forEach((optionEl) => {
    const checkbox = optionEl.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    const count = getEventTypeUiOptionCount(checkbox.value, facetValues);
    if (count == null) return;
    const label = checkbox.getAttribute('data-label') || checkbox.value;
    updateFilterOptionCount(optionEl, count, label);
  });
  groupEl.classList.remove('is-filter-loading');
}

/**
 * Sync Product and Series groups from live Headless facet state.
 * Event Type keeps fixed options; counts refresh via {@link syncEventTypeFilterCounts}.
 */
export function syncDynamicFacetGroupsFromHeadless(block, groups, placeholders) {
  if (!isDynamicFacetsPocEnabled()) return;

  groups.forEach((group) => {
    if (!EVENTS_SEARCH_DYNAMIC_FACET_FIELDS.includes(group.id)) return;
    syncDynamicFacetGroupFromHeadless(block, group, placeholders);
  });

  syncEventTypeFilterCounts(block);

  if (isDynamicFacetsPocEnabled() && new URLSearchParams(window.location.search).get('eventsFacetDebug') === 'true') {
    EVENTS_SEARCH_DYNAMIC_FACET_FIELDS.forEach((field) => {
      const controller = window[FACET_CONTROLLER_MAP[field]];
      // eslint-disable-next-line no-console
      console.debug('[EXLM-5132 POC] facet state', field, controller?.state?.values);
    });
  }
}

/**
 * Headless facet build overrides for events-search POC (same pipeline + search hub as /en/search).
 */
export function getEventsSearchHeadlessFacetOverrides() {
  if (!isDynamicFacetsPocEnabled()) return {};

  return {
    el_product: {
      numberOfValues: EVENTS_SEARCH_DYNAMIC_FACET_LIMITS.el_product,
      options: { filterFacetCount: true, sortCriteria: 'alphanumeric' },
    },
    el_event_series: {
      numberOfValues: EVENTS_SEARCH_DYNAMIC_FACET_LIMITS.el_event_series,
      options: { filterFacetCount: true, sortCriteria: 'alphanumeric' },
    },
  };
}
