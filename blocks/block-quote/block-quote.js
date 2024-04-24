import { getMetadata } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  // Getting the theme from the Metadata Properties
  const theme = getMetadata('article-theme') || 'external';
  block.classList.add('block-quote-content', theme);
}
