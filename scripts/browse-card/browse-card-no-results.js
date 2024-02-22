import { loadCSS } from '../lib-franklin.js';
import { htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

// Default No Results Content from Placeholder
export const buildNoResultsContent = (block) => {
  loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`); // load css dynamically
  const noResultsInfo = htmlToElement(`
    <div class="browse-card-no-results">${placeholders.noResultsText}</div>
  `);
  block.appendChild(noResultsInfo);
};

/* Remove No Results block for Block */
export const removeNoResultInfo = (block) => {
  const existingNoResultsInfo = block.querySelector('.browse-card-no-results');
  if (existingNoResultsInfo) {
    block.removeChild(existingNoResultsInfo);
  }
};
