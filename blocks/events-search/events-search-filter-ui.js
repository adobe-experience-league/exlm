import { createTag } from '../../scripts/scripts.js';

const MIN_OPTIONS_FOR_SELECT_ALL = 2;
export const FILTER_OPTION_SHIMMER_ROW_COUNT = 5;

export function removeFilterGroupOptionsShimmer(optionsContainer) {
  optionsContainer?.querySelector('.events-search-filter-options-shimmer')?.remove();
}

export function hasFilterGroupOptionsShimmer(optionsContainer) {
  return Boolean(optionsContainer?.querySelector('.events-search-filter-options-shimmer'));
}

export function renderFilterGroupOptionsShimmer(optionsContainer, rowCount = FILTER_OPTION_SHIMMER_ROW_COUNT) {
  if (!optionsContainer) return;
  removeFilterGroupOptionsShimmer(optionsContainer);

  const shimmerRoot = createTag('div', {
    class: 'events-search-filter-options-shimmer',
    'aria-hidden': 'true',
  });

  for (let index = 0; index < rowCount; index += 1) {
    shimmerRoot.append(
      createTag('div', {
        class: 'events-search-filter-option-shimmer',
      }),
    );
  }

  optionsContainer.append(shimmerRoot);
}

/** Placeholder count suffix on Event Type rows until Headless counts arrive. */
export function renderFilterOptionCountShimmer(optionEl) {
  const checkbox = optionEl?.querySelector('input[type="checkbox"]');
  const optionLabelEl = optionEl?.querySelector('.events-search-filter-option-label');
  if (!checkbox || !optionLabelEl) return;

  const optionLabel = checkbox.getAttribute('data-label') || checkbox.value;
  optionLabelEl.innerHTML = `${String(optionLabel ?? '')}<span class="events-search-filter-option-count events-search-filter-count-shimmer" aria-hidden="true"></span>`;
}

export function getFilterOnlyLabel(placeholders) {
  return placeholders.searchContentOnlyLabel || placeholders.eventSearchFilterOnlyLabel || 'Only';
}

export function getFilterAllLabel(placeholders) {
  return placeholders.searchContentAllLabel || placeholders.eventSearchFilterAllLabel || 'All';
}

export function getFilterSelectAllLabel(placeholders) {
  return placeholders.eventSearchFilterSelectAllLabel || 'Select all';
}

export function getFilterClearAllLabel(placeholders) {
  return placeholders.eventSearchFilterClearAllLabel || 'Clear all';
}

export function updateFilterGroupSelectAllButton(groupEl, placeholders) {
  const selectAllBtn = groupEl?.querySelector('.events-search-filter-select-all');
  if (!selectAllBtn) return;

  const checkboxes = groupEl.querySelectorAll('.events-search-filter-option input[type="checkbox"]');
  const checkedCount = groupEl.querySelectorAll('.events-search-filter-option input[type="checkbox"]:checked').length;
  const allSelected = checkboxes.length > 0 && checkedCount === checkboxes.length;

  selectAllBtn.textContent = allSelected
    ? getFilterClearAllLabel(placeholders)
    : getFilterSelectAllLabel(placeholders);
  selectAllBtn.dataset.filterAction = allSelected ? 'clear-all' : 'select-all';
}

/**
 * Sets row action label to "Only" (unselected) or "All" (selected), matching atomic-search behavior.
 */
export function updateFilterOptionActionButton(optionEl, placeholders) {
  const checkbox = optionEl?.querySelector('input[type="checkbox"]');
  const actionBtn = optionEl?.querySelector('.events-search-filter-only-btn');
  if (!checkbox || !actionBtn) return;

  const isSelected = checkbox.checked;
  const actionLabel = isSelected ? getFilterAllLabel(placeholders) : getFilterOnlyLabel(placeholders);
  actionBtn.textContent = actionLabel;
  actionBtn.dataset.filterAction = isSelected ? 'all' : 'only';

  const optionLabel = checkbox.getAttribute('data-label') || checkbox.value;
  actionBtn.setAttribute('aria-label', `${actionLabel}: ${optionLabel}`);
  optionEl.classList.toggle('checked', isSelected);
}

export function updateFilterGroupActionButtons(groupEl, placeholders) {
  if (!groupEl) return;
  groupEl.querySelectorAll('.events-search-filter-option').forEach((optionEl) => {
    updateFilterOptionActionButton(optionEl, placeholders);
  });
  updateFilterGroupSelectAllButton(groupEl, placeholders);
}

/** Refresh option label + count suffix without rebuilding the row. */
export function updateFilterOptionCount(optionEl, count, optionLabel) {
  const checkbox = optionEl?.querySelector('input[type="checkbox"]');
  const optionLabelEl = optionEl?.querySelector('.events-search-filter-option-label');
  if (!checkbox || !optionLabelEl) return;

  if (typeof count === 'number' && count >= 0) {
    checkbox.setAttribute('data-count', String(count));
    optionLabelEl.innerHTML = `${String(optionLabel ?? '')}<span class="events-search-filter-option-count"> (${count})</span>`;
  } else {
    checkbox.removeAttribute('data-count');
    optionLabelEl.textContent = String(optionLabel ?? '');
  }
}

/**
 * Row actions shown above checkbox lists when a group has multiple values.
 */
export function appendFilterGroupActions(optionsContainer, group, placeholders) {
  if (group.items.length < MIN_OPTIONS_FOR_SELECT_ALL) return;

  const existing = optionsContainer.querySelector('.events-search-filter-group-actions');
  existing?.remove();

  const actions = createTag('div', { class: 'events-search-filter-group-actions' });
  const selectAllBtn = createTag('button', {
    class: 'events-search-filter-select-all',
    type: 'button',
  });
  selectAllBtn.dataset.filterAction = 'select-all';
  selectAllBtn.textContent = getFilterSelectAllLabel(placeholders);
  actions.append(selectAllBtn);

  const optionsList = optionsContainer.querySelector('.events-search-filter-options-list');
  if (optionsList) {
    optionsContainer.insertBefore(actions, optionsList);
  } else {
    optionsContainer.prepend(actions);
  }
}

/**
 * Builds one filter checkbox row with optional "Only" control (atomic-search pattern).
 */
export function buildFilterOptionRow({ groupId, item, index, placeholders }) {
  const optionValue = item.value || item.title;
  const optionLabel = item.title || item.value;
  const optionId = `${groupId}-${index + 1}-${String(optionValue).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const overflowClass = item.overflowHidden ? ' is-overflow-hidden' : '';
  const optionEl = createTag('div', {
    class: `events-search-filter-option${overflowClass}${item.selected ? ' checked' : ''}`,
  });

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = optionId;
  checkbox.value = String(optionValue ?? '');
  checkbox.checked = Boolean(item.selected);
  checkbox.setAttribute('data-label', String(optionLabel ?? ''));
  if (item.count != null) {
    checkbox.setAttribute('data-count', String(item.count));
  }

  const optionLabelEl = createTag('label', {
    class: 'events-search-filter-option-label',
    for: optionId,
  });
  if (item.count != null) {
    optionLabelEl.innerHTML = `${String(optionLabel ?? '')}<span class="events-search-filter-option-count"> (${item.count})</span>`;
  } else {
    optionLabelEl.textContent = String(optionLabel ?? '');
  }

  const onlyBtn = createTag('button', {
    class: 'events-search-filter-only-btn',
    type: 'button',
  });
  optionEl.append(checkbox, optionLabelEl, onlyBtn);
  updateFilterOptionActionButton(optionEl, placeholders);
  return optionEl;
}
