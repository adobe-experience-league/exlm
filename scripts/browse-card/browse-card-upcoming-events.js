/* eslint-disable camelcase, no-unused-vars */
import { decorateIcons, loadCSS } from '../lib-franklin.js';
import { createTag } from '../scripts.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';

/**
 * Decorates upcoming event cards with additional features
 * @param {HTMLElement} card - The card element to decorate
 * @param {Object} model - The data model for the card
 */
export const decorateUpcomingEvents = (card, model) => {
  if (!card || !model || model.contentType?.toLowerCase() !== CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY) return;

  loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-upcoming-events.css`);

  // Remove the browse-card-options div from upcoming event cards
  const cardOptions = card.querySelector('.browse-card-options');
  if (cardOptions) {
    cardOptions.remove();
  }

  const cardFigure = card?.querySelector('.browse-card-figure');
  if (!cardFigure) return;

  const { event } = model;
  const hasSpeakers = event?.speakers?.name?.length > 0 && event?.speakers?.profilePictureURL?.length > 0;
  const hasSeries = event?.series;
  const seriesText = hasSeries ? event?.series : null;

  if (hasSpeakers) {
    let speakersContainer = cardFigure?.querySelector('.event-speakers-container');
    if (!speakersContainer) {
      speakersContainer = createTag('div', { class: 'event-speakers-container' });
      cardFigure.appendChild(speakersContainer);
    } else {
      speakersContainer.innerHTML = '';
    }

    const speakerNames = Array.isArray(event?.speakers?.name)
      ? event?.speakers?.name
      : event?.speakers?.name?.split(',')?.map((name) => name?.trim());

    const profilePictures = Array.isArray(event?.speakers?.profilePictureURL)
      ? event?.speakers?.profilePictureURL
      : event?.speakers?.profilePictureURL?.split(',')?.map((url) => url?.trim());

    const maxSpeakers = Math.min(speakerNames?.length || 0, profilePictures?.length || 0, 3);
    for (let i = 0; i < maxSpeakers; i += 1) {
      const speakerImgContainer = createTag('div', { class: 'speaker-profile-container' });
      const speakerImg = createTag('img', {
        src: profilePictures?.[i],
        alt: speakerNames?.[i],
        class: 'speaker-profile-image',
      });
      speakerImgContainer.appendChild(speakerImg);
      speakersContainer.appendChild(speakerImgContainer);
    }
  } else if (hasSeries) {
    const existingSpeakers = cardFigure?.querySelector('.event-speakers-container');
    if (existingSpeakers) {
      existingSpeakers.remove();
    }
  }

  if (seriesText) {
    const existingSeriesBanner = cardFigure?.querySelector('.event-series-banner, .event-series-banner-no-speakers');
    if (existingSeriesBanner) {
      existingSeriesBanner.remove();
    }

    const bannerClass = hasSpeakers ? 'event-series-banner' : 'event-series-banner event-series-banner-no-speakers';

    if (!cardFigure?.querySelector(`.${bannerClass.replace(' ', '.')}`)) {
      cardFigure.appendChild(createTag('div', { class: bannerClass }, seriesText));
    }
  }

  if (event?.type) {
    const locationType = event?.type;
    if (locationType && !cardFigure?.querySelector('.location-type')) {
      cardFigure.appendChild(createTag('div', { class: 'location-type' }, locationType));
    }
  }
};

export default decorateUpcomingEvents;
