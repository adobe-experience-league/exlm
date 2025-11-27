import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import BrowseCardViewSwitcher from '../../scripts/browse-card/browse-cards-view-switcher.js';

export default async function decorate(block) {
  const [headingElement, descriptionElement] = [...block.children].map((row) => row.firstElementChild);

  // Clear the block content
  block.innerHTML = '';
  block.classList.add('upcoming-event-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
        ${headingElement?.innerHTML || ''}
      </div>
      <div class="browse-card-description-text">
        ${descriptionElement?.innerHTML || ''}
      </div>
    </div>
  `);

  block.appendChild(headerDiv);

  // Create and initialize the view switcher
  BrowseCardViewSwitcher.create({ block }).then((viewSwitcher) => {
    viewSwitcher.appendTo(headerDiv);
  });

  // Create content div for cards
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  // Fetch upcoming events data from Coveo
  const parameters = {
    contentType: [CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY],
    sortCriteria: 'date ascending',
  };

  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(block);

  try {
    // Fetch upcoming events data from Coveo
    const browseCardsContent = await BrowseCardsDelegate.fetchCardData(parameters);
    buildCardsShimmer.removeShimmer();

    if (browseCardsContent?.length) {
      browseCardsContent.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        buildCard(contentDiv, cardDiv, cardData);
        contentDiv.appendChild(cardDiv);
      });
      block.appendChild(contentDiv);
    }
  } catch (err) {
    buildCardsShimmer.removeShimmer();
    // eslint-disable-next-line no-console
    console.error('Error loading upcoming event cards:', err);
    // Exit early if there's an error
  }
}
