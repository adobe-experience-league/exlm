# Shared faceted search

`scripts/faceted-search/faceted-search.js` exposes `createFacetedSearch(block, config)`.
It owns search controls, state synchronization, pagination, result/loading/empty/error
states, asynchronous render coordination and cleanup. Events search is its first
consumer. Courses and playlists retain their existing implementations.

## Block configuration

The events integration is the reference:

```js
export default async function decorate(block) {
  const placeholders = await fetchLanguagePlaceholders();
  await createFacetedSearch(block, createEventsSearchConfig(placeholders));
}
```

Configuration supplies:

- `groups`: ordered `{ id, name, items? }` facet definitions.
- `search`: defaults to true; set false to omit the keyword input.
- `labels`: localized search-shell labels.
- `createSource({ groups, initialSort, pageSize })`: an instance-based data source.
- `sort`: optional `{ initial, default, resolve(state, action) }` policy.
  `resolve` returns `{ value, options, key, criterion }`. `key` identifies the
  backend criterion, including any filter-dependent context.
- `pagination`: optional `{ pageSize, labels }`. The source owns remote paging or
  local slicing; the controller never slices already-paginated results.
- `prepareItems(items, state, snapshot)`: optional asynchronous domain adaptation.
- `renderItem(element, item, index)`: asynchronous card rendering.
- `createLoading()`: optional loading presentation.
- `createView({ block, body, controls, grid })`: optional view integration returning
  `afterRender()` and `destroy()` hooks.
- `getFacetItems(group, values, state)`: optional facet label/count policy.
- `analytics.onCommit({ action, state, snapshot })` and `analytics.onClear()`.
- `scrollToResults(element)`: optional navigation policy.

`prefix` defaults to `fs`; `resultsPrefix`, `resultClasses` and `cardColumns` retain
consumer-specific result markup. Include the shared stylesheet from the block's
CSS, as events search does.

## Data source contract

A source implements:

```js
{
  init(),                         // asynchronous initialization
  subscribe(listener),            // returns an unsubscribe function
  getSnapshot(),
  apply(state, action, sort),      // query/filter/sort/page/clear
  destroy(),
}
```

Snapshots contain:

```js
{
  state: { keyword, filters, sort, page },
  loading, pending, ready, error,
  responseId, sortKey,
  items, total, page, maxPage,
  facets,                         // group id -> [{ value, title, count }]
}
```

Keep item models domain-specific. Only the response envelope is normalized.
`pending` must remain true until the applied state and a new response match the
latest user intent. Loading/pending snapshots cannot overwrite user selections.
Stable response IDs prevent duplicate renders and analytics.

The Coveo source builds the configured facet fields, retains its own engine/controllers and uses Headless's URL
manager. It does not publish `window.headless*`. Legacy initialization still
publishes globals by default. Do not also bind query-string URL synchronization
to a Coveo instance: each URL namespace needs one owner. Multiple simultaneous
Coveo instances sharing the same hash are not supported.

Courses will need a source that preserves server product/level filtering and
local progress/status filtering. Playlists will need a local-data source with
their existing repeated query parameters. Add these when those blocks migrate,
not by putting their business rules into the shared controller.

## Lifecycle and preserved event behavior

The returned instance exposes `store` and `destroy()`. Reinitializing a block or
removing it from the document tears down subscriptions, hash listeners, loading
UI and view-switcher observers. Older asynchronous renders cannot replace newer
results or commit after destruction.

Event sorting remains in `blocks/events-search/events-search-sort.js`: query
searches default to relevance; popularity is available only for on-demand-only
results; upcoming dates sort ascending and on-demand dates descending. Mixed
date/default views retain upcoming-then-on-demand ordering within the returned
page, not a new cross-page sort.

## Validation

Run focused behavior tests:

```sh
node --experimental-vm-modules --test \
  scripts/faceted-search/faceted-search.test.mjs \
  blocks/events-search/events-search-sort.test.mjs \
  blocks/events-search/events-search-results.test.mjs
```

The event policy tests evaluate production modules with only the browser
placeholder service stubbed.

Run the existing Docker-based visual comparison without updating snapshots:

```sh
npm run test:visual:block -- tools/visual-tests/blocks/events-search/events-search.spec.js
```

Also check rapid filter/query changes, clear, URL restoration and back/forward,
page navigation/input, grid/list switching, analytics counts, and visible errors.
