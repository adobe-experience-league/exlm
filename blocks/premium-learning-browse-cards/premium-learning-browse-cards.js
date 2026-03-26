/**
 * Premium Learning Browse Cards Block
 * Displays a grid of premium learning content (courses and cohorts)
 *
 * Features:
 * - Displays premium learning courses and cohorts
 * - Configurable heading and description
 * - Content type filtering
 * - Product filtering support
 * - Responsive card layout
 */

import PLDataService from '../../scripts/data-service/premium-learning-data-service.js';
import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { transformPremiumLearningData } from '../../scripts/browse-card/browse-card-adapter.js';

/**
 * Module-level placeholders for internationalization
 */
let placeholders = {};

/**
 * CSS class names for block elements
 */
const CSS_CLASSES = {
  BLOCK: 'premium-learning-browse-cards-block',
  HEADER: 'premium-learning-browse-cards-header',
  TITLE: 'premium-learning-browse-cards-title',
  DESCRIPTION: 'premium-learning-browse-cards-description',
  CONTENT: 'premium-learning-browse-cards-content',
};

/**
 * Default number of results to fetch
 */
const DEFAULT_NUM_RESULTS = 4;

/**
 * Default product filter configuration
 * UPDATE THIS ARRAY to filter by specific products
 * Example: ['Acrobat', 'Photoshop', 'Illustrator']
 * Leave as empty array to use config default or show all products
 */
const DEFAULT_PRODUCT_FILTERS = [];

/**
 * Creates the header section with title and description
 * @param {HTMLElement} headingElement - The heading element from block children
 * @param {HTMLElement} descriptionElement - The description element from block children
 * @returns {HTMLElement} The constructed header div element
 */
function createHeader(headingElement, descriptionElement) {
  const headerDiv = htmlToElement(`
    <div class="${CSS_CLASSES.HEADER}">
      <div class="${CSS_CLASSES.TITLE}">
        ${headingElement?.innerHTML || ''}
      </div>
      ${
        descriptionElement?.innerHTML
          ? `<div class="${CSS_CLASSES.DESCRIPTION}">
        ${descriptionElement.innerHTML}
      </div>`
          : ''
      }
    </div>
  `);

  return headerDiv;
}

/**
 * Renders cards to the DOM
 * @param {HTMLElement} contentDiv - The content container element
 * @param {Array} data - Array of card data to render
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 */
function renderCards(contentDiv, data, shimmer) {
  try {
    shimmer.removeShimmer();

    // Clear existing content
    contentDiv.innerHTML = '';

    if (data?.length > 0) {
      // Use document fragment for better performance
      const fragment = document.createDocumentFragment();

      data.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        buildCard(cardDiv, cardData);
        fragment.appendChild(cardDiv);
      });

      contentDiv.appendChild(fragment);
    } else {
      // Show no results message
      const noResultsMessage = placeholders?.premiumLearningNoResults || 'No premium learning content found.';
      contentDiv.innerHTML = `<div class="no-results">${noResultsMessage}</div>`;
    }
  } catch (error) {
    shimmer.removeShimmer();
    // eslint-disable-next-line no-console
    console.error('Error rendering premium learning cards:', error);

    // Show error message
    const errorMessage = placeholders?.premiumLearningLoadError || 'Failed to load premium learning content.';
    contentDiv.innerHTML = `<div class="no-results">${errorMessage}</div>`;
  }
}

/**
 * Fetches premium learning data from the API using PLDataService
 * @param {string} contentType - Content type to filter by
 * @param {Array<string>} products - Product names to filter by
 * @returns {Promise<Array>} Premium learning data
 */
async function fetchPremiumLearningData(contentType, products = []) {
  const contentTypes = contentType ? contentType.split(',').map((type) => type.trim()) : [];

  // Build query parameters for PLDataService
  const queryParams = {
    contentType: contentTypes,
    noOfResults: DEFAULT_NUM_RESULTS,
    sort: 'name',
  };

  // Add product filter if specified
  if (products && products.length > 0) {
    queryParams.products = products;
  }

  // Create PLDataService instance with custom buildBrowseRequestBody method
  const plService = new PLDataService(queryParams);

  // Override the buildRequestBody to use buildBrowseRequestBody for product filtering
  const originalBuildRequestBody = plService.buildRequestBody.bind(plService);
  plService.buildRequestBody = function () {
    return this.buildBrowseRequestBody();
  };

  // Fetch data from Premium Learning API
  const responseData = await plService.fetchDataFromSource();

  if (!responseData || !responseData.data) {
    return [];
  }

  // Transform the data to match browse card format
  const transformedData = transformPremiumLearningData(responseData);
  return transformedData;
}

/**
 * Main decoration function for the premium-learning-browse-cards block
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  // Fetch placeholders for internationalization
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', error);
  }

  // Extract authoring fields from block children
  const [headingElement, descriptionElement, contentTypeElement] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  const contentType = contentTypeElement?.textContent?.trim().toLowerCase() || '';

  // Clear block and add CSS class
  block.textContent = '';
  block.classList.add(CSS_CLASSES.BLOCK);

  // Create and append header
  const headerDiv = createHeader(headingElement, descriptionElement);
  block.appendChild(headerDiv);

  // Create content container
  const contentDiv = document.createElement('div');
  contentDiv.classList.add(CSS_CLASSES.CONTENT);
  block.appendChild(contentDiv);

  // Initialize and show shimmer loading state
  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(contentDiv);

  // Fetch and render data with product filtering
  // You can modify DEFAULT_PRODUCT_FILTERS at the top of this file to filter by specific products
  try {
    const data = await fetchPremiumLearningData(contentType, DEFAULT_PRODUCT_FILTERS);
    renderCards(contentDiv, data, buildCardsShimmer);
  } catch (error) {
    buildCardsShimmer.removeShimmer();
    buildNoResultsContent(block, true);
    // eslint-disable-next-line no-console
    console.error('Error fetching premium learning data:', error);
  }
}
