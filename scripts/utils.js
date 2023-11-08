import { getMetadata } from './lib-franklin.js';

// eslint-disable-next-line import/prefer-default-export
export const isDocPage = () => {
  const theme = getMetadata('theme');
  return theme
    .split(',')
    .map((t) => t.toLowerCase())
    .includes('docs');
};
