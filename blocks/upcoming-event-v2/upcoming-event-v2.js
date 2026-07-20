import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ } from '../../scripts/browse-card/browse-cards-constants.js';
import BrowseCardViewSwitcher from '../../scripts/browse-card/browse-cards-view-switcher.js';
import { loadCSS } from '../../scripts/lib-franklin.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

/**
 * Hide the block (and its section if emptied) when there is nothing to show —
 * e.g. all Upcoming events were filtered out as stale.
 * @param {HTMLElement} block
 */
function hideUpcomingEventBlock(block) {
  const section = block.closest('.section');
  block.parentElement?.remove();
  if (section && section.children.length === 0) {
    section.remove();
  }
}

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
    if (document.contains(headerDiv)) {
      viewSwitcher.appendTo(headerDiv);
    }
  });

  await loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-upcoming-events.css`);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(block);

  const parameters = {
    contentType: [CONTENT_TYPES.UPCOMING_EVENT_V2.MAPPING_KEY],
    sortCriteria: 'date ascending',
    aq: COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ,
  };

  BrowseCardsDelegate.fetchCardData(parameters)
    .then((results) => {
      buildCardsShimmer.removeShimmer();

      if (!results?.length) {
        // All upcoming events are stale (or none exist): hide block on published site.
        // Keep the block visible in Universal Editor so authors can still see/edit it.
        if (!UEAuthorMode) {
          hideUpcomingEventBlock(block);
        }
        return;
      }

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
