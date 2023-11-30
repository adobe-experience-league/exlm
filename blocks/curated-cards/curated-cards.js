// FIXME: This is a dummy component put up to show case the cards rendered via API
import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import buildCard from '../../scripts/browse-card/browse-card.js';
import { htmlToElement, loadJWT, loadIms } from '../../scripts/scripts.js';
import loadCoveoToken from '../../scripts/data-service/coveo/coveo-token-service.js';
import { JWT, COVEO_TOKEN } from '../../scripts/auth/session-keys.js';

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div > a');
  const contentType = block.querySelector('div:nth-child(4) > div')?.textContent.trim();
  const noOfResults = 4;

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
    let adobeIMS = { isSignedInUser: () => false };

    try {
      const ims = await loadIms();
      adobeIMS = ims.adobeIMS;
    } catch {
      // eslint-disable-next-line no-console
      console.warn('Adobe IMS not available.');
    }

    const isSignedIn = adobeIMS?.isSignedInUser();

    if (isSignedIn) {
      if (!sessionStorage[JWT]) {
        sessionStorage.removeItem(COVEO_TOKEN);
        await loadJWT();
      }
      if (!sessionStorage[COVEO_TOKEN]) {
        await loadCoveoToken();
      }
    } else {
      const isCoveoAvailable = !sessionStorage[COVEO_TOKEN];
      if (isCoveoAvailable) {
        await loadCoveoToken();
      }
    }

    const param = {
      contentType,
      noOfResults,
    };

    const browseCardsContent = await BrowseCardsDelegate.fetchCardData(param);

    if (browseCardsContent?.length) {
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('curated-cards-content');

      for (let i = 0; i < Math.min(noOfResults, browseCardsContent.length); i += 1) {
        const cardData = browseCardsContent[i];
        const cardDiv = document.createElement('div');
        buildCard(cardDiv, cardData);
        contentDiv.appendChild(cardDiv);
      }

      block.appendChild(contentDiv);
    }

    decorateIcons(block);
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Error occured');
  }
}
