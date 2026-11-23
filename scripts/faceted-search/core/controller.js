import { createFilterStore, matchesSearchIntent } from '../state/store.js';
import createFacetedSearchUI from '../components/filters.js';
import createSidebarLayout from '../components/layout.js';
import { createSortControl } from '../components/sort-control.js';
import createPagination from '../components/pagination.js';
import { createResults, renderCards } from '../components/cards.js';
import createRenderCoordinator from './render-coordinator.js';
import createCoveoSource from '../sources/coveo-source.js';

const instances = new WeakMap();

/**
 * `source.type` selects Coveo (default) or a collection; `createSource` can supply another backend.
 * `cards` enables shared browse-card rendering, event normalization and optional view switching.
 */
export default async function createFacetedSearch(block, config) {
  instances.get(block)?.destroy();
  const cards = config.cards ? await import('../components/cards.js') : null;
  const {
    groups,
    labels = {},
    resultsPrefix = 'fs',
    sort: sortPolicy,
    pagination: paginationConfig,
    analytics,
  } = config;
  const initialSort = sortPolicy?.initial ?? '';
  const pageSize = config.pageSize ?? paginationConfig?.pageSize;
  const store = createFilterStore({
    groupIds: groups.map(({ id }) => id),
    defaultSort: sortPolicy?.default ?? '',
    initial: { sort: initialSort },
  });
  const { type: sourceType = 'coveo', ...sourceOptions } = config.source || {};
  const sourceContext = { groups, initialSort, pageSize };
  let source;
  if (config.createSource) source = config.createSource(sourceContext);
  else if (sourceType === 'collection') {
    const { default: createCollectionSource } = await import('../sources/collection-source.js');
    source = createCollectionSource({ ...sourceOptions, ...sourceContext });
  } else if (sourceType === 'coveo') {
    source = createCoveoSource({ ...sourceOptions, groups, initialSort, sortPolicy, numberOfResults: pageSize });
  } else throw new Error(`Unsupported search source: ${sourceType}`);
  const resultClasses =
    config.resultClasses || (cards ? { body: 'browse-cards-block', grid: 'browse-cards-block-content' } : {});
  const ui = createFacetedSearchUI({
    store,
    groups,
    placeholders: labels,
    withKeyword: config.search !== false,
  });
  const shell = createSidebarLayout({
    ui,
    heading: config.heading,
    headingType: config.headingType,
    cardColumns: config.cardColumns ?? true,
    withFilters: config.filters !== false,
  });
  const results = createResults({
    resultsPrefix,
    labels,
    classes: resultClasses,
    createLoading: config.createLoading || (cards ? () => cards.createCardLoading(pageSize) : undefined),
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
    ? createSortControl({ label: labels.sort || 'Sort:', onChange: (value) => store.setSort(value) })
    : null;
  const pagination = paginationConfig
    ? createPagination({
        resultsPrefix,
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
    async prepare({ snapshot, state, signal }) {
      let { items } = snapshot;
      const context = { block, snapshot, state, signal };
      if (config.prepareItems) items = await config.prepareItems(items, state, snapshot, { signal });
      else if (cards) items = await cards.prepareCardItems(items, state, config.cards, snapshot);
      return { fragment: await renderCards(items, resultsPrefix, config.renderItem, context), items };
    },
    async commit({ fragment, items }, { snapshot, state, signal }) {
      if (!items.length) {
        results.grid.replaceChildren();
        if (resultClasses.grid) results.grid.classList.remove(...resultClasses.grid.split(' '));
        results.showEmpty(state.keyword);
      } else {
        results.showItems(fragment);
      }
      view?.afterRender?.({ snapshot });
      results.grid.dataset.searchresponseid = snapshot.responseId;
      await config.afterRender?.({
        block,
        body: results.body,
        grid: results.grid,
        items,
        state,
        snapshot,
        signal,
        store,
      });
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
      if (!wasLoading && hasCompletedSearch) {
        if (typeof config.scrollToResults === 'function') config.scrollToResults(shell.results);
        else if (config.scrollToResults) {
          const { top } = shell.results.getBoundingClientRect();
          if (top < 0 || top > window.innerHeight) {
            shell.results.scrollIntoView({ behavior: 'auto', block: 'start' });
            window.scrollBy({ top: -12 });
          }
        }
      }
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
      if (!source.synchronizeSort?.(selection)) {
        source.apply(state, 'sort', selection);
        return;
      }
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
    if (cards) {
      await cards.loadCardStyles(config.cards).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('faceted-search: failed to load card styles', error);
      });
    }
    if (destroyed) return instance;
    if (config.createView || cards) {
      const viewOptions = {
        block,
        body: results.body,
        controls: shell.controls,
        grid: results.grid,
        store,
        results,
        ui,
        labels,
        resultsPrefix,
        ...config.cards,
      };
      view = config.createView ? await config.createView(viewOptions) : await cards.createCardView(viewOptions);
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
