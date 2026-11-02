export const MARKER = '<!-- exlm-qa-foundation -->';

function text(value) {
  return String(value)
    .slice(0, 200)
    .replace(/[&<>"'`*_[\]\\|!#()]/g, (character) => `&#${character.charCodeAt(0)};`)
    .replace(/@/g, '&#64;')
    .replace(/[\r\n]/g, ' ');
}

export function summarize(report) {
  if (!report || !Array.isArray(report.suites) || !Array.isArray(report.errors)) {
    throw new Error('Invalid Playwright report.');
  }
  const counts = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
  const failures = [];
  const visit = (suites) => {
    suites.forEach((suite) => {
      (suite.specs || []).forEach((spec) => {
        spec.tests.forEach((test) => {
          const key = { expected: 'passed', unexpected: 'failed', flaky: 'flaky', skipped: 'skipped' }[test.status];
          if (!key) throw new Error('Unknown Playwright test status.');
          counts[key] += 1;
          if (key === 'failed' && failures.length < 10) failures.push(text(spec.title));
        });
      });
      visit(suite.suites || []);
    });
  };
  visit(report.suites);
  return { ...counts, errors: report.errors.length, failures };
}

export function createComment({ plan, reports, conclusion, sha, runUrl }) {
  if (
    !plan ||
    !['blocks', 'visual', 'functional', 'gaps', 'functionalGaps'].every(
      (key) => Array.isArray(plan[key]) && plan[key].every((item) => typeof item === 'string'),
    )
  ) {
    throw new Error('Missing or invalid QA test selection.');
  }
  const rows = [];
  const failures = [];
  let attention = conclusion !== 'success';
  ['functional', 'visual'].forEach((kind) => {
    if (!plan[kind].length) {
      rows.push(`| ${kind} | Not selected - no coverage claim |`);
      return;
    }
    const report = reports[kind];
    if (!report) {
      attention = true;
      rows.push(`| ${kind} | Missing report - execution/infrastructure error |`);
      return;
    }
    const result = summarize(report);
    const total = result.passed + result.failed + result.flaky + result.skipped;
    if (!total || result.failed || result.flaky || result.skipped || result.errors) attention = true;
    rows.push(
      `| ${kind} | ${result.passed} passed, ${result.failed} failed, ${result.flaky} flaky, ${
        result.skipped
      } skipped, ${result.errors} runner errors${total ? '' : ' - no tests executed'} |`,
    );
    failures.push(...result.failures);
  });
  const gaps = [...new Set([...plan.gaps, ...plan.functionalGaps])];
  let status = 'Selected tests passed; this is not complete feature coverage.';
  if (!plan.functional.length && !plan.visual.length) {
    status = 'No applicable tests selected - not a coverage pass.';
  } else if (attention) {
    status = 'Needs attention - see failures, flaky/skipped tests, or execution errors.';
  }
  return [
    MARKER,
    '### QA pilot - advisory',
    '',
    `Commit: \`${sha}\``,
    '',
    status,
    `Execution: ${text(conclusion)}.`,
    '',
    '| Suite | Result |',
    '| --- | --- |',
    ...rows,
    '',
    `Affected blocks: ${plan.blocks.map(text).join(', ') || 'none identified'}.`,
    `Blocks without functional coverage: ${gaps.map(text).join(', ') || 'none in the selection'}.`,
    ...(plan.gaps.length ? [`Blocks with no selected tests at all: ${plan.gaps.map(text).join(', ')}.`] : []),
    ...(failures.length
      ? ['', 'Failed scenarios (first 10):', ...failures.slice(0, 10).map((failure) => `- ${failure}`)]
      : []),
    '',
    `[Execution, reports, screenshots and traces](${runUrl})`,
    '',
    'Deterministic tests only. Jira/Copilot generation, full accessibility audits, live APIs and authenticated journeys are not configured. Failures are not automatically classified as PR-introduced regressions.',
  ].join('\n');
}
