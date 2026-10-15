import { createTag } from '../scripts.js';
import { decorateIcons } from '../lib-franklin.js';

/* ------------------------------------------------------------------ */
/* Store: single source of truth for selected filters + keyword        */
/* ------------------------------------------------------------------ */
export function createFilterStore({ groupIds, initial = {}, defaultSort = '' }) {
  let tags = []; // ordered: [{ groupId, value, label }]
  let keyword = initial.keyword || '';
  let sort = initial.sort ?? defaultSort;
  const listeners = new Set();

  groupIds.forEach((id) => {
    (initial[id] || []).forEach((value) => tags.push({ groupId: id, value, label: value }));
  });

  const get = () => ({
    keyword,
    sort,
    tags: tags.map((t) => ({ ...t })),
    filters: Object.fromEntries(groupIds.map((id) => [id, tags.filter((t) => t.groupId === id).map((t) => t.value)])),
  });
  // source: 'filter' | 'keyword' | 'clear'
  const emit = (source) => listeners.forEach((fn) => fn(get(), source));
  const indexOf = (groupId, value) => tags.findIndex((t) => t.groupId === groupId && t.value === value);

  return {
    get,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    toggle(groupId, value, checked, label = value, { silent = false } = {}) {
      const idx = indexOf(groupId, value);
      if (checked && idx === -1) tags.push({ groupId, value, label });
      else if (!checked && idx !== -1) tags.splice(idx, 1);
      else return;
      if (!silent) emit('filter');
    },
    /** Reconcile a whole group. Returns true if anything changed. */
    setGroup(groupId, values, { silent = false } = {}) {
      const want = new Set(values);
      const before = tags.length;
      tags = tags.filter((t) => t.groupId !== groupId || want.has(t.value));
      let changed = tags.length !== before;
      values.forEach((v) => {
        if (indexOf(groupId, v) === -1) {
          tags.push({ groupId, value: v, label: v });
          changed = true;
        }
      });
      if (changed && !silent) emit('filter');
      return changed;
    },
    /** Update the display label of an already-selected value (never emits). */
    setLabel(groupId, value, label) {
      const idx = indexOf(groupId, value);
      if (idx !== -1) tags[idx].label = label;
    },
    setKeyword(value, { silent = false } = {}) {
      const next = String(value ?? '').trim();
      if (next === keyword) return;
      keyword = next;
      if (!silent) emit('keyword');
    },
    setSort(value, { silent = false } = {}) {
      const next = String(value ?? '');
      if (next === sort) return;
      sort = next;
      if (!silent) emit('sort');
    },
    clear({ silent = false } = {}) {
      tags = [];
      keyword = '';
      sort = defaultSort;
      if (!silent) emit('clear');
    },
  };
}

/* ------------------------------------------------------------------ */
/* URL sync                                                            */
/* format: 'comma' (?product=a,b)  |  'repeat' (?solution=a&solution=b) */
/* ------------------------------------------------------------------ */
export function readFiltersFromUrl(groupIds, { format = 'repeat', sanitize = (v) => v } = {}) {
  const params = new URL(window.location.href).searchParams;
  return Object.fromEntries(
    groupIds.map((id) => {
      const raw = format === 'comma' ? (params.get(id) || '').split(',') : params.getAll(id);
      return [id, raw.map((v) => sanitize(v.trim())).filter(Boolean)];
    }),
  );
}

export function readKeywordFromUrl(param = 'q', sanitize = (v) => v) {
  return sanitize((new URL(window.location.href).searchParams.get(param) || '').trim());
}

