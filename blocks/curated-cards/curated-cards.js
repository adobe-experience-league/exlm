import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, loadIms } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div');
  const contentType = block.querySelector('div:nth-child(4) > div')?.textContent?.trim()?.toLowerCase();
  const capabilities = block.querySelector('div:nth-child(5) > div')?.textContent?.trim();
  const role = block.querySelector('div:nth-child(6) > div')?.textContent?.trim()?.toLowerCase();
  const level = block.querySelector('div:nth-child(7) > div')?.textContent?.trim()?.toLowerCase();
  const sortBy = block.querySelector('div:nth-child(8) > div')?.textContent?.trim()?.toLowerCase();
  const sortCriteria = COVEO_SORT_OPTIONS[sortBy?.toUpperCase()];
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
    return result.length > 0 ? result : null;
  };

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
          <h2>${headingElement?.textContent?.trim()}</h2>
          ${
            toolTipElement.textContent
              ? `<div class="tooltip">
              <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement?.textContent.trim()}</span>
            </div>`
              : ''
          }
      </div>
      <div class="browse-cards-block-view">${linkTextElement?.innerHTML}</div>
    </div>
  `);
  // Appending header div to the block
  block.appendChild(headerDiv);
  await decorateIcons(headerDiv);

  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  const param = {
    contentType: contentType && contentType.split(','),
    product: extractCapability(capabilities, productKey),
    feature: extractCapability(capabilities, featureKey),
    role: role && role.split(','),
    level: level && level.split(','),
    sortCriteria,
    noOfResults,
  };

  const buildCardsShimmer = new BuildPlaceholder(noOfResults, block);

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent
    .then((data) => {
      buildCardsShimmer.hide();
      if (data?.length) {
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('browse-cards-block-content');

        for (let i = 0; i < Math.min(noOfResults, data.length); i += 1) {
          const cardData = data[i];
          const cardDiv = document.createElement('div');
          buildCard(cardDiv, cardData);
          contentDiv.appendChild(cardDiv);
        }
        buildCardsShimmer.setParent(contentDiv);
        decorateIcons(contentDiv);
      }
    })
    .catch((err) => {
      buildCardsShimmer.hide();
      /* eslint-disable-next-line no-console */
      console.error(err);
    });
}
