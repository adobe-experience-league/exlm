/* eslint-disable camelcase, no-unused-vars */
import { decorateIcons } from '../lib-franklin.js';
import { createTag, htmlToElement } from '../scripts.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';

/* TODO - Remove duration during cleanup */

/**
 * Builds event content specifically for on-demand events
 * @param {Object} params - Parameters for building event content
 * @param {Object} params.event - Event data
 * @param {HTMLElement} params.cardContent - Card content element
 * @param {HTMLElement} params.card - Card element
 */
const buildOnDemandEventContent = ({ event, cardContent, card }) => {
  const { duration } = event || {};
  const durationText = duration || '';
  if (!durationText) return;

  const eventInfo = htmlToElement(`
    <div class="browse-card-event-info">
        <span class="icon icon-time"></span>
        <div class="browse-card-event-time">
            <h6>${durationText}</h6>
        </div>
    </div>
  `);
  decorateIcons(eventInfo);
  const title = card.querySelector('.browse-card-title-text');
  cardContent.insertBefore(eventInfo, title.nextElementSibling);
};

/**
 * Decorates on-demand event cards with additional features
 * @param {HTMLElement} card - The card element to decorate
 * @param {Object} model - The data model for the card
 */
export const decorateOnDemandEvents = (card, model) => {
  const contentTypeLower = model.contentType?.toLowerCase();
  if (!card || !model || contentTypeLower !== CONTENT_TYPES.ON_DEMAND_EVENT.MAPPING_KEY.toLowerCase()) return;

  if (card.closest('.recommendation-marquee')) return;

  const { event } = model;
  const cardFigure = card.querySelector('.browse-card-figure');
  if (!cardFigure) return;

  const cardContent = card.querySelector('.browse-card-content');

  cardFigure.querySelector('.laptop-container')?.remove();
  const img = cardFigure.querySelector('img');
  const hasSeries = event?.series;

  img?.remove();

  cardFigure.querySelector('.play-button')?.remove();

  img?.addEventListener('load', () => {
    cardFigure.querySelector('.play-button')?.remove();
  });

  cardFigure.querySelector('.event-series-banner')?.remove();

  // If no series title, show fallback Adobe A image (light themed)
  if (!hasSeries) {
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

  if (event?.duration) {
    buildOnDemandEventContent({
      event,
      cardContent,
      card,
    });
  }

  const seriesText = event?.series;
  if (seriesText) {
    const banner = createTag('div', { class: 'event-series-banner' }, seriesText);
    cardFigure.appendChild(banner);
  }
};

export default decorateOnDemandEvents;
