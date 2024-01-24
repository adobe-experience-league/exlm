import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { CONTENT_TYPES } from '../../scripts/browse-card/browse-cards-constants.js';
/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div');
  const solutions = block.querySelector('div:nth-child(4) > div').textContent.trim();
  const roles = block.querySelector('div:nth-child(5) > div').textContent.trim();
  const sortBy = block.querySelector('div:nth-child(6) > div').textContent.trim();
  const contentType = CONTENT_TYPES.INSTRUCTOR_LED_TRANING.MAPPING_KEY;
  const noOfResults = 4;

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
    ${
      headingElement?.textContent?.trim()
        ? `<div class="browse-cards-block-title">
          <h2>
            ${headingElement.textContent.trim()}${
              toolTipElement?.textContent?.trim() ? `<div class="tooltip-placeholder"></div>` : ''
            }
          </h2>
      </div>`
        : ''
    }
      <div class="browse-cards-block-view">${linkTextElement?.innerHTML}</div>
    </div>
  `);
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

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  const param = {
    solutions,
    roles,
    sortBy,
    contentType,
  };

  const buildCardsShimmer = new BuildPlaceholder();
  buildCardsShimmer.add(block);

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent
    .then((data) => {
      buildCardsShimmer.remove();
      if (data?.length) {
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
