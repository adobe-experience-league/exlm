/* eslint-env node */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

// Evaluate the production modules; only the browser placeholder service is stubbed.
const context = vm.createContext({ URLSearchParams });
const placeholders = new vm.SyntheticModule(
  ['fetchLanguagePlaceholders'],
  function initialize() {
    this.setExport('fetchLanguagePlaceholders', async () => ({}));
  },
  { context },
);
const constants = new vm.SourceTextModule(
  await readFile(new URL('../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js', import.meta.url), 'utf8'),
  { context },
);
await constants.link(() => placeholders);
const policyModule = new vm.SourceTextModule(
  await readFile(new URL('./events-search-sort.js', import.meta.url), 'utf8'),
  { context },
);
await policyModule.link(() => constants);
await policyModule.evaluate();
const { default: createPolicy, shouldGroupEvents, groupUpcomingThenOnDemand } = policyModule.namespace;
const { CONTENT_TYPES } = constants.namespace;
const upcoming = CONTENT_TYPES.UPCOMING_EVENT_V2.MAPPING_KEY;
const onDemand = CONTENT_TYPES.ON_DEMAND_EVENT.MAPPING_KEY;
const state = (types, keyword = '', sort = 'relevance') => ({
  filters: { el_contenttype: types },
  keyword,
  sort,
});
const values = (selection) => Array.from(selection.options, (option) => option.value);

test('event sort visibility and options preserve mixed, upcoming and on-demand rules', () => {
  const policy = createPolicy({}, '');
  assert.deepEqual(values(policy.resolve(state([]), 'response')), []);
  assert.deepEqual(values(policy.resolve(state([upcoming]), 'response')), ['date']);
  assert.deepEqual(values(policy.resolve(state([onDemand]), 'response')), ['date', 'popularity']);
  assert.deepEqual(values(policy.resolve(state([onDemand], 'event'), 'response')), ['relevance', 'date', 'popularity']);
});

test('URL-restored popularity survives a settled on-demand response, but a new query defaults to relevance', () => {
  const policy = createPolicy({}, '#sortCriteria=%40el_view_count%20descending');
  assert.equal(policy.initial, 'popularity');
  assert.equal(policy.resolve(state([onDemand], '', policy.initial), 'response').value, 'popularity');
  assert.equal(policy.resolve(state([onDemand], 'event', 'popularity'), 'keyword').value, 'relevance');
  assert.equal(policy.resolve(state([upcoming], '', 'popularity'), 'response').value, 'date');
});

test('event sort maps context to the existing native Coveo criteria', () => {
  const policy = createPolicy({}, '');
  const criteria = {
    field: (field, direction) => `${field}:${direction}`,
    date: (direction) => `date:${direction}`,
    relevance: () => 'relevancy',
  };
  assert.equal(
    policy.resolve(state([upcoming], '', 'date'), 'response').criterion(criteria),
    'el_event_start_time:ascending',
  );
  assert.equal(policy.resolve(state([onDemand], '', 'date'), 'response').criterion(criteria), 'date:descending');
  assert.equal(
    policy.resolve(state([onDemand], '', 'popularity'), 'response').criterion(criteria),
    'el_view_count:descending',
  );
  assert.equal(policy.resolve(state([], 'event', 'date'), 'response').criterion(criteria), 'relevancy');
});

test('mixed grouping is page-local, upcoming first, and does not mutate the supplied cards', () => {
  const cards = [
    { contentType: onDemand, event: { date: '2025-01-01' } },
    { contentType: upcoming, event: { date: '2026-12-01' } },
    { contentType: onDemand, event: { date: '2025-12-01' } },
    { contentType: upcoming, event: { date: '2026-11-01' } },
  ];
  assert.deepEqual(Array.from(groupUpcomingThenOnDemand(cards)), [cards[3], cards[1], cards[2], cards[0]]);
  assert.equal(shouldGroupEvents(state([], 'event', 'relevance')), false);
  assert.equal(shouldGroupEvents(state([], 'event', 'date')), true);
  assert.equal(shouldGroupEvents(state([upcoming], '', 'date')), false);
});
