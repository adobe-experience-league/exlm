// FIXME: This is a dummy component put up to show case the cards rendered via API
import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, loadIms } from '../../scripts/scripts.js';
import buildCard from '../../scripts/browse-card/browse-card.js';
/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div > a');
  const contentType = "course,tutorial,documentation,troubleshooting"; // block.querySelector('div:nth-child(4) > div')?.textContent.trim();
  const product = 'Experience Manager,Campaign';
  const feature = undefined; //'Analytics Basics,Analytics';
  const role = 'Admin,User';
  const noOfResults = 500;
  const multipleTypes = true;

  // Clearing the block's content
  block.innerHTML = '';

  const headerDiv = htmlToElement(`
    <div class="curated-cards-header">
      <div class="curated-cards-title">
          <h4>${headingElement?.textContent.trim()}</h4>
          <div class="tooltip">
            <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement?.textContent.trim()}</span>
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
    multipleTypes,
    contentType: contentType.split(','),
    product: product && product.split(','),
    feature: feature && feature.split(','),
    role: role.split(','),
    noOfResults,
  };

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent.then((data) => {
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
  });
}
