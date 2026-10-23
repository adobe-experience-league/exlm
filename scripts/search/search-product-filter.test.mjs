/**
 * EXLM-6173 — product filter for header search redirects.
 * Run: node scripts/search/search-product-filter.test.mjs
 */
import assert from 'node:assert/strict';
import resolveSearchProductFilter from './search-product-filter.js';

function meta(map) {
  return (name) => map[name] ?? '';
}

// --- docs hub: never apply product (even when solution / product metas are set) ---
assert.equal(
  resolveSearchProductFilter(
    meta({
      theme: 'docs, docs-landing',
      usetq: 'true',
      solution: 'Experience Cloud',
      product: 'CX Enterprise',
      'coveo-solution': 'CX Enterprise',
    }),
  ),
  '',
  'docs-landing must omit product filter',
);

assert.equal(
  resolveSearchProductFilter(
    meta({
      theme: 'docs, docs-landing',
      usetq: 'false',
      solution: 'Experience Cloud',
    }),
  ),
  '',
  'docs-landing omits product even when usetq is off',
);

// --- solution landing: keep product, prefer TQ when usetq ---
assert.equal(
  resolveSearchProductFilter(
    meta({
      theme: 'docs, docs-solution-landing',
      usetq: 'true',
      solution: 'Experience Cloud',
      product: 'Analytics',
      'coveo-solution': 'Analytics',
    }),
  ),
  'Analytics',
  'usetq prefers product over stale solution v1',
);

assert.equal(
  resolveSearchProductFilter(
    meta({
      theme: 'docs, docs-solution-landing',
      usetq: 'true',
      solution: 'Experience Cloud',
      product: '',
      'coveo-solution': 'CX Enterprise',
    }),
  ),
  'CX Enterprise',
  'usetq falls back to coveo-solution when product is empty',
);

assert.equal(
  resolveSearchProductFilter(
    meta({
      theme: 'docs, docs-solution-landing',
      usetq: 'true',
      solution: 'Experience Cloud',
      product: '',
      'coveo-solution': '',
    }),
  ),
  '',
  'usetq must not fall back to legacy solution',
);

// --- legacy pages without usetq: solution still drives the facet ---
assert.equal(
  resolveSearchProductFilter(
    meta({
      theme: 'docs',
      solution: 'Target',
      product: 'ShouldNotWin',
    }),
  ),
  'Target',
  'without usetq, solution (v1) is used',
);

assert.equal(
  resolveSearchProductFilter(
    meta({
      solution: 'Journey Optimizer, Campaign',
    }),
  ),
  'Journey Optimizer',
  'first CSV solution value',
);

assert.equal(
  resolveSearchProductFilter(
    meta({
      usetq: 'true',
      'coveo-solution': 'Experience Manager|Experience Manager 6.5;Target',
    }),
  ),
  'Experience Manager|Experience Manager 6.5',
  'first semicolon coveo-solution value',
);

assert.equal(resolveSearchProductFilter(meta({})), '', 'empty meta → no product filter');

console.log('search-product-filter.test.mjs: all assertions passed');
