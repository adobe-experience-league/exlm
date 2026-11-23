import { createTag, htmlToElement } from '../../scripts.js';
import { decorateIcons } from '../../lib-franklin.js';
import createSearchBar from './search-bar.js';

export function alphabetical(a, b) {
  return a.title.localeCompare(b.title, document.documentElement.lang || 'en', { sensitivity: 'base' });
}

export function getPlaylistFacetItems(group, values) {
  return values
    .filter((item) => item.count > 0 || item.selected)
    .map((item) => {
      const option = group.items?.find(({ value }) => value.toLowerCase() === item.value.toLowerCase());
      return { ...item, title: option?.title || item.value, description: option?.description };
    })
    .sort(
      group.id === 'level'
        ? (a, b) =>
            group.items.findIndex((item) => item.value.toLowerCase() === a.value.toLowerCase()) -
            group.items.findIndex((item) => item.value.toLowerCase() === b.value.toLowerCase())
        : (a, b) => a.value.localeCompare(b.value),
    );
}

/** Shared Coveo facet presentation for authored/static group items or dynamic product/role/author values. */
export function getCoveoFacetItems(group, values, state) {
  const selected = new Set(state.filters[group.id]);
  if (group.items) {
    return group.items
      .map((item) => ({ ...item, count: values.find((value) => value.value === item.value)?.count ?? 0 }))
      .filter((item) => selected.has(item.value) || item.count > 0);
  }
  return values
    .filter((value) => selected.has(value.value) || value.count > 0)
    .map((value) => ({ ...value, title: value.value.split('|').join(' | ') }))
    .sort(alphabetical);
}

export function getCourseFacetItems(group, values, state, placeholders) {
  if (group.id !== 'el_level') return getCoveoFacetItems(group, values, state);
  const priority = ['Beginner', 'Intermediate', 'Experienced'];
  const rank = (value) => {
    const index = priority.findIndex((level) => level.toLowerCase() === String(value).toLowerCase());
    return index < 0 ? priority.length : index;
  };
  const selected = new Set(state.filters[group.id]);
  return values
    .filter((value) => selected.has(value.value) || value.count > 0)
    .map((value) => ({
      ...value,
      title: placeholders[`filterExpLevel${value.value}Title`] || value.value,
      description: placeholders[`filterExpLevel${value.value}Description`] || '',
    }))
    .sort((a, b) => rank(a.value) - rank(b.value) || alphabetical(a, b));
}

/** Remap store filters onto Coveo values; false = facets not ready. */
function remapLegacyFilters(store, snapshot, groupId, { pipeInsensitive = false } = {}) {
  const selected = store.get().filters[groupId] || [];
  if (!selected.length) return true;
  const facetValues = (snapshot.facets?.[groupId] || []).map((value) => value.value);
  if (!facetValues.length) return false;
  const stripPipes = (value) => value?.replace(/\|/g, '');
  const mapped = selected
    .map((legacy) =>
      facetValues.find((value) => (pipeInsensitive ? stripPipes(value) === stripPipes(legacy) : value === legacy)),
    )
    .filter(Boolean);
  if (mapped.length !== selected.length || mapped.some((value, index) => value !== selected[index])) {
    store.setGroup(groupId, mapped);
  }
  return true;
}

export function createCourseLegacyFilterMapper() {
  let done = false;
  return ({ store, snapshot }) => {
    if (done) return;
    const productsDone = remapLegacyFilters(store, snapshot, 'el_product', { pipeInsensitive: true });
    const levelsDone = remapLegacyFilters(store, snapshot, 'el_level');
    done = productsDone && levelsDone;
  };
}

export function filterCourseCardsByStatus(cards, selectedStatuses) {
  return cards.filter((card) => !selectedStatuses.size || selectedStatuses.has(card.dataset.courseStatus));
}

