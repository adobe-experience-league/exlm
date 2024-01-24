import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, loadIms } from '../../scripts/scripts.js';
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
  const [contentType, capabilities, role, level, sortBy] = configs.map((cell) => cell.textContent.trim());

  const sortCriteria = COVEO_SORT_OPTIONS[sortBy.toUpperCase()];
  const noOfResults = 4;
  const productKey = 'exl:solution/';
  const featureKey = 'exl:feature/';

  const extractCapability = (input, prefix) => {
    if (!input) {
      return null;
    }
    const items = input.split(',').map((item) => item.trim());
    const result = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.startsWith(prefix)) {
        result.push(atob(item.substring(prefix.length)));
      }
    }
    return result;
  };

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
  headerDiv.querySelector('h1,h2,h3,h4,h5,h6')?.insertAdjacentHTML('beforeend', '<div class="tooltip-placeholder"></div>');
  // Appending header div to the block
  block.appendChild(headerDiv);

  const tooltipElem = block.querySelector('.tooltip-placeholder');
  if (tooltipElem) {
    const tooltipConfig = {
      content: toolTipElement.textContent.trim(),
    };
    createTooltip(block, tooltipElem, tooltipConfig);
  }

  await decorateIcons(headerDiv);

  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  const param = {
    contentType: contentType && contentType.toLowerCase().split(','),
    product: extractCapability(capabilities, productKey),
    feature: extractCapability(capabilities, featureKey),
    role: role && role.toLowerCase().split(','),
    level: level && level.toLowerCase().split(','),
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
        decorateIcons(block);
      }
    })
    .catch((err) => {
      buildCardsShimmer.remove();
      /* eslint-disable-next-line no-console */
      console.error(err);
    });
}
