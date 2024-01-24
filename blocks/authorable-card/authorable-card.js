import { decorateIcons, fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import ArticleDataService from '../../scripts/data-service/article-data-service.js';
import mapResultToCardsData from './article-data-adapter.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const [headingElement, toolTipElement, linkTextElement, ...linksContainer] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  headingElement.firstElementChild?.classList.add('h2');
  block.classList.add('browse-cards-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
          ${headingElement.innerHTML}
          ${
            toolTipElement.textContent.trim() !== ''
              ? `<div class="tooltip">
              <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement.textContent.trim()}</span>
            </div>`
              : ''
          }
      </div>
      ${linkTextElement?.outerHTML}
    </div>
  `);
  block.replaceChildren(headerDiv);

  const articleDataService = new ArticleDataService();
  const buildCardsShimmer = new BuildPlaceholder();
  buildCardsShimmer.add(block);

  let placeholders = {};
  try {
    placeholders = await fetchPlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const cardLoading$ = Promise.all(
    linksContainer.map(async (linkContainer) => {
      const link = linkContainer.textContent.trim();
      // use the link containers parent as container for the card as it is instruented for authoring
      // eslint-disable-next-line no-param-reassign
      linkContainer = linkContainer.parentElement;
      linkContainer.innerHTML = '';
      if (link) {
        try {
          const data = await articleDataService.handleArticleDataService(link);
          const cardData = await mapResultToCardsData(data, placeholders);
          await buildCard(linkContainer, cardData);
          decorateIcons(linkContainer);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(err);
        }
      }
      return linkContainer;
    }),
  );

  cardLoading$.then((cards) => {
    buildCardsShimmer.remove();
    const contentDiv = document.createElement('div');
    contentDiv.className = 'browse-cards-block-content';
    contentDiv.append(...cards);
    block.appendChild(contentDiv);
  });
}
