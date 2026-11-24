import { createTag, htmlToElement } from '../../scripts.js';
import { decorateIcons } from '../../lib-franklin.js';

// Headless can publish several intermediate states before URL-restored facets catch up.
const URL_RESTORE_GRACE_PASSES = 20;

export function readEventSort(criterion) {
  if (criterion === '@el_view_count descending') return 'popularity';
  if (criterion === 'date descending' || criterion === '@el_event_start_time ascending') return 'date';
  if (criterion === 'relevancy') return 'relevance';
  return null;
}

export function getEventSortContext({ filters, keyword }, contentTypes) {
  const upcoming = contentTypes.UPCOMING_EVENT_V2.MAPPING_KEY;
  const onDemand = contentTypes.ON_DEMAND_EVENT.MAPPING_KEY;
  const types = filters.el_contenttype || [];
  const upcomingOnly = types.includes(upcoming) && !types.includes(onDemand);
  const onDemandOnly = types.includes(onDemand) && !types.includes(upcoming);
  return { upcomingOnly, onDemandOnly, mixed: !upcomingOnly && !onDemandOnly, hasQuery: Boolean(keyword) };
}

export function shouldGroupEvents(state, contentTypes) {
  const { mixed, hasQuery } = getEventSortContext(state, contentTypes);
  return mixed && (!hasQuery || state.sort === 'date');
}

export function groupUpcomingThenOnDemand(cards, contentTypes) {
  const upcomingType = contentTypes.UPCOMING_EVENT_V2.MAPPING_KEY.toLowerCase();
  const isUpcoming = (card) => card.contentType?.toLowerCase() === upcomingType;
  const eventDate = (card) => new Date(card.event?.date ?? NaN);
  const upcoming = cards.filter(isUpcoming).sort((a, b) => eventDate(a) - eventDate(b));
  const onDemand = cards.filter((card) => !isUpcoming(card)).sort((a, b) => eventDate(b) - eventDate(a));
  return [...upcoming, ...onDemand];
}

export function createEventSortPolicy(placeholders, contentTypes, hash = window.location.hash) {
  const criterion = new URLSearchParams(hash.slice(1)).get('sortCriteria');
  const initial = readEventSort(criterion) || 'relevance';
  let restore = criterion && readEventSort(criterion) ? { value: initial, fragment: hash.slice(1) } : null;
  let lastRestoreId;
  let graceRemaining = URL_RESTORE_GRACE_PASSES;
  const labels = {
    relevance: placeholders.filterSortRelevanceLabel || 'Relevance',
    date: placeholders.eventSearchFilterSortDateLabel || 'Date',
    popularity: placeholders.filterSortPopularityLabel || 'Popularity',
  };
  return {
    initial,
    default: 'relevance',
    resolve(state, action, snapshot) {
      if (snapshot?.sortRestore && snapshot.sortRestore.id !== lastRestoreId) {
        lastRestoreId = snapshot.sortRestore.id;
        restore = snapshot.sortRestore.value ? snapshot.sortRestore : null;
        graceRemaining = URL_RESTORE_GRACE_PASSES;
      }
      if (action !== 'response') restore = null;
      const { hasQuery, upcomingOnly, onDemandOnly, mixed } = getEventSortContext(state, contentTypes);
      const options = [];
      if (hasQuery || !mixed) {
        if (hasQuery) options.push('relevance');
        options.push('date');
        if (onDemandOnly) options.push('popularity');
      }
      let value = state.sort;
      let deferred = false;
      if (restore) {
        const expectedTypes = (new URLSearchParams(restore.fragment).get('f-el_contenttype') || '')
          .split(',')
          .filter(Boolean);
        const selectedTypes = state.filters.el_contenttype || [];
        const facetsReady =
          expectedTypes.length === selectedTypes.length && expectedTypes.every((type) => selectedTypes.includes(type));
        if (facetsReady && options.includes(restore.value)) {
          value = restore.value;
          restore = null;
        } else if (graceRemaining > 0) {
          graceRemaining -= 1;
          value = restore.value;
          deferred = true;
        } else {
          restore = null;
        }
      }
      if (!deferred) {
        if (!options.length) value = 'relevance';
        else if (action === 'keyword' && hasQuery) value = 'relevance';
        else if (!options.includes(value)) value = options.includes('date') ? 'date' : options[0];
      }
      return {
        value,
        deferred,
        options: options.map((option) => ({ value: option, label: labels[option] })),
        key: `${value}:${upcomingOnly}:${onDemandOnly}`,
        criterion(criteria) {
          if (value === 'popularity') return criteria.field('el_view_count', 'descending');
          if (value === 'date' && upcomingOnly) return criteria.field('el_event_start_time', 'ascending');
          if (value === 'date' && onDemandOnly) return criteria.date('descending');
          return criteria.relevance();
        },
      };
    },
  };
}

