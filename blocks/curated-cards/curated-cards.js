// FIXME: This is a dummy component put up to show case the cards rendered via API
import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, loadIms } from '../../scripts/scripts.js';
import buildCard from '../../scripts/browse-card/browse-card.js';
import { SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div > a');
  const contentType = block.querySelector('div:nth-child(4) > div')?.textContent?.trim()?.toLowerCase();
  const capabilityElement = block.querySelector('div:nth-child(5) > div')?.textContent?.trim()?.toLowerCase();
  const role = block.querySelector('div:nth-child(6) > div')?.textContent?.trim()?.toLowerCase();
  const level = block.querySelector('div:nth-child(7) > div')?.textContent?.trim()?.toLowerCase();
  const sortBy = block.querySelector('div:nth-child(9) > div')?.textContent?.trim()?.toLowerCase();
  const sortCriteria = SORT_OPTIONS[sortBy?.toUpperCase()];
  const noOfResults = 4;
  const productKey = 'exl:solution';
  const featureKey = 'exl:feature';
  const capability = {};
  const regex = /(?:exl:solution\/|exl:feature\/)([^,]+)/g;
  const matches = capabilityElement.match(regex);

  if (capabilityElement) {
    if (matches) {
      matches.forEach((match) => {
        const type = match.split('/')[0];
        const text = match.split('/')[1];
        if (!capability[type]) {
          capability[type] = [];
        }
        capability[type].push(text);
      });
    }
  }

  // Clearing the block's content
  block.innerHTML = '';

  const headerDiv = htmlToElement(`
    <div class="curated-cards-header">
      <div class="curated-cards-title">
          <h4>${headingElement?.textContent?.trim()}</h4>
          <div class="tooltip">
            <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement?.textContent?.trim()}</span>
          </div>
      </div>
      <div class="curated-cards-view">${linkTextElement?.outerHTML}</div>
    </div>
  `);
  // Appending header div to the block
  block.appendChild(headerDiv);

  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  const param = {
    contentType: contentType && contentType.split(','),
    product: capability[productKey],
    feature: capability[featureKey],
    role: role && role.split(','),
    level: level && level.split(','),
    sortCriteria,
    noOfResults,
  };

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent
    .then((data) => {
      if (data?.length) {
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('curated-cards-content');

        for (let i = 0; i < Math.min(noOfResults, data.length); i += 1) {
          const cardData = data[i];
          const cardDiv = document.createElement('div');
          buildCard(cardDiv, cardData);
          contentDiv.appendChild(cardDiv);
        }

        block.appendChild(contentDiv);
        decorateIcons(block);
      }
    })
    .catch((err) => {
      /* eslint-disable-next-line no-console */
      console.log('Curated Cards:', err);
    });
}
