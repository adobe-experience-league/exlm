import { createTag } from '../scripts.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';

const VIDEO_URL_PATTERN = /^https:\/\/video\.tv\.adobe\.com\/v\/\d+/;

function cleanVideoUrl(videoUrl) {
  return (videoUrl || '').split('?')[0];
}

function isValidVideoUrl(videoUrl) {
  return VIDEO_URL_PATTERN.test(cleanVideoUrl(videoUrl));
}

/** POC: always-muted autoplay for Events Search inline previews. */
function getMutedAutoplayEmbedUrl(videoUrl) {
  try {
    const url = new URL(cleanVideoUrl(videoUrl));
    url.searchParams.set('autoplay', 'true');
    url.searchParams.set('muted', 'true');
    url.searchParams.set('mute', 'true');
    url.searchParams.set('volume', '0');
    if (!url.searchParams.has('learn')) {
      url.searchParams.set('learn', 'on');
    }
    return url.toString();
  } catch (e) {
    return videoUrl;
  }
}

function appendMutedVideoEmbed(cardFigure, videoUrl, title) {
  cardFigure.classList.add('has-video-embed');
  cardFigure.appendChild(
    createTag('iframe', {
      class: 'event-video-embed',
      src: getMutedAutoplayEmbedUrl(videoUrl),
      title: title ? `Video: ${title}` : 'Event video',
      loading: 'lazy',
      allow: 'autoplay; encrypted-media; fullscreen',
      allowfullscreen: '',
    }),
  );
}

/**
 * Decorates on-demand event cards with additional features
 * @param {HTMLElement} card - The card element to decorate
 * @param {Object} model - The data model for the card
 */
export const decorateOnDemandEvents = (card, model) => {
  const contentTypeLower = model.contentType?.toLowerCase();
  if (!card || !model || contentTypeLower !== CONTENT_TYPES.ON_DEMAND_EVENT.MAPPING_KEY.toLowerCase()) return;

  if (card.closest('.recommendation-marquee')) return;

  const { event, videoUrl = '', title = '' } = model;
  const cardFigure = card.querySelector('.browse-card-figure');
  if (!cardFigure) return;

  const isEventsSearch = !!card.closest('.events-search');
  const hasValidVideo = isValidVideoUrl(videoUrl);
  const hasSeries = event?.series;

  cardFigure.querySelector('.laptop-container')?.remove();
  cardFigure.querySelector('.event-video-embed')?.remove();
  cardFigure.classList.remove('has-video-embed', 'has-fallback-image');

  const img = cardFigure.querySelector('img');
  img?.remove();

  cardFigure.querySelector('.play-button')?.remove();

  cardFigure.querySelector('.event-series-banner')?.remove();

  if (hasValidVideo && isEventsSearch) {
    appendMutedVideoEmbed(cardFigure, videoUrl, title);
  } else if (!hasSeries) {
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

  const seriesText = event?.series;
  if (seriesText) {
    const banner = createTag('div', { class: 'event-series-banner' }, seriesText);
    cardFigure.appendChild(banner);
  }
};

export default decorateOnDemandEvents;
