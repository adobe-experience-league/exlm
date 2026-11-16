import { createTag } from '../scripts.js';
import { createFilterStore, matchesSearchIntent } from './store.js';
import createFacetedSearchUI from './components/facets.js';
import createSidebarLayout from './components/layout.js';
import { createSortControl } from './components/sort-control.js';
import createPagination from './components/pagination.js';
import createResults from './components/results.js';
import createRenderCoordinator from './render-coordinator.js';

const instances = new WeakMap();

export default async function createFacetedSearch(block, config) {
  instances.get(block)?.destroy();
  const {
    groups,
    labels = {},
    prefix = 'fs',
    resultsPrefix = prefix,
    sort: sortPolicy,
    pagination: paginationConfig,
    analytics,
  } = config;
  const initialSort = sortPolicy?.initial ?? '';
  const store = createFilterStore({
    groupIds: groups.map(({ id }) => id),
    defaultSort: sortPolicy?.default ?? '',
    initial: { sort: initialSort },
  });
  const source = config.createSource({ groups, initialSort, pageSize: paginationConfig?.pageSize });
  const ui = createFacetedSearchUI({
    store,
    groups,
    placeholders: labels,
    prefix,
    withKeyword: config.search !== false,
  });
  const shell = createSidebarLayout({ ui, prefix, cardColumns: config.cardColumns ?? true });
  const results = createResults({
    prefix: resultsPrefix,
    labels,
    classes: config.resultClasses,
    createLoading: config.createLoading,
    onClear: () => store.clear(),
  });
  let destroyed = false;
  let view;
  let lastRenderKey;
  let lastAnalyticsResponseId;
  let intent = null;
  let navigationId;
  let hasCompletedSearch = false;
  let wasLoading = false;
  let restoreRetry;
  const itemKeys = new Map();
  const cleanups = [];
  const sort = sortPolicy
    ? createSortControl({ prefix, label: labels.sort || 'Sort:', onChange: (value) => store.setSort(value) })
    : null;
  const pagination = paginationConfig
    ? createPagination({
        prefix: resultsPrefix,
        labels: paginationConfig.labels,
        onChange: (page) => store.setPage(page),
      })
    : null;
  const reportError = (error) => {
    if (destroyed) return;
    // eslint-disable-next-line no-console
    console.error('faceted-search: search failed', error);
    ui.setLoading(false);
    results.showError();
    if (pagination) pagination.el.style.display = 'none';
  };
  sort?.setHidden(true);
  if (sort) shell.controls.append(sort.el);
  if (pagination) results.body.append(pagination.el);
  shell.results.append(results.body);
  block.replaceChildren(shell.layout);

  function updateSort(state, action, snapshot) {
    if (!sortPolicy) return null;
    const selection = sortPolicy.resolve(state, action, snapshot);
    store.setSort(selection.value, { silent: true });
    sort.setOptions(selection.options, selection.value);
    sort.setHidden(!selection.options.length);
    return selection;
  }

  function track(handler, event) {
    if (!handler) return;
    Promise.resolve()
      .then(() => handler(event))
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('faceted-search: analytics failed', error);
      });
  }

  const coordinator = createRenderCoordinator({
    async prepare({ snapshot, state }) {
      const items = config.prepareItems ? await config.prepareItems(snapshot.items, state, snapshot) : snapshot.items;
      const fragment = document.createDocumentFragment();
      await Promise.all(
        items.map(async (item, index) => {
          const wrapper = createTag('div', { class: `${resultsPrefix}-card-item` });
          fragment.append(wrapper);
          await config.renderItem(wrapper, item, index);
        }),
      );
      return fragment;
    },
    commit(fragment, { snapshot, state }) {
      if (!snapshot.items.length) {
        results.grid.replaceChildren();
        if (config.resultClasses?.grid) results.grid.classList.remove(...config.resultClasses.grid.split(' '));
        results.showEmpty(state.keyword);
      } else {
        results.showItems(fragment);
        view?.afterRender?.();
      }
      results.grid.dataset.searchresponseid = snapshot.responseId;
    },
    onError: reportError,
  });

  function receive(snapshot) {
    clearTimeout(restoreRetry);
    if (destroyed) return;
    if (snapshot.navigationId !== undefined && snapshot.navigationId !== navigationId) {
      navigationId = snapshot.navigationId;
      intent = null;
    }
    if (snapshot.error) {
      coordinator.invalidate();
      reportError(snapshot.error);
      return;
    }
    const loading = snapshot.loading || snapshot.pending || !snapshot.ready;
    ui.setLoading(loading);
    results.setLoading(loading);
    if (pagination) pagination.el.style.display = loading ? 'none' : '';
    if (loading) {
      coordinator.invalidate();
      lastRenderKey = null;
      if (!wasLoading && hasCompletedSearch) config.scrollToResults?.(shell.results);
      wasLoading = true;
      return;
    }
    wasLoading = false;
    hasCompletedSearch = true;
    groups.forEach(({ id }) => store.setGroup(id, snapshot.state.filters[id] || [], { silent: true }));
    store.setKeyword(snapshot.state.keyword, { silent: true });
    store.setSort(snapshot.state.sort ?? store.get().sort, { silent: true });
    store.setPage(snapshot.page || 1, { silent: true });
    const selection = updateSort(store.get(), 'response', snapshot);
    const state = store.get();
    if (selection?.deferred) {
      // A restoring policy must not dispatch against an intermediate backend state.
      ui.refresh();
      ui.setLoading(true);
      results.setLoading(true);
      if (pagination) pagination.el.style.display = 'none';
      restoreRetry = setTimeout(() => {
        try {
          receive(source.getSnapshot());
        } catch (error) {
          reportError(error);
        }
      }, 50);
      return;
    }
    if (selection && (selection.value !== snapshot.state.sort || selection.key !== snapshot.sortKey)) {
      source.apply(state, 'sort', selection);
      return;
    }
    block.classList.toggle('has-no-results', !snapshot.total);
    groups.forEach((group) => {
      const items = config.getFacetItems
        ? config.getFacetItems(group, snapshot.facets[group.id] || [], state)
        : snapshot.facets[group.id] || [];
      const key = JSON.stringify(items);
      if (itemKeys.get(group.id) !== key) {
        itemKeys.set(group.id, key);
        ui.setGroupItems(group.id, items);
      }
    });
    ui.refresh();
    ui.setResultCount(snapshot.total, labels.resultsSuffix);
    pagination?.update(snapshot.page || 1, snapshot.maxPage || 1);
    results.grid.classList.toggle(`${resultsPrefix}-one-pg-result`, (snapshot.maxPage || 1) <= 1);
    if (
      intent &&
      snapshot.responseId &&
      snapshot.responseId !== intent.responseId &&
      snapshot.responseId !== lastAnalyticsResponseId &&
      matchesSearchIntent({ keyword: intent.state.keyword, filters: intent.state.filters }, snapshot.state)
    ) {
      const committedIntent = intent;
      intent = null;
      lastAnalyticsResponseId = snapshot.responseId;
      track(analytics?.onCommit, {
        ...committedIntent,
        state: { ...committedIntent.state, sort: state.sort },
        snapshot,
      });
    }
    const renderKey = `${snapshot.responseId}:${state.sort}`;
    if (renderKey !== lastRenderKey) {
      lastRenderKey = renderKey;
      coordinator.render({ snapshot, state });
    }
  }

  cleanups.push(
    store.subscribe((state, action) => {
      try {
        const selection = updateSort(state, action);
        const next = store.get();
        if (action === 'filter' || (action === 'keyword' && next.keyword)) {
          intent = { action, state: next, responseId: source.getSnapshot().responseId };
        } else if (action === 'clear' || action === 'keyword') intent = null;
        if (action === 'clear') track(analytics?.onClear);
        source.apply(next, action, selection);
      } catch (error) {
        reportError(error);
      }
    }),
    source.subscribe((snapshot) => {
      try {
        receive(snapshot);
      } catch (error) {
        reportError(error);
      }
    }),
  );

  let observer;
  const instance = {
    store,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearTimeout(restoreRetry);
      observer?.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      coordinator.destroy();
      source.destroy();
      ui.destroy();
      sort?.destroy();
      pagination?.destroy();
      results.destroy();
      view?.destroy?.();
      instances.delete(block);
    },
  };
  observer = new MutationObserver(() => {
    if (!block.isConnected) instance.destroy();
  });
  instances.set(block, instance);
  observer.observe(document.body, { childList: true, subtree: true });
  try {
    groups.forEach(({ id, items }) => {
      if (items) ui.setGroupItems(id, items);
    });
    ui.refresh();
    results.setLoading(true);
    if (config.createView) {
      view = await config.createView({ block, body: results.body, controls: shell.controls, grid: results.grid });
      if (destroyed) {
        view?.destroy?.();
        return instance;
      }
    }
    await source.init();
  } catch (error) {
    reportError(error);
    instance.destroy();
    throw error;
  }
  return instance;
}