export function readPerspectiveSort(criterion) {
  if (criterion === '@el_view_count descending') return 'popularity';
  if (criterion === 'date descending') return 'newest';
  if (criterion === 'date ascending') return 'oldest';
  if (criterion === 'relevancy') return 'relevance';
  return null;
}

export function createPerspectiveSortPolicy(placeholders) {
  const labels = {
    relevance: placeholders.filterSortRelevanceLabel || 'Relevance',
    popularity: placeholders.filterSortPopularityLabel || 'Popularity',
    newest: placeholders.filterSortNewestLabel || 'Newest',
    oldest: placeholders.filterSortOldestLabel || 'Oldest',
  };
  const order = ['relevance', 'popularity', 'newest', 'oldest'];
  const options = order.map((value) => ({ value, label: labels[value] }));
  const initial = 'newest';
  return {
    initial,
    default: initial,
    resolve(state) {
      const value = order.includes(state.sort) ? state.sort : initial;
      return {
        value,
        options,
        key: value,
        criterion(criteria) {
          if (value === 'popularity') return criteria.field('el_view_count', 'descending');
          if (value === 'newest') return criteria.date('descending');
          if (value === 'oldest') return criteria.date('ascending');
          return criteria.relevance();
        },
      };
    },
  };
}

export function readCourseSort(criterion) {
  if (criterion === '@el_view_count descending') return 'popularity';
  if (criterion === 'relevancy') return 'relevance';
  return null;
}

export function createCourseSortPolicy(placeholders) {
  const options = [
    { value: 'relevance', label: placeholders.filterSortRelevanceLabel || 'Relevance' },
    { value: 'popularity', label: placeholders.filterSortPopularityLabel || 'Popularity' },
  ];
  return {
    initial: 'relevance',
    default: 'relevance',
    resolve(state) {
      const value = options.some((option) => option.value === state.sort) ? state.sort : 'relevance';
      return {
        value,
        options,
        key: value,
        criterion(criteria) {
          return value === 'popularity' ? criteria.field('el_view_count', 'descending') : criteria.relevance();
        },
      };
    },
  };
}

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
export function createSortControl({ label = 'Sort:', onChange = () => {} } = {}) {
  const c = (name) => `fs-${name}`;
  let options = [];
  let selected = '';
  let abortOpen = null;

  const el = htmlToElement(`
    <div class="fs-sort">
      <button class="fs-sort-btn" type="button" aria-haspopup="true" aria-expanded="false">
        <span class="fs-sort-btn-prefix"></span>
        <span class="fs-sort-btn-value"></span>
        <span class="icon icon-chevron fs-sort-chevron" aria-hidden="true"></span>
      </button>
      <div class="fs-sort-menu" hidden></div>
    </div>`);
  const btn = el.querySelector('.fs-sort-btn');
  const menu = el.querySelector('.fs-sort-menu');
  btn.querySelector('.fs-sort-btn-prefix').textContent = label;
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
