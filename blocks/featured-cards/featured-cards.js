import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, loadIms } from '../../scripts/scripts.js';
import buildCard from '../../scripts/browse-card/browse-card.js';
import buildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const descriptionElement = block.querySelector('div:nth-child(2) > div');
  const contentType = block.querySelector('div:nth-child(3) > div')?.textContent?.trim()?.toLowerCase();
  const linkTextElement = block.querySelector('div:nth-child(3) > div > a');
  const role = '';
  const product = '';
  const sortCriteria = "RELEVANCE";
  const noOfResults = 10;


  // Clearing the block's content
  block.innerHTML = '';
  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
          <h4>${headingElement?.textContent?.trim()}</h4>
      </div>
      <div class="browse-card-description-text">
          <p>${descriptionElement?.textContent?.trim()}</p>
      </div>
      <div class="browse-cards-block-view">${linkTextElement?.outerHTML}</div>
    </div>
  `);
  // Appending header div to the block
  block.appendChild(headerDiv);
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  const param = {
    contentType: contentType && contentType.split(','),
    product: product && product.split(','),
    role: role && role.split(','),
    sortCriteria,
    noOfResults,
  };

  block.innerHTML += buildPlaceholder;
  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent
    .then((data) => {
      block.querySelectorAll('.shimmer-placeholder').forEach((el) => {
        el.remove();
      });
      if (data?.length) {
        for (let i = 0; i < Math.min(noOfResults, data.length); i += 1) {
          const cardData = data[i];
          const cardDiv = document.createElement('div');
          buildCard(cardDiv, cardData);
          contentDiv.appendChild(cardDiv);
        }
        block.appendChild(contentDiv);
        decorateIcons(contentDiv);
      }
    })
    .catch((err) => {
      block.querySelectorAll('.shimmer-placeholder').forEach((el) => {
        el.remove();
      });
      /* eslint-disable-next-line no-console */
      console.error(err);
    });
}