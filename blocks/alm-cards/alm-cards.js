import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';

/**
 * Decorate function to process and log the mapped data for ALM cards.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const [headingElement, linkElement, contentTypeElement] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  // Get content type from authoring, default to alm-course if not specified or invalid
  let contentType = contentTypeElement?.textContent?.trim()?.toLowerCase() || 'alm-course';
  
  // Handle different content type options
  // - 'alm-course': Only courses
  // - 'alm-cohort': Only cohorts (learning programs)
  // - 'both': Both courses and cohorts
  if (contentType === 'both') {
    contentType = ['alm-course', 'alm-cohort']; // Pass as array for both types
  } else if (contentType !== 'alm-cohort' && contentType !== 'alm-course') {
    contentType = 'alm-course'; // Default to alm-course if invalid
  }

  const sortCriteria = COVEO_SORT_OPTIONS.RELEVANCE;
  const noOfResults = 4;

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
        ${headingElement.innerHTML}
      </div>
      <div class="browse-cards-block-view">${linkElement.innerHTML}</div>
    </div>
  `);

  // Appending header div to the block
  block.appendChild(headerDiv);

  const param = {
    contentType: contentType, // Can be string ('alm-course' or 'alm-cohort') or array (['alm-course', 'alm-cohort'])
    sortCriteria,
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
