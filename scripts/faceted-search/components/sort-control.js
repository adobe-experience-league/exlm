import { createTag } from '../../scripts.js';
import { decorateIcons } from '../../lib-franklin.js';

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

/** Static options for collection sources; server-specific policies may also provide a criterion. */
export function createCollectionSortPolicy({
  options = getDefaultSortOptions(),
  initial = options[0]?.value ?? '',
  defaultSort = initial,
} = {}) {
  if (![initial, defaultSort].every((value) => options.some((option) => option.value === value))) {
    throw new Error('Collection initial and default sorts must be present in options');
  }
  return {
    initial,
    default: defaultSort,
    resolve(state) {
      const value = options.some((option) => option.value === state.sort) ? state.sort : defaultSort;
      return { value, key: value, options };
    },
  };
}

/**
 * "Sort: <current> v" dropdown. Options are [{ value, label }].
 * onChange(value) fires only on a user selection.
 */
export function createSortControl({ prefix = 'fs', label = 'Sort:', onChange = () => {} } = {}) {
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
    destroy: close,
  };
}

/** Sort control bound to store.sort (client-side sorting blocks: courses, playlists). */
export function createStoreSort({ store, ui, options, label }) {
  const sort = createSortControl({ label, onChange: (value) => store.setSort(value) });
  sort.setOptions(options, store.get().sort);
  ui.onRefresh(() => sort.setSelected(store.get().sort)); // URL restore / Clear filters
  return sort;
}
