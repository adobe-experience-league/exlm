import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ } from '../../scripts/browse-card/browse-cards-constants.js';
import BrowseCardViewSwitcher from '../../scripts/browse-card/browse-cards-view-switcher.js';
import { loadCSS } from '../../scripts/lib-franklin.js';

/**
 * Empty-state markup used by Upcoming Event v1/v2 (see upcoming-event.js + upcoming-event-v2.css).
 * Placeholder key: upcoming-event-no-results-text (must be authored in placeholders).
 * @param {HTMLElement} contentDiv
 * @param {Record<string, string>} placeholders
 */
function showNoResultsContent(contentDiv, placeholders = {}) {
  const noResultsText = placeholders.upcomingEventNoResultsText || 'Sorry, no results were found.';
  contentDiv.appendChild(htmlToElement(`<div class="event-no-results">${noResultsText}</div>`));
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

  const placeholdersPromise = fetchLanguagePlaceholders().catch(() => ({}));

  try {
    const results = await BrowseCardsDelegate.fetchCardData(parameters);
    buildCardsShimmer.removeShimmer();
    block.appendChild(contentDiv);

    if (!results?.length) {
      const placeholders = await placeholdersPromise;
      block.classList.add('has-no-results');
      showNoResultsContent(contentDiv, placeholders);
      return;
    }

    // Only mount grid/list toggle when there are cards to switch.
    BrowseCardViewSwitcher.create({ block }).then((viewSwitcher) => {
      if (document.contains(headerDiv)) {
        viewSwitcher.appendTo(headerDiv);
      }
    });

    results.forEach((cardData) => {
      const cardDiv = document.createElement('div');
      buildCard(cardDiv, cardData);
      contentDiv.appendChild(cardDiv);
    });
  } catch (err) {
    buildCardsShimmer.removeShimmer();
    // eslint-disable-next-line no-console
    console.error('Error loading upcoming event cards:', err);
  }
}
