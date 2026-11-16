/* eslint-env node */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createFilterStore, normalizePage } from './store.js';
import createRenderCoordinator from './render-coordinator.js';
import { matchesSearchIntent, reconcileFacetSelection } from './sources/coveo-source.js';

test('filter, query, sort and clear reset pagination, while silent backend synchronization does not', () => {
  const store = createFilterStore({ groupIds: ['product'], defaultSort: 'relevance' });
  const actions = [];
  store.subscribe((state, action) => actions.push([action, state.page]));
  store.setPage(3);
  store.toggle('product', 'Analytics', true);
  store.setPage(2);
  store.setKeyword('events');
  store.setPage(4);
  store.setSort('date');
  store.setPage(2);
  store.setGroup('product', ['Target'], { silent: true });
  assert.equal(store.get().page, 2);
  store.clear();
  assert.deepEqual(actions, [
    ['page', 3],
    ['filter', 1],
    ['page', 2],
    ['keyword', 1],
    ['page', 4],
    ['sort', 1],
    ['page', 2],
    ['clear', 1],
  ]);
  assert.deepEqual(store.get(), { keyword: '', sort: 'relevance', page: 1, tags: [], filters: { product: [] } });
});

test('intent snapshots remain immutable after subsequent store changes', () => {
  const store = createFilterStore({ groupIds: ['product'] });
  store.toggle('product', 'Analytics', true, 'Adobe Analytics');
  const intent = store.get();
  store.toggle('product', 'Target', true);
  store.setLabel('product', 'Analytics', 'Analytics');
  assert.deepEqual(intent.filters.product, ['Analytics']);
  assert.equal(intent.tags[0].label, 'Adobe Analytics');
});

test('page input clamps bounds and rejects fractions and non-numeric values', () => {
  assert.equal(normalizePage('12', 4), 4);
  assert.equal(normalizePage('-3', 4), 1);
  assert.equal(normalizePage('2', 4), 2);
  assert.equal(normalizePage('1.5', 4), null);
  assert.equal(normalizePage('invalid', 4), null);
  assert.equal(normalizePage('Infinity', 4), null);
});

test('matching responses require the requested query, all facets and page', () => {
  const intent = { keyword: 'event', filters: { product: ['A', 'B'] }, page: 2 };
  assert.equal(matchesSearchIntent(intent, { ...intent, filters: { product: ['B', 'A'] } }), true);
  assert.equal(matchesSearchIntent(intent, { ...intent, keyword: 'previous' }), false);
  assert.equal(matchesSearchIntent(intent, { ...intent, filters: { product: ['A'] } }), false);
  assert.equal(matchesSearchIntent(intent, { ...intent, page: 1 }), false);
});

