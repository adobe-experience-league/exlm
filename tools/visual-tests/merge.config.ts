// Used by `playwright merge-reports` in CI to combine the shard blob reports into the
// same HTML and JSON outputs a local run produces.
export default {
  testDir: './',
  reporter: [
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],
};
