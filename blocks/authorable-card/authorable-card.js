import { decorateIcons, fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import ArticleDataService from '../../scripts/data-service/article-data-service.js';
import mapResultToCardsData from './article-data-adapter.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';

let numberOfCards = 4;
let buildCardsShimmer = '';
let shimmerElement = '';
const CLASS_SHIMMER_PLACEHOLDER = '.shimmer-placeholder';

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div');
  const links = [];

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

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  const linksContainer = Array.from(block.children).slice(-1 * numberOfCards);
  linksContainer.forEach((link) => {
    links.push(link.querySelector('div')?.textContent);
  });

  numberOfCards = linksContainer.length;

  let placeholders = {};
  try {
    placeholders = await fetchPlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  links.forEach((link, i) => {
    if (link) {
      const articleDataService = new ArticleDataService();
      articleDataService
        .handleArticleDataService(link)
        .then(async (data) => {
          shimmerElement = block.querySelector(CLASS_SHIMMER_PLACEHOLDER);
          shimmerElement?.remove();
          const cardData = await mapResultToCardsData(data, placeholders);
          await buildCard(contentDiv, linksContainer[i], cardData);
          contentDiv.appendChild(linksContainer[i]);
          decorateIcons(block);
          linksContainer[i].children[0].remove();
          if (linksContainer[i].querySelector('.bookmark.auth')) {
            linksContainer[i].querySelector('.bookmark.auth').setAttribute('data-id', cardData.id);
          }
          block.appendChild(contentDiv);
        })
        .catch(() => {
          shimmerElement?.remove();
        });
    }
  });

  block.appendChild(headerDiv);

  /* Tooltip - for Title */
  const tooltipElem = block.querySelector('.tooltip-placeholder');
  if (tooltipElem) {
    const tooltipConfig = {
      content: toolTipElement.textContent.trim(),
    };
    createTooltip(block, tooltipElem, tooltipConfig);
  }

  /* Hide Tooltip while scrolling the cards layout */
  hideTooltipOnScroll(contentDiv);

  Array.from(block.children).forEach((child) => {
    if (!child.className) {
      block.removeChild(child);
    }
  });
  linksContainer.forEach((el) => contentDiv.appendChild(el));
  buildCardsShimmer = new BuildPlaceholder();
  buildCardsShimmer.add(block);
}