test('facet reconciliation only toggles changed selections, including unknown restored values', () => {
  const toggled = [];
  const controller = {
    state: {
      values: [
        { value: 'A', state: 'selected' },
        { value: 'B', state: 'idle' },
      ],
    },
    toggleSelect: (value) => toggled.push(value.value),
  };
  reconcileFacetSelection(controller, ['A']);
  assert.deepEqual(toggled, []);
  reconcileFacetSelection(controller, ['B', 'C']);
  assert.deepEqual(toggled, ['A', 'B', 'C']);
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

test('a slow previous render cannot replace newer results', async () => {
  const slow = deferred();
  const commits = [];
  const coordinator = createRenderCoordinator({
    prepare: (input) => (input === 'old' ? slow.promise : Promise.resolve(input)),
    commit: (output) => commits.push(output),
    onError: assert.fail,
  });
  const oldRender = coordinator.render('old');
  await coordinator.render('new');
  slow.resolve('old');
  await oldRender;
  assert.deepEqual(commits, ['new']);
});

test('loading invalidation and teardown prevent in-flight rendering from committing', async () => {
  const slow = deferred();
  const commits = [];
  const coordinator = createRenderCoordinator({
    prepare: () => slow.promise,
    commit: (output) => commits.push(output),
    onError: assert.fail,
  });
  const render = coordinator.render('old');
  coordinator.invalidate();
  coordinator.destroy();
  slow.resolve('old');
  await render;
  assert.deepEqual(commits, []);
});

test('current render failures are reported explicitly', async () => {
  const failure = new Error('Card rendering failed');
  const errors = [];
  const coordinator = createRenderCoordinator({
    prepare: () => Promise.reject(failure),
    commit: assert.fail,
    onError: (error) => errors.push(error),
  });
  await coordinator.render('new');
  assert.deepEqual(errors, [failure]);
});

async function createSourceHarness() {
  const browser = new EventTarget();
  browser.location = { hash: '#f-product=A' };
  const context = vm.createContext({ window: browser, URL });
  const engineListeners = new Set();
  let submitted = 0;
  let disposed = 0;
  const headless = {
    engine: {
      state: { search: { queryExecuted: '', searchResponseId: 'initial', results: [], response: { totalCount: 1 } } },
      subscribe(listener) {
        engineListeners.add(listener);
        return () => engineListeners.delete(listener);
      },
    },
    status: { state: { isLoading: false, firstSearchExecuted: true } },
    facets: {
      product: {
        state: { values: [{ value: 'A', state: 'selected', numberOfResults: 1 }] },
        toggleSelect(value) {
          value.state = value.state === 'selected' ? 'idle' : 'selected';
        },
      },
    },
    pager: {
      state: { currentPage: 1, maxPage: 1 },
      selectPage(page) {
        this.state.currentPage = page;
      },
    },
    searchBox: {
      value: '',
      updateText(value) {
        this.value = value;
      },
    },
    executeSearch() {
      this.status.state.isLoading = true;
    },
    submitSearchHandler() {
      submitted += 1;
      browser.location.hash = `#q=${headless.searchBox.value}&f-product=A`;
      headless.executeSearch();
    },
    resetSearchHandler() {},
    destroy() {
      disposed += 1;
    },
  };
  const sort = {
    state: { sortCriteria: 'relevancy' },
    sortBy(criterion) {
      this.state.sortCriteria = criterion;
    },
  };
  const initialization = new vm.SyntheticModule(
    ['default', 'buildHeadlessSortController'],
    function initialize() {
      this.setExport('default', async () => headless);
      this.setExport('buildHeadlessSortController', async () => ({
        controller: sort,
        criteria: { relevance: () => 'relevancy' },
      }));
    },
    { context },
  );
  await initialization.link(() => assert.fail('Unexpected initializer dependency'));
  await initialization.evaluate();
  const sourceModule = new vm.SourceTextModule(
    await readFile(new URL('./sources/coveo-source.js', import.meta.url), 'utf8'),
    { context, importModuleDynamically: () => initialization },
  );
  await sourceModule.link(() => assert.fail('Unexpected source dependency'));
  await sourceModule.evaluate();
  const source = sourceModule.namespace.default({ groups: [{ id: 'product' }], initialSort: 'relevance' });
  await source.init();
  const commit = (responseId, keyword = '') => {
    Object.assign(headless.engine.state.search, { searchResponseId: responseId, queryExecuted: keyword });
    headless.status.state.isLoading = false;
    engineListeners.forEach((listener) => listener());
  };
  commit('initial');
  return { source, headless, browser, commit, submissions: () => submitted, disposals: () => disposed };
}

test('Coveo keyword submission preserves facets and ignores old response snapshots until intent commits', async () => {
  const { source, browser, commit, submissions } = await createSourceHarness();
  source.apply({ keyword: 'event', filters: { product: ['A'] }, sort: 'relevance', page: 1 }, 'keyword', {
    key: 'relevance',
    criterion: (criteria) => criteria.relevance(),
  });
  assert.equal(submissions(), 1);
  assert.equal(browser.location.hash, '#q=event&f-product=A');
  browser.dispatchEvent(new Event('hashchange'));
  commit('initial', 'event');
  assert.equal(source.getSnapshot().pending, true, 'same response ID cannot satisfy a new intent');
  commit('new', 'previous');
  assert.equal(source.getSnapshot().pending, true, 'a different query cannot satisfy the intent');
  commit('latest', 'event');
  assert.equal(source.getSnapshot().pending, false);
  source.destroy();
});

test('external URL navigation cancels pending intent and teardown unsubscribes the source', async () => {
  const { source, browser, commit, disposals } = await createSourceHarness();
  const snapshots = [];
  source.subscribe((snapshot) => snapshots.push(snapshot));
  source.apply({ keyword: 'event', filters: { product: ['A'] }, sort: 'relevance', page: 1 }, 'filter');
  browser.location.hash = '#q=other';
  browser.dispatchEvent(new Event('hashchange'));
  commit('navigation', 'other');
  assert.equal(source.getSnapshot().pending, false);
  source.destroy();
  const count = snapshots.length;
  commit('after-destroy', 'other');
  assert.equal(snapshots.length, count);
  assert.equal(disposals(), 1);
});

test('an empty initial engine slice is not a committed zero-results response', async () => {
  const { source, headless } = await createSourceHarness();
  headless.engine.state.search.searchResponseId = '';
  assert.equal(source.getSnapshot().ready, false);
  source.destroy();
});
