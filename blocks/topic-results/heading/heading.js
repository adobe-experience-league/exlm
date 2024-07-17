import { loadCSS } from '../../../scripts/lib-franklin.js';
import { htmlToElement } from '../../../scripts/scripts.js';

/**
 * Creates and returns a heading element for topic results.
 * This function dynamically loads a CSS file for styling the heading and constructs
 * the heading HTML structure with provided data.
 *
 * @param {Object} params - The parameters for creating the heading.
 * @param {string} params.title - The title to display in the heading.
 * @param {string} params.heading - The main heading text.
 * @param {number} params.resultCount - The number of results currently being displayed.
 * @param {number} params.resultTotal - The total number of available results.
 * @param {string} params.viewMoreResultsLabel - The label for the 'View More Results' link.
 * @param {string} params.viewMoreResultsUrl - The URL for the 'View More Results' link.
 * @returns {HTMLElement} The constructed heading element.
 */
function createHeading({ title, heading, resultCount, resultTotal, viewMoreResultsLabel, viewMoreResultsUrl }) {
  // Load the CSS for the heading component
  loadCSS(`${window.hlx.codeBasePath}../blocks/topic-results/heading/heading.css`);

  // Construct and return the heading HTML element using the provided data
  return htmlToElement(`
  <div class="topics-header">
    <div class="topics-header-heading">
      <span>${title}</span>
      <h1>${heading}</h1>
    </div>
    <div class="topics-header-result">
      <p>Showing ${resultCount} of ${resultTotal}</p>
      <a href="${viewMoreResultsUrl}">${viewMoreResultsLabel}</a>
    </div>
  </div>
`);
}

export default createHeading;
