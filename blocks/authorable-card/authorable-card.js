// FIXME: This is a dummy component put up to show case the cards rendered via API
import { decorateIcons } from '../../scripts/lib-franklin.js';
// import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, loadIms } from '../../scripts/scripts.js';
// import buildCard from '../../scripts/browse-card/browse-card.js';
import fetchArticleByURL from '../../scripts/data-service/article-data-service.js';
/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div > a');
  const links = [];
  links.push(block.querySelector('div:nth-child(4) > div').textContent);
  links.push(block.querySelector('div:nth-child(5) > div').textContent);
  links.push(block.querySelector('div:nth-child(6) > div').textContent);

  // Clearing the block's content
  block.innerHTML = '';

  const headerDiv = htmlToElement(`
    <div class="authorable-card-header">
      <div class="authorable-card-title">
          <h4>${headingElement?.textContent.trim()}</h4>
          <div class="tooltip">
            <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement?.textContent.trim()}</span>
          </div>
      </div>
      <div class="authorable-card-view">${linkTextElement?.outerHTML}</div>
    </div>
  `);
  // Appending header div to the block
  block.appendChild(headerDiv);

  // Check what this is doing?
  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  // const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  // browseCardsContent.then((data) => {
  //   if (data?.length) {
  //     const contentDiv = document.createElement('div');
  //     contentDiv.classList.add('curated-cards-content');

  //     for (let i = 0; i < Math.min(noOfResults, data.length); i += 1) {
  //       const cardData = data[i];
  //       const cardDiv = document.createElement('div');
  //       buildCard(cardDiv, cardData);
  //       contentDiv.appendChild(cardDiv);
  //     }

  //     block.appendChild(contentDiv);
  //     decorateIcons(block);
  //   }
  // });

  decorateIcons(block);
  fetchArticleByURL(
    'https://experienceleague.adobe.com/docs/workfront-known-issues/issues/proof/workfrontproof.html?lang=en',
  );
}
