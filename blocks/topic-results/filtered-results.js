import { htmlToElement } from '../../scripts/scripts.js';

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
function createFilteredResult({ title = '', description = '', productName = '', contentType = '', dateUpdated = '' }) {
  const truncatedDescription = description.length > 150 ? `${description.slice(0, 150)}...` : description;
  return htmlToElement(`
    <a class="filtered-result-container" href="#">
        <div class="filtered-result-content">
            <h2 class="filtered-result-title" >${title}</h2>
            <p class="filtered-result-description">
                ${truncatedDescription}
            </p>
            <span class="filtered-result-product-name" >${productName}</span>
            <span class="filtered-result-content-type" >${contentType}</span>
            <span class="filtered-result-date-updated" >${dateUpdated}</span>
        </div>
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
