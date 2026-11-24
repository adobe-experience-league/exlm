import { matchesSearchIntent } from '../state/store.js';

export { matchesSearchIntent };

export function reconcileFacetSelection(controller, wanted = [], toggle = (value) => controller.toggleSelect(value)) {
  const want = new Set(wanted);
  const { values } = controller.state;
  values.forEach((value) => {
    if ((value.state === 'selected') !== want.has(value.value)) toggle(value);
  });
  const known = new Set(values.map((value) => value.value));
  wanted.forEach((value) => {
    if (!known.has(value)) toggle({ value, state: 'idle', numberOfResults: 0 });
  });
}

/**
 * Headless owns applied state and hash synchronization. Intent stays pending until
 * a new, matching response commits, so intermediate controller updates cannot undo a click.
 */
export default function createCoveoSource({
  groups,
  initialSort = '',
  sortPolicy,
  readSort = (value) => value,
  ...options
}) {
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
      (error ||
        (responseId &&
          responseId !== pending.responseId &&
          (pending.navigation || matchesSearchIntent(pending.state, state))))
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

  function resolveRestoredSort() {
    if (!sortPolicy) return null;
    const snapshot = getSnapshot();
    return sortPolicy.resolve(
      { ...snapshot.state, keyword: headless.searchBox.state.value.trim() },
      'response',
      snapshot,
    );
  }

  return {
    async init() {
      const { default: initialize, buildHeadlessSortController } = await import('../../coveo-headless/index.js');
      headless = await initialize({
        ...options,
        facetFields: groups.map(({ id }) => id),
        publishGlobals: false,
        skipGenericSortDropdown: true,
        deferInitialSearch: true,
        onUrlRestore(fragment) {
          // Capture before Headless synchronizes; later URL-manager writes can omit sortCriteria.
          applying = Boolean(headless);
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
      const initialSelection = resolveRestoredSort();
      if (initialSelection && !initialSelection.deferred) {
        lastSortKey = initialSelection.key;
        selectedSort = initialSelection.value;
        headless.batchStateUpdates(() => headless.stateController.setSort(initialSelection.criterion(sort.criteria)));
        lastNativeSort = sort.controller.state.sortCriteria;
      }
      unsubscribers.push(headless.engine.subscribe(publish));
      const onHashChange = () => {
        lastSortKey = null;
        pending = {
          navigation: true,
          responseId: headless.engine.state.search.searchResponseId,
        };
        applying = false;
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
    synchronizeSort(selection) {
      if (!sort.controller.isSortedBy(selection.criterion(sort.criteria))) return false;
      lastSortKey = selection.key;
      selectedSort = selection.value;
      return true;
    },
    apply(state, action, sortSelection) {
      if (action !== 'sort' || !sortSelection) sortRestore = null;
      pending = { state, responseId: headless.engine.state.search.searchResponseId };
      applying = true;
      try {
        headless.batchStateUpdates(() => {
          if (action !== 'page') {
            groups.forEach(({ id }) =>
              reconcileFacetSelection(headless.facets[id], state.filters[id], (value) =>
                headless.stateController.toggleFacetValue(headless.facets[id], value),
              ),
            );
            headless.stateController.setQuery(state.keyword);
          }
          headless.stateController.setPage(state.page);
          const sortKey = sortSelection?.key;
          if (sortSelection && (sortKey !== lastSortKey || action === 'sort' || action === 'clear')) {
            lastSortKey = sortKey;
            headless.stateController.setSort(sortSelection.criterion(sort.criteria));
          }
          selectedSort = state.sort;
          lastNativeSort = sort.controller.state.sortCriteria;
          headless.executeSearch();
        });
      } finally {
        applying = false;
        publish();
      }
    },
    destroy() {
      destroyed = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      listeners.clear();
      headless?.destroy();
    },
  };
}