/** keywordParam (e.g. 'q'): also mirrors the store keyword into the URL. */
export function bindFiltersToUrl(store, groupIds, { format = 'repeat', keywordParam = null, sortParam = null } = {}) {
  return store.subscribe(({ filters, keyword, sort }) => {
    const url = new URL(window.location.href);
    groupIds.forEach((id) => {
      url.searchParams.delete(id);
      if (!filters[id]?.length) return;
      if (format === 'comma') url.searchParams.set(id, filters[id].join(','));
      else filters[id].forEach((v) => url.searchParams.append(id, v));
    });
    if (keywordParam) {
      if (keyword) url.searchParams.set(keywordParam, keyword);
      else url.searchParams.delete(keywordParam);
    }
    if (sortParam) {
      if (sort) url.searchParams.set(sortParam, sort);
      else url.searchParams.delete(sortParam);
    }
    if (url.href !== window.location.href) window.history.pushState({}, '', url);
  });
}

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* groups: [{ id, name }]                                              */
/* items (per group): [{ value, title?, count?, description? }]        */
/* ------------------------------------------------------------------ */
export function createSearchFilterUI({
  store,
  groups,
  placeholders = {},
  prefix = 'sf',
  withKeyword = true,
  expandedByDefault = true,
  closeIcon = 'icon-close',
}) {
  const c = (name) => `${prefix}-${name}`;
  const itemsByGroup = new Map(groups.map((g) => [g.id, []]));
  const groupEls = new Map();

  /* ---------- filters column ---------- */
  const filtersEl = createTag('div', { class: c('filters') });
  filtersEl.innerHTML = `
    <div class="${c('filters-header')}">
      <h2 class="${c('filters-heading')}">${placeholders.filtersLabel || 'Filters'}</h2>
      <button type="button" class="${c('clear-filters')}">${placeholders.filterClearLabel || 'Clear filters'}</button>
    </div>
    <div class="${c('filter-groups')}"></div>`;
  const groupsRoot = filtersEl.querySelector(`.${c('filter-groups')}`);
  const clearBtn = filtersEl.querySelector(`.${c('clear-filters')}`);

  groups.forEach((group, i) => {
    const regionId = `${prefix}-${group.id}-options-${i}`;
    const groupEl = createTag('section', {
      class: `${c('filter-group')}${expandedByDefault ? ' is-expanded' : ''}`,
      'data-filter-type': group.id,
    });
    groupEl.innerHTML = `
      <button class="${c(
        'filter-group-header',
      )}" type="button" aria-expanded="${expandedByDefault}" aria-controls="${regionId}">
        <span class="${c('filter-group-title')}">${group.name}</span>
        <span class="${c('filter-group-count')}"></span>
        <span class="icon icon-chevron"></span>
      </button>
      <div class="${c('filter-options')}" id="${regionId}"></div>`;
    groupEl.hidden = true; // shown once it has items
    groupEls.set(group.id, groupEl);
    groupsRoot.append(groupEl);
  });
  decorateIcons(groupsRoot);

  /* ---------- keyword ---------- */
  let keywordEl = null;
  let input = null;
  if (withKeyword) {
    keywordEl = createTag('div', { class: c('keyword') });
    keywordEl.innerHTML = `
      <span class="icon icon-search-gray"></span>
      <input type="text" class="${c('keyword-input')}" placeholder="${placeholders.searchPlaceholder || 'Search'}"
             aria-label="${placeholders.searchPlaceholder || 'Search'}" />
      <span class="icon icon-clear ${c('keyword-clear')}" role="button" tabindex="0"
            aria-label="${placeholders.clearSearchLabel || 'Clear search'}"></span>`;
    decorateIcons(keywordEl);
    input = keywordEl.querySelector('input');
    const clearIcon = keywordEl.querySelector(`.${c('keyword-clear')}`);
    const submit = () => store.setKeyword(input.value);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    input.addEventListener('input', () => {
      clearIcon?.classList.toggle('is-visible', Boolean(input.value));
      if (!input.value) submit(); // refresh when emptied
    });
    keywordEl.querySelector('.icon-search-gray')?.addEventListener('click', submit);
    const clearKeyword = () => {
      input.value = '';
      clearIcon?.classList.remove('is-visible');
      submit();
      input.focus();
    };
    clearIcon?.addEventListener('click', clearKeyword);
    clearIcon?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        clearKeyword();
      }
    });
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
      const id = `${prefix}-${groupId}-${i}-${String(item.value).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
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
    const { filters, keyword, tags } = store.get();
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
    const hasAny = Boolean(tags.length || keyword);
    clearBtn.classList.toggle('is-active', hasAny);
    clearBtn.disabled = !hasAny;
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

  clearBtn.addEventListener('click', () => store.clear());
  store.subscribe(refresh);

  return {
    filtersEl,
    keywordEl,
    activeEl,
    countEl,
    setResultCount,
    store,
    /** Run fn after every UI refresh (used for the mobile toggle's active-filter count). */
    onRefresh(fn) {
      refreshListeners.add(fn);
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
  };
}

/* ------------------------------------------------------------------ */
/* Sidebar layout: filters left, keyword + active tags + results right */
/* ------------------------------------------------------------------ */
export function createSidebarLayout({
  ui,
  prefix = 'sf',
  placeholders = {},
  collapsibleOnMobile = true,
  cardColumns = true, // false: don't apply the 3-per-row card grid (blocks with their own results layout)
}) {
  const layout = createTag('div', {
    class: `${prefix}-layout${cardColumns ? ` ${prefix}-layout-cards` : ''}`,
  });
  const aside = createTag('aside', { class: `${prefix}-filters-column` });
  const panelId = `${prefix}-filters-panel-${crypto.randomUUID()}`;
  const panel = createTag('div', { class: `${prefix}-filters-panel`, id: panelId });
  panel.append(ui.filtersEl);

  if (collapsibleOnMobile) {
    // On narrow screens the panel is collapsed behind this button (CSS hides the button on desktop).
    const toggle = createTag('button', {
      class: `${prefix}-mobile-filter-toggle`,
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': panelId,
    });
    toggle.innerHTML = `
      <span class="icon icon-atomic-search-filter"></span>
      <span class="${prefix}-mobile-filter-toggle-label">${placeholders.filtersLabel || 'Filters'}</span>
      <span class="${prefix}-mobile-filter-toggle-count"></span>
      <span class="icon icon-chevron"></span>`;
    decorateIcons(toggle);
    const countBadge = toggle.querySelector(`.${prefix}-mobile-filter-toggle-count`);

    const setOpen = (open) => {
      layout.classList.toggle('is-filters-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!layout.classList.contains('is-filters-open')));
    layout.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Escape' || !layout.classList.contains('is-filters-open')) return;
        setOpen(false);
        toggle.focus();
      },
      true,
    );

    // show how many filters are active, so it's visible while the panel is collapsed
    ui.onRefresh(() => {
      const n = ui.store.get().tags.length;
      countBadge.textContent = n ? `(${n})` : '';
    });
    aside.append(toggle);
  }

  aside.append(panel);
  const results = createTag('section', { class: `${prefix}-results-column` });
  // toolbar: results count on the left, `controls` (sort, view switcher, ...) on the right
  const toolbar = createTag('div', { class: `${prefix}-toolbar` });
  const controls = createTag('div', { class: `${prefix}-toolbar-controls` });
  toolbar.append(ui.countEl, controls);
  results.append(...[ui.keywordEl, ui.activeEl, toolbar].filter(Boolean));
  layout.append(aside, results);
  return { layout, results, toolbar, controls };
}

/* ------------------------------------------------------------------ */
/* Sort                                                                */
/* ------------------------------------------------------------------ */

/** Standard client-side sort options. '' (the default) keeps the source order. */
export function getDefaultSortOptions(placeholders = {}) {
  return [
    { value: '', label: placeholders.sortDefaultLabel || 'Default' },
    { value: 'title-asc', label: placeholders.sortTitleAscLabel || 'Title (A-Z)' },
    { value: 'title-desc', label: placeholders.sortTitleDescLabel || 'Title (Z-A)' },
  ];
}

/** Returns a sorted copy for 'title-asc' / 'title-desc'; any other value keeps the source order. */
export function sortItems(items, sort, getTitle = (item) => item.title) {
  if (sort !== 'title-asc' && sort !== 'title-desc') return items;
  const direction = sort === 'title-asc' ? 1 : -1;
  const locale = document.documentElement.lang || 'en';
  return [...items].sort(
    (a, b) =>
      direction * String(getTitle(a) || '').localeCompare(String(getTitle(b) || ''), locale, { sensitivity: 'base' }),
  );
}

/**
 * "Sort: <current> v" dropdown. Options are [{ value, label }].
 * onChange(value) fires only on a user selection.
 */
export function createSortControl({ prefix = 'sf', label = 'Sort:', onChange = () => {} } = {}) {
  const c = (name) => `${prefix}-${name}`;
  let options = [];
  let selected = '';
  let abortOpen = null;

  const el = createTag('div', { class: c('sort') });
  const btn = createTag('button', {
    class: c('sort-btn'),
    type: 'button',
    'aria-haspopup': 'true',
    'aria-expanded': 'false',
  });
  btn.innerHTML = `
    <span class="${c('sort-btn-prefix')}">${label}</span>
    <span class="${c('sort-btn-value')}"></span>
    <span class="icon icon-chevron ${c('sort-chevron')}" aria-hidden="true"></span>`;
  const menu = createTag('div', { class: c('sort-menu'), hidden: '' });
  el.append(btn, menu);
  decorateIcons(btn);
  const valueEl = btn.querySelector(`.${c('sort-btn-value')}`);

  const close = () => {
    abortOpen?.abort();
    abortOpen = null;
    menu.hidden = true;
    menu.classList.remove('show'); // stylesheets show the menu via .show
    btn.setAttribute('aria-expanded', 'false');
  };

  const open = () => {
    menu.hidden = false;
    menu.classList.add('show');
    btn.setAttribute('aria-expanded', 'true');
    abortOpen = new AbortController();
    const { signal } = abortOpen;
    document.addEventListener(
      'click',
      (e) => {
        if (!el.contains(e.target)) close();
      },
      { signal },
    );
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Escape') return;
        close();
        btn.focus();
      },
      { signal },
    );
  };

  btn.addEventListener('click', () => (menu.hidden ? open() : close()));

  const render = () => {
    menu.replaceChildren(
      ...options.map((option) => {
        const item = createTag('button', { class: c('sort-option'), type: 'button', 'data-value': option.value });
        item.textContent = option.label;
        if (option.value === selected) item.setAttribute('aria-current', 'true');
        item.addEventListener('click', () => {
          const changed = option.value !== selected;
          selected = option.value;
          render();
          close();
          btn.focus();
          if (changed) onChange(option.value);
        });
        return item;
      }),
    );
    valueEl.textContent = options.find((option) => option.value === selected)?.label ?? '';
  };

  return {
    el,
    setOptions(nextOptions, nextSelected) {
      options = nextOptions;
      if (nextSelected !== undefined) selected = nextSelected;
      render();
    },
    /** Programmatic selection (URL restore, clear); does not call onChange. */
    setSelected(value) {
      if (value === selected) return;
      selected = value;
      render();
    },
    setHidden(hidden) {
      el.hidden = hidden;
      if (hidden) close();
    },
    get value() {
      return selected;
    },
  };
}

/** Sort control bound to store.sort (client-side sorting blocks: courses, playlists). */
export function createStoreSort({ store, ui, options, label }) {
  const sort = createSortControl({ label, onChange: (value) => store.setSort(value) });
  sort.setOptions(options, store.get().sort);
  ui.onRefresh(() => sort.setSelected(store.get().sort)); // URL restore / Clear filters
  return sort;
}
