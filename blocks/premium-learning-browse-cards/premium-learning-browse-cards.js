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

import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { extractCapability, removeProductDuplicates } from '../../scripts/browse-card/browse-card-utils.js';

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
const DEFAULT_NUM_RESULTS = 16;

/**
 * Default product filter configuration
 * UPDATE THIS ARRAY to filter by specific products
 * Example: ['Acrobat', 'Photoshop', 'Illustrator']
 * Leave as empty array to use config default or show all products
 */
const DEFAULT_PRODUCT_FILTERS = ['Acrobat'];

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
 * Fetches premium learning data from the API using BrowseCardsDelegate
 * @param {string} contentType - Content type to filter by
 * @param {Array<string>} products - Product names to filter by
 * @param {Array<string>} features - Feature names to filter by
 * @param {Array<string>} versions - Version names to filter by
 * @returns {Promise<Array>} Premium learning data
 */
async function fetchPremiumLearningData(contentType, products = [], features = [], versions = []) {
  const contentTypes = contentType ? contentType.split(',').map(type => type.trim()) : [];
  
  // Build parameters for BrowseCardsDelegate
  const param = {
    contentType: contentTypes,
    noOfResults: DEFAULT_NUM_RESULTS,
    sort: 'name',
    useBrowseRequestBody: true, // Use buildBrowseRequestBody() for product filtering
  };

  // Add product filter if specified
  if (products && products.length > 0) {
    param.product = removeProductDuplicates(products);
  }

  // Add feature filter if specified
  if (features && features.length > 0) {
    param.feature = [...new Set(features)];
  }

  // Add version filter if specified
  if (versions && versions.length > 0) {
    param.version = [...new Set(versions)];
  }

  // Fetch data using BrowseCardsDelegate which handles transformation
  const data = await BrowseCardsDelegate.fetchCardData(param);
  return data || [];
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
  const [headingElement, descriptionElement, contentTypeElement, tagsElement] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  const contentType = contentTypeElement?.textContent?.trim().toLowerCase() || '';
  const tags = tagsElement?.textContent?.trim() || '';

  // Extract products, features, and versions from tags using the same logic as curated-cards
  const { products, features, versions } = extractCapability(tags);

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

  // Fetch and render data with product, feature, and version filtering
  // If tags are authored, use them; otherwise fall back to DEFAULT_PRODUCT_FILTERS
  try {
    const productsToFilter = products.length > 0 ? products : DEFAULT_PRODUCT_FILTERS;
    const data = await fetchPremiumLearningData(contentType, productsToFilter, features, versions);
    renderCards(contentDiv, data, buildCardsShimmer);
  } catch (error) {
    buildCardsShimmer.removeShimmer();
    buildNoResultsContent(block, true);
    // eslint-disable-next-line no-console
    console.error('Error fetching premium learning data:', error);
  }
}
