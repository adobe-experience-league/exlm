import { htmlToElement } from '../../../scripts/scripts.js';
import { loadCSS } from '../../../scripts/lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}../blocks/topic-results/filtered-results/filtered-results.css`);

/**
 * Creates a filtered result element based on the provided options.
 * @param {Object} options - The options for creating a filtered result.
 * @param {string} options.title - The title of the result.
 * @param {string} options.description - The description of the result.
 * @param {string} options.productName - The product name associated with the result.
 * @param {string} options.contentType - The content type of the result.
 * @param {string} options.dateUpdated - The date the result was last updated.
 * @returns {HTMLElement} The filtered result element.
 */
function createFilteredResult({ title = '', description = '', product = [], contentType = [], dateUpdated = ''}) {
  const truncatedDescription = description.length > 150 ? `${description.slice(0, 150)}...` : description;
  const formattedDate = dateUpdated ? new Date(dateUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not available';

  return htmlToElement(`
    <a class="filtered-result-container" href="#">
        <div class="filtered-result-content">
            <div class="filtered-result-title-description-container">
                <h2 class="filtered-result-title">${title}</h2>
                <p class="filtered-result-description">${truncatedDescription}</p>
            </div>
            <span class="filtered-result-content-type">${contentType}</span>
        </div>
        <span class="filtered-result-product-name">${product}</span>
        <span class="filtered-result-date-updated">${formattedDate}</span>
    </a>`);
}

/**
 * Populates the block with filtered results based on the selected content type.
 * @param {HTMLElement} block - The block to populate with filtered results.
 * @param {Array|Object} results - The results to display, can be a single object or an array of objects.
 */
function populateFilteredResults(block, results) {
  
  // Create a new variable to hold the processed results
  const processedResults = Array.isArray(results) ? results : [results];

  // Create or clear a container for the filtered results
  let resultsContainer = block.querySelector('.filtered-results-container');
  if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.className = 'filtered-results-container';
    block.appendChild(resultsContainer);
  } else {
    resultsContainer.innerHTML = '';
  }

  // Append new filtered results
  processedResults.forEach((result) => {
    resultsContainer.appendChild(createFilteredResult(result));
  });
}

export { createFilteredResult, populateFilteredResults };
