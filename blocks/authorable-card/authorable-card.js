import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { getCardData } from '../../scripts/utils/article-utils.js';


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
      </div>
      ${linkTextElement?.outerHTML}
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

  block.replaceChildren(headerDiv);

  const buildCardsShimmer = new BuildPlaceholder();
  buildCardsShimmer.add(block);
  const contentDiv = document.createElement('div');
  contentDiv.className = 'browse-cards-block-content';

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const cardLoading$ = Promise.all(
    linksContainer.map(async (linkContainer) => {
      // check check check
      let link = linkContainer.textContent?.trim();
      link = link.startsWith('/') ? `${window.hlx.codeBasePath}${link}` : link;
      // use the link containers parent as container for the card as it is instruented for authoring
      // eslint-disable-next-line no-param-reassign
      linkContainer = linkContainer.parentElement;
      linkContainer.innerHTML = '';
      if (link) {
        try {
          const cardData = await getCardData(link, placeholders);
          await buildCard(contentDiv, linkContainer, cardData);
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
    contentDiv.append(...cards);
    block.appendChild(contentDiv);
  });

  /* Hide Tooltip while scrolling the cards layout */
  hideTooltipOnScroll(contentDiv);
  decorateIcons(block);
}
