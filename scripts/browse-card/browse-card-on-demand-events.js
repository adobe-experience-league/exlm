/* eslint-disable camelcase, no-unused-vars */
import { decorateIcons, loadCSS } from '../lib-franklin.js';
import { createTag, htmlToElement } from '../scripts.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';

/* TODO - Remove duration and event series placeholder during cleanup */

/**
 * Format date for on-demand events display
 * @param {string} dateString - Date string to format
 * @returns {string|null} - Formatted date string or null
 */
const formatOnDemandEventDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const optionsDate = { month: 'short', day: '2-digit', year: 'numeric' };
  const formattedDate = date.toLocaleDateString(undefined, optionsDate).toUpperCase();

  return formattedDate;
};

/**
 * Builds event content specifically for on-demand events
 * @param {Object} params - Parameters for building event content
 * @param {Object} params.event - Event data
 * @param {string} params.contentType - Content type
 * @param {HTMLElement} params.cardContent - Card content element
 * @param {HTMLElement} params.card - Card element
 */
const buildOnDemandEventContent = ({ event, cardContent, card }) => {
  const { time, duration } = event || {};
  const durationText = duration || '';
  const formattedDateTime = formatOnDemandEventDate(time);

  const eventInfo = htmlToElement(`
    <div class="browse-card-event-info">
        <span class="icon icon-time"></span>
        <div class="browse-card-event-time">
            <h6>${formattedDateTime} | ${durationText}</h6>
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
  if (!card || !model || model.contentType?.toLowerCase() !== CONTENT_TYPES.EVENT.MAPPING_KEY) return;

  if (card.closest('.recommendation-marquee')) return;

  loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-on-demand-events.css`);

  const { event } = model;
  const cardFigure = card.querySelector('.browse-card-figure');
  if (!cardFigure) return;

  const cardContent = card.querySelector('.browse-card-content');

  cardFigure.querySelector('.laptop-container')?.remove();
  const img = cardFigure.querySelector('img');
  img?.remove();

  cardFigure.querySelector('.play-button')?.remove();

  img?.addEventListener('load', () => {
    cardFigure.querySelector('.play-button')?.remove();
  });

  cardFigure.querySelector('.event-series-banner')?.remove();

  if (event?.time) {
    buildOnDemandEventContent({
      event,
      contentType: model.contentType,
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
