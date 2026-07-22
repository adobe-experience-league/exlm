import path from 'path';

const isVendoredAtomicCdn = (file) =>
  path.normalize(file).split(path.sep).join('/').includes('scripts/coveo-atomic/cdn/');

const eslintCmd = (files) => {
  const filtered = files.filter((f) => !isVendoredAtomicCdn(f));
  return filtered.length ? [`eslint ${filtered.map((f) => `"${f}"`).join(' ')}`] : [];
};

const cssCmd = (files) => {
  const filtered = files.filter((f) => !isVendoredAtomicCdn(f));
  if (!filtered.length) return [];
  const list = filtered.map((f) => `"${f}"`).join(' ');
  return [`stylelint --fix ${list}`, `prettier --write ${list}`];
};

export default {
  '*.js': eslintCmd,
  '*.css': cssCmd,
  '*.{ejs,html,md,mdx,toml,yaml,xml}': 'prettier --write',
};
