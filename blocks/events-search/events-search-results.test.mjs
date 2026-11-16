/* eslint-env node */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

let featureEnabled = true;
let listEnhancements = 0;
const dependencies = {
  '../../scripts/lib-franklin.js': { loadCSS() {} },
  '../../scripts/scripts.js': { createTag: () => ({}) },
  '../../scripts/browse-card/browse-cards-coveo-data-adaptor.js': { default: {} },
  '../../scripts/browse-card/browse-cards-delegate.js': {
    normalizeOnDemandEventModel() {},
    normalizeUpcomingEventModel() {},
  },
  '../../scripts/browse-card/browse-cards-view-switcher.js': {
    default: {
      async create({ block }) {
        return {
          appendTo() {},
          enhanceCardsForListView() {
            assert.equal(block.hasStyleScope(), true);
            listEnhancements += 1;
          },
          destroy() {},
        };
      },
    },
  },
  '../../scripts/browse-card/browse-card.js': { buildCard() {} },
  '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js': { CONTENT_TYPES: {} },
  '../../scripts/utils/feature-flag-utils.js': { default: () => featureEnabled },
  './events-search-sort.js': { groupUpcomingThenOnDemand() {}, shouldGroupEvents() {} },
};
const context = vm.createContext({});
const resultsModule = new vm.SourceTextModule(
  await readFile(new URL('./events-search-results.js', import.meta.url), 'utf8'),
  { context },
);
await resultsModule.link((specifier) => {
  const exports = dependencies[specifier];
  assert.ok(exports, `Unexpected dependency: ${specifier}`);
  return new vm.SyntheticModule(
    Object.keys(exports),
    function initialize() {
      Object.entries(exports).forEach(([name, value]) => this.setExport(name, value));
    },
    { context },
  );
});
await resultsModule.evaluate();

async function createView(cardClass, { enabled = true, list = false } = {}) {
  featureEnabled = enabled;
  const classes = new Set();
  const block = { classList: { add: (name) => classes.add(name) } };
  const body = {
    querySelector: (selector) => (selector.split(/,\s*/).includes(`.${cardClass}`) ? {} : null),
    classList: { contains: (name) => list && name === 'list' },
    hasStyleScope: () => classes.has('events-v2'),
  };
  const view = await resultsModule.namespace.createEventView({ block, body, controls: { prepend() {} } });
  view.afterRender();
  return classes;
}

test('committed upcoming cards enable their figure styling for both supported class variants', async () => {
  await Promise.all(
    ['upcoming-event-card', 'event-upcoming-event-card'].map(async (variant) => {
      const classes = await createView(variant);
      assert.equal(classes.has('events-v2'), true, variant);
    }),
  );
});

test('on-demand cards and disabled Events V2 do not enable upcoming styling', async () => {
  assert.equal((await createView('event-on-demand-event-card')).has('events-v2'), false);
  assert.equal((await createView('event-upcoming-event-card', { enabled: false })).has('events-v2'), false);
});

test('upcoming styling is restored before list-view enhancement', async () => {
  listEnhancements = 0;
  assert.equal((await createView('event-upcoming-event-card', { list: true })).has('events-v2'), true);
  assert.equal(listEnhancements, 1);
});
