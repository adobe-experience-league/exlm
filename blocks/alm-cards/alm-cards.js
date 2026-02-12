import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

/**
 * Decorate function to process and log the mapped data for ALM cards.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block in authoring order
  const [headingElement, ctaElement, contentTypeElement] = [...block.children];

  let contentType = contentTypeElement?.textContent?.trim()?.toLowerCase() || 'alm-course';
  if (contentType === 'both') {
    contentType = ['alm-course', 'alm-cohort']; // Pass as array for both types
  }
  const noOfResults = 4;

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'alm-cards-block');

  // Create header section with heading and CTA
  const headerDiv = document.createElement('div');
  headerDiv.className = 'alm-cards-block-header';
  headerDiv.innerHTML = `
    <div class="alm-cards-block-title">
      ${headingElement?.innerHTML || ''}
    </div>
    <div class="alm-cards-block-cta">
      ${decorateCustomButtons(ctaElement)}
    </div>
  `;
  block.appendChild(headerDiv);

  const param = {
    contentType: contentType, // Can be string ('alm-course' or 'alm-cohort') or array (['alm-course', 'alm-cohort'])

    noOfResults,
  };

  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(block);

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent
    .then((data) => {
      buildCardsShimmer.removeShimmer();
      if (data?.length) {
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('browse-cards-block-content');

        for (let i = 0; i < Math.min(noOfResults, data.length); i += 1) {
          const cardData = data[i];
          const cardDiv = document.createElement('div');
          buildCard(cardDiv, cardData);
          contentDiv.appendChild(cardDiv);
        }
        block.appendChild(contentDiv);
      }
    })
    .catch((err) => {
      buildCardsShimmer.removeShimmer();
      /* eslint-disable-next-line no-console */
      console.error(err);
    });
}
