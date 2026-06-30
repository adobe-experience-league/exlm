import { createTag } from '../scripts.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';
import { decorateIcons } from '../lib-franklin.js';

/**
 * Decorates on-demand event cards with additional features
 * @param {HTMLElement} card - The card element to decorate
 * @param {Object} model - The data model for the card
 */
export const decorateOnDemandEvents = (card, model) => {
  const contentTypeLower = model.contentType?.toLowerCase();
  if (!card || !model || contentTypeLower !== CONTENT_TYPES.ON_DEMAND_EVENT.MAPPING_KEY.toLowerCase()) return;

  if (card.closest('.recommendation-marquee')) return;

  const { event, thumbnail } = model;
  const cardFigure = card.querySelector('.browse-card-figure');
  if (!cardFigure) return;

  // Case 1: thumbnail available
  if (thumbnail) {
    const img = cardFigure.querySelector('img');
    const ensurePlayButton = () => {
      if (cardFigure.querySelector('.play-button')) return;
      const playButton = createTag('div', { class: 'play-button' });
      playButton.innerHTML = '<span class="icon icon-play-outline-white"></span>';
      cardFigure.appendChild(playButton);
      decorateIcons(playButton);
    };
    if (img?.complete) ensurePlayButton();
    else img?.addEventListener('load', ensurePlayButton);
    return;
  }

  cardFigure.querySelector('.laptop-container')?.remove();
  cardFigure.querySelector('.play-button')?.remove();
  cardFigure.querySelector('.event-series-banner')?.remove();
  cardFigure.querySelector('img')?.remove();

  const hasSeries = event?.series;

  if (hasSeries) {
    // Case 2: series title available — show series banner
    cardFigure.appendChild(createTag('div', { class: 'event-series-banner' }, hasSeries));
  } else {
    // Case 3: no series title — show fallback Adobe A image
    cardFigure.classList.add('has-fallback-image');
    const fallbackImg = document.createElement('img');
    fallbackImg.loading = 'lazy';
    fallbackImg.alt = '';
    fallbackImg.src = '/images/Event-Thumbnail-A-Light.jpg';
    if (fallbackImg.complete) {
      fallbackImg.classList.add('img-loaded');
    } else {
      fallbackImg.addEventListener('load', () => fallbackImg.classList.add('img-loaded'));
      fallbackImg.addEventListener('error', () => fallbackImg.classList.add('img-loaded'));
    }
    cardFigure.appendChild(fallbackImg);
  }
};

export default decorateOnDemandEvents;
