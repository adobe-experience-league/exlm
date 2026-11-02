import assert from 'assert/strict';
import { test } from 'node:test';
import { selectTests } from './select-tests.js';
import { createComment, summarize } from './report.js';

test('selects only the changed block and records missing functional coverage', () => {
  const plan = selectTests(['blocks/cards/cards.css'], ['cards', 'grid-cards'], ['grid-cards']);
  assert.deepEqual(plan.visual, ['cards']);
  assert.deepEqual(plan.functional, []);
  assert.deepEqual(plan.functionalGaps, ['cards']);
});

test('expands shared changes and retains changed blocks without any tests', () => {
  const plan = selectTests(['scripts/scripts.js', 'blocks/new-block/new-block.js'], ['cards'], ['grid-cards']);
  assert.deepEqual(plan.blocks, ['cards', 'grid-cards', 'new-block']);
  assert.deepEqual(plan.visual, ['cards']);
  assert.deepEqual(plan.functional, ['grid-cards']);
  assert.deepEqual(plan.gaps, ['new-block']);
});

test('deduplicates blocks, includes deleted paths and does not test documentation-only changes', () => {
  const plan = selectTests(['blocks/grid-cards/grid-cards.js', 'blocks/grid-cards/grid-cards.css'], [], ['grid-cards']);
  assert.deepEqual(plan.functional, ['grid-cards']);
  assert.deepEqual(selectTests(['README.md'], ['cards'], ['grid-cards']).blocks, []);
});

function report(statuses, errors = []) {
  return {
    errors,
    suites: [
      {
        suites: [
          {
            specs: statuses.map((status) => ({
              title: '<script> @someone | [unsafe](https://example.com)',
              tests: [{ status }],
            })),
          },
        ],
      },
    ],
  };
}

test('counts actual results including flaky, skipped and runner errors', () => {
  assert.deepEqual(summarize(report(['expected', 'unexpected', 'flaky', 'skipped'], [{}])), {
    passed: 1,
    failed: 1,
    flaky: 1,
    skipped: 1,
    errors: 1,
    failures: ['&#60;script&#62; &#64;someone &#124; &#91;unsafe&#93;&#40;https://example.com&#41;'],
  });
  assert.throws(() => summarize({}), /Invalid/);
  assert.throws(() => summarize(report(['unknown'])), /Unknown/);
});

function comment(reports, conclusion = 'success') {
  return createComment({
    plan: selectTests(['blocks/grid-cards/grid-cards.js'], [], ['grid-cards']),
    reports,
    conclusion,
    sha: 'a'.repeat(40),
    runUrl: 'https://github.com/example/repo/actions/runs/1',
  });
}

test('does not present absent, empty, skipped, flaky or failed execution as passing', () => {
  assert.match(comment({}), /Missing report/);
  [[], ['unexpected'], ['flaky'], ['skipped']].forEach((statuses) => {
    assert.match(comment({ functional: report(statuses) }), /Needs attention/);
  });
  assert.match(comment({ functional: report(['expected']) }, 'failure'), /Needs attention/);
  assert.match(comment({ functional: report(['expected']) }), /Selected tests passed/);
});

test('escapes untrusted scenario text and rejects invalid selection', () => {
  const body = comment({ functional: report(['unexpected']) });
  assert.ok(!body.includes('<script>'));
  assert.ok(!body.includes('@someone'));
  assert.ok(!body.includes('[unsafe]'));
  assert.throws(() => createComment({ plan: {} }), /invalid QA test selection/);
});
