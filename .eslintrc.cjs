module.exports = {
  root: true,
  extends: ['airbnb-base', 'prettier'],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    // allow reassigning param
    'no-param-reassign': [2, { props: false }],
    'linebreak-style': ['error', 'unix'],
    'import/extensions': [
      'error',
      {
        js: 'always',
      },
    ],
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['build/*'] }],
  },
  overrides: [
    {
      // Node-side build/test tooling, not browser app code: console output is the point,
      // __dirname is the standard ESM idiom, and recording/generation scripts intentionally
      // await one block/variation at a time in a shared browser session.
      files: ['tools/visual-tests/**/*.js', 'tools/visual-tests/**/*.ts'],
      env: { node: true },
      rules: {
        'no-console': 'off',
        'no-await-in-loop': 'off',
        'no-underscore-dangle': ['error', { allow: ['__dirname', '__filename'] }],
      },
    },
  ],
};