export default function createFacetedSearchUI({
  store,
  groups,
  placeholders = {},
  withKeyword = true,
  expandedByDefault = false,
  closeIcon = 'icon-close',
}) {
  const c = (name) => `fs-${name}`;
  const instanceId = `fs-${crypto.randomUUID()}`;
  const itemsByGroup = new Map(groups.map((g) => [g.id, []]));
  const groupEls = new Map();

  /* ---------- filters column ---------- */
  const filtersEl = htmlToElement(`
    <div class="fs-filters">
      <div class="fs-filters-header">
        <h2 class="fs-filters-heading"></h2>
        <button type="button" class="fs-clear-filters"></button>
      </div>
      <div class="fs-filter-groups"></div>
    </div>`);
  filtersEl.querySelector('.fs-filters-heading').textContent = placeholders.filtersLabel || 'Filters';
  const groupsRoot = filtersEl.querySelector(`.${c('filter-groups')}`);
  const clearBtn = filtersEl.querySelector(`.${c('clear-filters')}`);
  clearBtn.textContent = placeholders.filterClearLabel || 'Clear filters';

  groups.forEach((group, i) => {
    const regionId = `${instanceId}-${group.id}-options-${i}`;
    const groupEl = htmlToElement(`
      <div class="fs-filter-group">
        <button class="fs-filter-group-header" type="button">
          <span class="fs-filter-group-title"></span>
          <span class="fs-filter-group-count"></span>
          <span class="icon icon-chevron"></span>
        </button>
        <div class="fs-filter-options"></div>
      </div>`);
    groupEl.classList.toggle('is-expanded', expandedByDefault);
    groupEl.dataset.filterType = group.id;
    const header = groupEl.querySelector('.fs-filter-group-header');
    header.setAttribute('aria-expanded', String(expandedByDefault));
    header.setAttribute('aria-controls', regionId);
    groupEl.querySelector('.fs-filter-group-title').textContent = group.name;
    groupEl.querySelector('.fs-filter-options').id = regionId;
    groupEl.hidden = true; // shown once it has items
    groupEls.set(group.id, groupEl);
    groupsRoot.append(groupEl);
  });
  decorateIcons(groupsRoot);

  /* ---------- keyword ---------- */
  let keywordEl = null;
  let input = null;
  let additionalFiltersActive = false;
  function updateClearFiltersButton() {
    const { tags, keyword } = store.get();
    const hasAny = Boolean(tags.length || keyword || input?.value.trim() || additionalFiltersActive);
    clearBtn.classList.toggle('is-active', hasAny);
    clearBtn.disabled = !hasAny;
  }

  let searchBar = null;
  if (withKeyword) {
    searchBar = createSearchBar({ store, placeholders, onInput: updateClearFiltersButton });
    keywordEl = searchBar.el;
    input = searchBar.input;
  }

  /* ---------- active filter tags ---------- */
  const activeEl = createTag('div', { class: c('active-filters'), role: 'group', hidden: '' });
  activeEl.setAttribute('aria-label', placeholders.activeFiltersAriaLabel || 'Active filters');

  function renderActive() {
    const { tags } = store.get();
    const next = tags.map((t) => `${t.groupId}:${t.value}|${t.label}`);
    const current = [...activeEl.children].map((n) => `${n.dataset.key}|${n.dataset.label}`);
    if (next.length === current.length && next.every((k, i) => k === current[i])) return;

    const focusedKey = activeEl.querySelector('button:focus')?.closest('[data-key]')?.dataset.key;
    const previousKeys = [...activeEl.children].map((n) => n.dataset.key);
    activeEl.innerHTML = '';
    tags.forEach(({ groupId, value, label }) => {
      const tag = createTag('span', {
        class: c('active-filter-tag'),
        'data-key': `${groupId}:${value}`,
        'data-label': label,
      });
      const text = createTag('span', { class: c('active-filter-tag-label') });
      text.textContent = label;
      const remove = createTag('button', {
        class: c('active-filter-tag-remove'),
        type: 'button',
        'aria-label': `Remove filter: ${label}`,
      });
      remove.append(createTag('span', { class: `icon ${closeIcon}`, 'aria-hidden': 'true' }));
      remove.addEventListener('click', () => store.toggle(groupId, value, false, label), { once: true });
      tag.append(text, remove);
      activeEl.append(tag);
    });
    decorateIcons(activeEl);
    activeEl.hidden = !tags.length;
    if (focusedKey) {
      const idx = Math.min(previousKeys.indexOf(focusedKey), activeEl.children.length - 1);
      const nextTag = activeEl.children[idx];
      (nextTag?.querySelector('button') || input)?.focus();
    }
  }

  /* ---------- options ---------- */
  function renderOptions(groupId) {
    const groupEl = groupEls.get(groupId);
    const container = groupEl?.querySelector(`.${c('filter-options')}`);
    if (!container) return;
    const selected = new Set(store.get().filters[groupId]);
    const list = createTag('div', { class: c('filter-options-list') });
    itemsByGroup.get(groupId).forEach((item, i) => {
      const id = `${instanceId}-${groupId}-${i}-${String(item.value).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
      const label = item.title || item.value;
      const row = createTag('div', { class: `${c('filter-option')}${selected.has(item.value) ? ' checked' : ''}` });
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = id;
      cb.value = item.value;
      cb.checked = selected.has(item.value);
      cb.setAttribute('data-label', label);
      const lbl = createTag('label', { class: c('filter-option-label'), for: id });
      lbl.append(document.createTextNode(label));
      if (typeof item.count === 'number') {
        const count = createTag('span', { class: c('filter-option-count') });
        count.textContent = ` (${item.count})`;
        lbl.append(count);
      }
      if (item.description) lbl.title = item.description;
      row.append(cb, lbl);
      list.append(row);
    });
    container.replaceChildren(list);
    groupEl.hidden = !itemsByGroup.get(groupId).length;
  }

  /* ---------- sync UI from store ---------- */
  const refreshListeners = new Set();
  function refresh() {
    const { filters, keyword } = store.get();
    groups.forEach((g) => {
      const selected = new Set(filters[g.id]);
      const groupEl = groupEls.get(g.id);
      groupEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        cb.checked = selected.has(cb.value);
        cb.closest(`.${c('filter-option')}`)?.classList.toggle('checked', cb.checked);
      });
      groupEl.querySelector(`.${c('filter-group-count')}`).textContent = selected.size ? `(${selected.size})` : '';
    });
    if (input && input.value !== keyword && document.activeElement !== input) input.value = keyword;
    keywordEl
      ?.querySelector(`.${c('keyword-clear')}`)
      ?.classList.toggle('is-visible', Boolean(keyword || input?.value));
    updateClearFiltersButton();
    renderActive();
    refreshListeners.forEach((fn) => fn());
  }

  /* ---------- results count ---------- */
  const countEl = createTag('div', {
    class: c('results-count'),
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });
  /** count: number, or null to hide while loading. suffix: e.g. 'playlists'. */
  function setResultCount(count, suffix = '') {
    if (count == null) {
      countEl.replaceChildren();
      return;
    }
    const value = createTag('strong', { class: c('results-count-value') }, new Intl.NumberFormat().format(count));
    countEl.replaceChildren(value, document.createTextNode(suffix ? ` ${suffix}` : ''));
  }

  /* ---------- events ---------- */
  filtersEl.addEventListener('click', (e) => {
    const header = e.target.closest(`.${c('filter-group-header')}`);
    if (!header) return;
    const open = header.closest(`.${c('filter-group')}`).classList.toggle('is-expanded');
    header.setAttribute('aria-expanded', String(open));
  });

  filtersEl.addEventListener('change', (e) => {
    const cb = e.target.closest('input[type="checkbox"]');
    const groupId = cb?.closest(`.${c('filter-group')}`)?.dataset.filterType;
    if (groupId) store.toggle(groupId, cb.value, cb.checked, cb.dataset.label);
  });

  clearBtn.addEventListener('click', () => {
    if (input) input.value = '';
    store.clear();
  });
  const unsubscribe = store.subscribe(refresh);

  return {
    filtersEl,
    keywordEl,
    activeEl,
    countEl,
    setResultCount,
    store,
    setAdditionalFiltersActive(active) {
      additionalFiltersActive = active;
      updateClearFiltersButton();
    },
    /** Run fn after every UI refresh (used for the mobile toggle's active-filter count). */
    onRefresh(fn) {
      refreshListeners.add(fn);
      return () => refreshListeners.delete(fn);
    },
    /** Replace a group's options. Called by the adapter whenever data/facets change. */
    setGroupItems(groupId, items) {
      itemsByGroup.set(groupId, items);
      items.forEach((it) => store.setLabel(groupId, it.value, it.title || it.value));
      renderOptions(groupId);
      refresh();
    },
    setLoading(isLoading) {
      filtersEl.classList.toggle('is-filter-loading', isLoading);
      groupEls.forEach((el) => el.classList.toggle('is-filter-loading', isLoading));
    },
    refresh,
    destroy() {
      unsubscribe();
      refreshListeners.clear();
      searchBar?.destroy();
    },
  };
}
