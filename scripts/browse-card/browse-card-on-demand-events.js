import { createTag } from '../scripts.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';
import { decorateIcons } from '../lib-franklin.js';

/**
 * Formats Coveo `date` (unix seconds/ms or parseable string) as "JUL 14, 2026".
 * Date-only (no time). Uses UTC so the calendar day matches the sort field.
 * @param {number|string} dateValue
 * @returns {string|null}
 */
export const formatOnDemandEventDate = (dateValue) => {
  if (dateValue == null || dateValue === '') return null;

  let date;
  if (typeof dateValue === 'number' || (typeof dateValue === 'string' && /^\d+(\.\d+)?$/.test(dateValue))) {
    const numeric = Number(dateValue);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    date = new Date(numeric < 1e11 ? numeric * 1000 : numeric);
  } else {
    const raw = String(dateValue).trim();
    const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
    // Naive ISO date/datetime has no zone; parse as UTC so the calendar day matches sort.
    if (!hasOffset && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const iso = raw.includes('T') ? raw : raw.replace(' ', 'T');
      date = new Date(`${iso}Z`);
    } else {
      date = new Date(raw);
    }
  }

  if (Number.isNaN(date.getTime())) return null;

  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .toUpperCase();
};

/**
 * Inserts date-only event info after the title, matching Upcoming card placement.
 * @param {HTMLElement} card
 * @param {Object} model
 */
const addOnDemandEventDate = (card, model) => {
  if (card.querySelector('.browse-card-event-info')) return;

  const formattedDate = formatOnDemandEventDate(model?.event?.date);
  if (!formattedDate) return;

  const cardContent = card.querySelector('.browse-card-content');
  const title = card.querySelector('.browse-card-title-text');
  if (!cardContent || !title) return;

  const eventInfo = createTag('div', { class: 'browse-card-event-info' });
  eventInfo.append(
    createTag('span', { class: 'icon icon-calendar' }),
    createTag('div', { class: 'browse-card-event-time' }, createTag('h6', {}, formattedDate)),
  );
  decorateIcons(eventInfo);
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

  addOnDemandEventDate(card, model);

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
