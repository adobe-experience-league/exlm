import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const [headingElement, toolTipElement, linkElement, ...configs] = [...block.children].map(
    (row) => row.firstElementChild,
  );
  const [contentType, capabilities, role, level, authorType, sortBy] = configs.map((cell) => cell.textContent.trim());
  const sortCriteria = COVEO_SORT_OPTIONS[sortBy?.toUpperCase() ?? 'RELEVANCE'];
  const noOfResults = 4;
  const productKey = 'exl:solution';
  const featureKey = 'exl:feature';
  const products = [];
  const versions = [];
  const features = [];
  headingElement.firstElementChild?.classList.add('h2');

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
        ${headingElement.innerHTML}
      </div>
      <div class="browse-cards-block-view">${linkElement.innerHTML}</div>
    </div>
  `);

  if (toolTipElement?.textContent?.trim()) {
    headerDiv
      .querySelector('h1,h2,h3,h4,h5,h6')
      ?.insertAdjacentHTML('afterend', '<div class="tooltip-placeholder"></div>');
    const tooltipElem = headerDiv.querySelector('.tooltip-placeholder');
    const tooltipConfig = {
      content: toolTipElement.textContent.trim(),
    };
    createTooltip(block, tooltipElem, tooltipConfig);
  }

  // Appending header div to the block
  block.appendChild(headerDiv);

  await decorateIcons(headerDiv);

  /**
   * Removes duplicate items from an array of products/solutions (with sub-solutions)
   * @returns {Array} - Array of unique products.
   */
  const removeProductDuplicates = () => {
    const filteredProducts = [];
    for (let outerIndex = 0; outerIndex < products.length; outerIndex += 1) {
      const currentItem = products[outerIndex];
      let isDuplicate = false;
      for (let innerIndex = 0; innerIndex < products.length; innerIndex += 1) {
        if (outerIndex !== innerIndex && products[innerIndex].startsWith(currentItem)) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        filteredProducts.push(products[outerIndex]);
      }
    }
    return filteredProducts;
  };

  /**
   * Extracts capabilities from a comma-separated string and populates relevant arrays.
   * Existence of variables declared on top: capabilities, productKey, featureKey, products, versions, features.
   */
  const extractCapability = () => {
    const items = capabilities.split(',');
    items.forEach((item) => {
      const [type, productBase64, subsetBase64] = item.split('/');
      if (productBase64) {
        const decryptedProduct = atob(productBase64);
        if (!products.includes(decryptedProduct)) {
          products.push(decryptedProduct);
        }
      }
      if (type === productKey) {
        if (subsetBase64) versions.push(atob(subsetBase64));
      } else if (type === featureKey) {
        if (subsetBase64) features.push(atob(subsetBase64));
      }
    });
  };

  extractCapability();

  const param = {
    contentType: contentType && contentType.toLowerCase().split(','),
    product: products.length ? removeProductDuplicates(products) : null,
    feature: features.length ? [...new Set(features)] : null,
    version: versions.length ? [...new Set(versions)] : null,
    role: role && role.toLowerCase().split(','),
    level: level && level.toLowerCase().split(','),
    authorType: authorType && authorType.split(','),
    sortCriteria,
    noOfResults,
  };

  const buildCardsShimmer = new BuildPlaceholder();
  buildCardsShimmer.add(block);

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent
    .then((data) => {
      buildCardsShimmer.remove();
      if (data?.length) {
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('browse-cards-block-content');

        for (let i = 0; i < Math.min(noOfResults, data.length); i += 1) {
          const cardData = data[i];
          const cardDiv = document.createElement('div');
          buildCard(contentDiv, cardDiv, cardData);
          contentDiv.appendChild(cardDiv);
        }
        block.appendChild(contentDiv);
        /* Hide Tooltip while scrolling the cards layout */
        hideTooltipOnScroll(contentDiv);
      }
    })
    .catch((err) => {
      buildCardsShimmer.remove();
      /* eslint-disable-next-line no-console */
      console.error(err);
    });
}
