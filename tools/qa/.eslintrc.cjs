module.exports = {
  env: { node: true },
  rules: {
    'no-console': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['tools/qa/**/*.test.js'] }],
  },
};
