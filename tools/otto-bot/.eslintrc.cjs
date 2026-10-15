module.exports = {
  env: { node: true, browser: false },
  globals: { fetch: 'readonly', Response: 'readonly', Headers: 'readonly' },
  rules: {
    // otto-bot is a sequential Node CLI: for..of with await inside loops is intentional.
    'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    'no-await-in-loop': 'off',
    'no-console': 'off',
    // Modules expose small named APIs; a default export would hide intent.
    'import/prefer-default-export': 'off',
  },
};
