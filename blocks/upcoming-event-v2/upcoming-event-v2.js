import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import BrowseCardViewSwitcher from '../../scripts/browse-card/browse-cards-view-switcher.js';
import { loadCSS } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  const [headingElement, descriptionElement] = [...block.children].map((row) => row.firstElementChild);

  // Clear the block content
  block.innerHTML = '';
  block.classList.add('upcoming-event-block');
  block.classList.add('browse-cards-block');

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

  await loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-upcoming-events.css`);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(block);

  const parameters = {
    contentType: [CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY],
    sortCriteria: 'date ascending',
  };

  BrowseCardsDelegate.fetchCardData(parameters)
    .then((results) => {
      buildCardsShimmer.removeShimmer();

      if (!results?.length) return;

      results.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        buildCard(cardDiv, cardData);
        contentDiv.appendChild(cardDiv);
      });
      block.appendChild(contentDiv);
    })
    .catch((err) => {
      buildCardsShimmer.removeShimmer();
      // eslint-disable-next-line no-console
      console.error('Error loading upcoming event cards:', err);
    });
}
