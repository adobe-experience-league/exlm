import { sortItems } from '../components/sort-control.js';
import { readSearchStateFromUrl, writeSearchStateToUrl } from '../state/url-state.js';

function valuesOf(value) {
  return [
    ...new Set(
      [value]
        .flat()
        .flatMap((item) => String(item ?? '').split(','))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * Adapts a JSON collection or enriched models to the same snapshot contract as Coveo.
 * loadItems({state, signal}) returns the full collection, before local filtering and pagination.
 * getLoadKey(state) can request a new collection when server-side filters change.
 */
export default function createCollectionSource({
  groups,
  initialSort = '',
  pageSize = Infinity,
  loadItems,
  getLoadKey = () => '',
  getValues = (item, groupId) => item[groupId],
  getSearchText = (item) => `${item.title || ''} ${item.description || ''}`,
  sort = sortItems,
  url,
}) {
  if (typeof loadItems !== 'function') throw new Error('Collection search requires loadItems');
  if (pageSize !== Infinity && (!Number.isInteger(pageSize) || pageSize < 1)) {
    throw new Error('Collection page size must be a positive integer');
  }
  const groupIds = groups.map(({ id }) => id);
  const emptyState = () => ({
    filters: Object.fromEntries(groupIds.map((id) => [id, []])),
    keyword: '',
    sort: initialSort,
    page: 1,
  });
  const readState = () => {
    if (!url) return emptyState();
    const restored = readSearchStateFromUrl(groupIds, url);
    return { ...restored, sort: restored.sort || initialSort };
  };
  let state = readState();
  let snapshot = { loading: true, ready: false, state };
  let cachedItems;
  let cacheKey;
  let sortKey;
  let navigationId = 0;
  let responseId = 0;
  let abort;
  let destroyed = false;
  const listeners = new Set();
  const publish = () => listeners.forEach((listener) => listener(snapshot));

  async function search(action) {
    if (destroyed) return;
    abort?.abort();
    abort = new AbortController();
    const { signal } = abort;
    const requestState = state;
    snapshot = { ...snapshot, state: requestState, loading: true, error: null };
    publish();
    try {
      const key = getLoadKey(requestState);
      let items = cachedItems;
      if (!items || key !== cacheKey) {
        items = await loadItems({ state: requestState, signal });
        if (signal.aborted || destroyed) return;
        if (!Array.isArray(items)) throw new Error('Collection loadItems must return an array');
        cachedItems = items;
        cacheKey = key;
      }
      const keyword = requestState.keyword.toLocaleLowerCase();
      const searched = keyword
        ? items.filter((item) => String(getSearchText(item)).toLocaleLowerCase().includes(keyword))
        : items;
      const matches = (item, except) =>
        groups.every(({ id }) => {
          const wanted = requestState.filters[id] || [];
          return (
            id === except || !wanted.length || wanted.some((value) => valuesOf(getValues(item, id)).includes(value))
          );
        });
      const facets = Object.fromEntries(
        groups.map(({ id, items: configuredItems }) => {
          const counts = new Map((configuredItems || []).map(({ value }) => [value, 0]));
          searched
            .filter((item) => matches(item, id))
            .forEach((item) => {
              valuesOf(getValues(item, id)).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
            });
          (requestState.filters[id] || []).forEach((value) => {
            if (!counts.has(value)) counts.set(value, 0);
          });
          return [
            id,
            [...counts].map(([value, count]) => ({
              value,
              title: configuredItems?.find((item) => item.value === value)?.title || value,
              count,
              selected: requestState.filters[id]?.includes(value) || false,
            })),
          ];
        }),
      );
      const filtered = sort(
        searched.filter((item) => matches(item)),
        requestState.sort,
      );
      if (!Array.isArray(filtered)) throw new Error('Collection sort must return an array');
      const total = filtered.length;
      const maxPage = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(total / pageSize));
      const page = Math.min(requestState.page, maxPage);
      state = { ...requestState, page };
      responseId += 1;
      snapshot = {
        state,
        loading: false,
        ready: true,
        responseId: String(responseId),
        sortKey,
        navigationId,
        items: pageSize === Infinity ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize),
        total,
        page,
        maxPage,
        facets,
      };
      if (url && action !== 'navigation' && action !== 'init') writeSearchStateToUrl(state, groupIds, url);
      publish();
    } catch (error) {
      if (signal.aborted || destroyed) return;
      snapshot = { ...snapshot, loading: false, error };
      publish();
    }
  }

  const onPopState = () => {
    navigationId += 1;
    state = readState();
    search('navigation');
  };
  return {
    async init() {
      if (url) window.addEventListener('popstate', onPopState);
      await search('init');
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    apply(next, action, selection) {
      if (!Number.isInteger(next.page) || next.page < 1) throw new Error('Search page must be a positive integer');
      state = { ...next };
      sortKey = selection?.key;
      return search(action);
    },
    destroy() {
      destroyed = true;
      abort?.abort();
      window.removeEventListener('popstate', onPopState);
      listeners.clear();
    },
  };
}
