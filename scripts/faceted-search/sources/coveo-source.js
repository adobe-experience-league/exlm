import { matchesSearchIntent } from '../state/store.js';

export { matchesSearchIntent };

export function reconcileFacetSelection(controller, wanted = []) {
  const want = new Set(wanted);
  const { values } = controller.state;
  values.forEach((value) => {
    if ((value.state === 'selected') !== want.has(value.value)) controller.toggleSelect(value);
  });
  const known = new Set(values.map((value) => value.value));
  wanted.forEach((value) => {
    if (!known.has(value)) controller.toggleSelect({ value, state: 'selected' });
  });
}

/**
 * Headless owns applied state and hash synchronization. Intent stays pending until
 * a new, matching response commits, so intermediate controller updates cannot undo a click.
 */
export default function createCoveoSource({ groups, initialSort = '', readSort = (value) => value, ...options }) {
  let headless;
  let sort;
  let pending = null;
  let applying = false;
  let destroyed = false;
  let lastSortKey = null;
  let selectedSort = initialSort;
  let lastNativeSort;
  let sortRestore = null;
  let restoreId = 0;
  let navigationId = 0;
  const ownedHashes = new Set();
  const listeners = new Set();
  const unsubscribers = [];

  function getSnapshot() {
    if (!headless) return { loading: true, ready: false, pending: true };
    const { search } = headless.engine.state;
    const nativeSort = sort?.controller.state.sortCriteria;
    if (nativeSort !== lastNativeSort) {
      selectedSort = readSort(nativeSort) ?? selectedSort;
      lastNativeSort = nativeSort;
    }
    const filters = Object.fromEntries(
      groups.map(({ id }) => [
        id,
        headless.facets[id].state.values.filter((value) => value.state === 'selected').map((value) => value.value),
      ]),
    );
    const state = {
      filters,
      keyword: String(search.queryExecuted || '').trim(),
      sort: selectedSort,
      page: headless.pager.state.currentPage,
    };
    const { isLoading: loading } = headless.status.state;
    const { error } = search;
    const { searchResponseId: responseId } = search;
    if (
      pending &&
      !applying &&
      !loading &&
      (error || (responseId && responseId !== pending.responseId && matchesSearchIntent(pending.state, state)))
    ) {
      pending = null;
    }
    return {
      state,
      pending: Boolean(pending || applying),
      loading,
      error,
      ready: headless.status.state.firstSearchExecuted && Boolean(responseId),
      responseId,
      sortKey: lastSortKey,
      sortRestore,
      navigationId,
      items: search.results,
      total: search.response?.totalCount ?? 0,
      page: headless.pager.state.currentPage,
      maxPage: headless.pager.state.maxPage,
      facets: Object.fromEntries(
        groups.map(({ id }) => [
          id,
          headless.facets[id].state.values.map((value) => ({
            value: value.value,
            title: value.value,
            count: value.numberOfResults,
            selected: value.state === 'selected',
          })),
        ]),
      ),
    };
  }

  const publish = () => {
    if (destroyed || applying) return;
    const snapshot = getSnapshot();
    listeners.forEach((listener) => listener(snapshot));
  };

  return {
    async init() {
      const { default: initialize, buildHeadlessSortController } = await import('../../coveo-headless/index.js');
      headless = await initialize({
        ...options,
        facetFields: groups.map(({ id }) => id),
        publishGlobals: false,
        skipGenericSortDropdown: true,
        onUrlRestore(fragment) {
          if (ownedHashes.has(window.location.hash)) return;
          // Capture before Headless synchronizes; later URL-manager writes can omit sortCriteria.
          navigationId += 1;
          restoreId += 1;
          pending = null;
          lastSortKey = null;
          const value = readSort(new URLSearchParams(fragment).get('sortCriteria'));
          sortRestore = { id: restoreId, value, fragment };
          if (value) selectedSort = value;
        },
      });
      if (destroyed) {
        headless.destroy();
        return;
      }
      groups.forEach(({ id }) => {
        if (!headless.facets[id]) throw new Error(`Unsupported Coveo facet: ${id}`);
      });
      sort = await buildHeadlessSortController(headless.engine);
      if (destroyed) {
        headless.destroy();
        return;
      }
      lastNativeSort = sort.controller.state.sortCriteria;
      unsubscribers.push(headless.engine.subscribe(publish));
      const onHashChange = (event) => {
        const hash = event.newURL ? new URL(event.newURL).hash : window.location.hash;
        if (ownedHashes.has(hash)) {
          ownedHashes.delete(hash);
          return;
        }
        pending = null;
        lastSortKey = null;
        publish();
      };
      window.addEventListener('hashchange', onHashChange);
      unsubscribers.push(() => window.removeEventListener('hashchange', onHashChange));
      headless.executeSearch();
      publish();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot,
    apply(state, action, sortSelection) {
      if (action !== 'sort' || !sortSelection) sortRestore = null;
      pending = { state, responseId: headless.engine.state.search.searchResponseId };
      applying = true;
      try {
        if (action === 'clear') {
          headless.resetSearchHandler();
        } else if (action === 'page') {
          headless.pager.selectPage(state.page);
        } else {
          groups.forEach(({ id }) => reconcileFacetSelection(headless.facets[id], state.filters[id]));
          headless.searchBox.updateText(state.keyword);
          headless.pager.selectPage(1);
        }
        const sortKey = sortSelection?.key;
        if (sortSelection && (sortKey !== lastSortKey || action === 'sort' || action === 'clear')) {
          lastSortKey = sortKey;
          sort.controller.sortBy(sortSelection.criterion(sort.criteria));
        }
        selectedSort = state.sort;
        lastNativeSort = sort.controller.state.sortCriteria;
        if (action === 'keyword') {
          const previousHash = window.location.hash;
          headless.submitSearchHandler();
          if (window.location.hash !== previousHash) ownedHashes.add(window.location.hash);
          else headless.executeSearch();
        } else headless.executeSearch();
      } finally {
        applying = false;
        publish();
      }
    },
    destroy() {
      destroyed = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      listeners.clear();
      ownedHashes.clear();
      headless?.destroy();
    },
  };
}
