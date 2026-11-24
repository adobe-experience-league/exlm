import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';

const sourceUrl = new URL('../../blocks/slides/slides.js', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
// Load the real module without bootstrapping the site; expose the local function only in tests.
const slideModule = new SourceTextModule(`${source}\nexport { allocateSlideIds };`, { identifier: sourceUrl.href });
const dependencyExports = {
  '../../scripts/lib-franklin.js': ['decorateIcons'],
  '../../scripts/scripts.js': [
    'decorateAnchors',
    'decorateExternalLinks',
    'decorateInlineAttributes',
    'decoratePlaceholders',
    'fetchLanguagePlaceholders',
    'getConfig',
    'getPathDetails',
  ],
  './slider-utils.js': [
    'generateVisualConfig',
    'preferences',
    'showAllSteps',
    'showStep',
    'addEventHandlers',
    'isDesktopView',
    'state',
  ],
};
await slideModule.link((specifier) => {
  const names = dependencyExports[specifier];
  if (!names) throw new Error(`Unstubbed slide dependency: ${specifier}`);
  return new SyntheticModule(names, () => {});
});
await slideModule.evaluate();
const { allocateSlideIds } = slideModule.namespace;

const cases = [
  { name: 'empty deck', ids: [], expected: [] },
  { name: 'unique legacy keys', ids: ['overview', 'details', 'summary'], expected: ['overview', 'details', 'summary'] },
  {
    name: 'reported four-slide deck',
    ids: ['overview', 'details', 'summary', 'overview'],
    expected: ['overview', 'details', 'summary', 'overview-2'],
  },
  {
    name: 'three repeats',
    ids: ['overview', 'overview', 'overview'],
    expected: ['overview', 'overview-2', 'overview-3'],
  },
  {
    name: 'later suffix-shaped key',
    ids: ['overview', 'overview', 'overview-2'],
    expected: ['overview', 'overview-3', 'overview-2'],
  },
  {
    name: 'earlier suffix-shaped key',
    ids: ['overview-2', 'overview', 'overview'],
    expected: ['overview-2', 'overview', 'overview-3'],
  },
  {
    name: 'multiple reserved suffixes',
    ids: ['overview', 'overview', 'overview-2', 'overview-3', 'overview'],
    expected: ['overview', 'overview-4', 'overview-2', 'overview-3', 'overview-5'],
  },
  {
    name: 'repeated explicit suffixed IDs',
    ids: ['custom-2', 'custom-2', 'custom-2-2'],
    expected: ['custom-2', 'custom-2-3', 'custom-2-2'],
  },
  {
    name: 'distinct section qualifications',
    ids: ['a__overview', 'b__overview'],
    expected: ['a__overview', 'b__overview'],
  },
  {
    name: 'colliding final section keys',
    ids: ['a__overview', 'a__overview', 'a__overview-2'],
    expected: ['a__overview', 'a__overview-3', 'a__overview-2'],
  },
  { name: 'empty and whitespace keys', ids: ['', ' ', '\t'], expected: ['slide', 'slide-2', 'slide-3'] },
  {
    name: 'reserved empty-key fallback',
    ids: ['', 'slide', '', 'slide-2'],
    expected: ['slide-3', 'slide', 'slide-4', 'slide-2'],
  },
  {
    name: 'nonempty keys preserved exactly',
    ids: ['Custom_ID', ' a ', 'Custom_ID', 'section__'],
    expected: ['Custom_ID', ' a ', 'Custom_ID-2', 'section__'],
  },
];

cases.forEach(({ name, ids, expected }) => {
  test(name, () => {
    const original = [...ids];
    const result = allocateSlideIds(ids);
    assert.deepEqual(result, expected);
    assert.equal(new Set(result).size, result.length);
    assert.ok(result.every((id) => id.trim()));
    assert.deepEqual(ids, original);
    assert.deepEqual(allocateSlideIds(ids), result);
    const firstOccurrences = new Map();
    ids.forEach((id, index) => {
      if (id.trim() && !firstOccurrences.has(id)) firstOccurrences.set(id, index);
    });
    firstOccurrences.forEach((index, id) => assert.equal(result[index], id));
  });
});

test('independent decks do not share allocation state', () => {
  assert.deepEqual(allocateSlideIds(['overview', 'overview']), ['overview', 'overview-2']);
  assert.deepEqual(allocateSlideIds(['overview']), ['overview']);
});
