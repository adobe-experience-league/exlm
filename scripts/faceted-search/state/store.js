export function createFilterStore({ groupIds, initial = {}, defaultSort = '' }) {
  let tags = []; // ordered: [{ groupId, value, label }]
  let keyword = initial.keyword || '';
  let sort = initial.sort ?? defaultSort;
  let page = initial.page || 1;
  const listeners = new Set();

  groupIds.forEach((id) => {
    (initial[id] || []).forEach((value) => tags.push({ groupId: id, value, label: value }));
  });

  const get = () => ({
    keyword,
    sort,
    page,
    tags: tags.map((t) => ({ ...t })),
    filters: Object.fromEntries(groupIds.map((id) => [id, tags.filter((t) => t.groupId === id).map((t) => t.value)])),
  });
  // source: 'filter' | 'keyword' | 'clear'
  const emit = (source) => {
    if (source !== 'page') page = 1;
    listeners.forEach((fn) => fn(get(), source));
  };
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
    setPage(value, { silent = false } = {}) {
      if (!Number.isInteger(value) || value < 1) throw new Error('Search page must be a positive integer');
      if (value === page) return;
      page = value;
      if (!silent) emit('page');
    },
    clear({ silent = false } = {}) {
      tags = [];
      keyword = '';
      sort = defaultSort;
      page = 1;
      if (!silent) emit('clear');
    },
  };
}

export function normalizePage(value, maxPage) {
  const page = Number(value);
  if (!Number.isInteger(page)) return null;
  return Math.max(1, Math.min(page, Math.max(1, maxPage)));
}

export function matchesSearchIntent(intent, state) {
  return (
    intent.keyword === state.keyword &&
    (intent.page === undefined || intent.page === state.page) &&
    Object.entries(intent.filters).every(([id, wanted]) => {
      const selected = state.filters[id] || [];
      return wanted.length === selected.length && wanted.every((value) => selected.includes(value));
    })
  );
}
