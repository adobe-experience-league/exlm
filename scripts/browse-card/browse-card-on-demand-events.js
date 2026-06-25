import { createTag } from '../scripts.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';

const VIDEO_URL_PATTERN = /^https:\/\/video\.tv\.adobe\.com\/v\/\d+/;

function cleanVideoUrl(videoUrl) {
  return (videoUrl || '').split('?')[0];
}

function isValidVideoUrl(videoUrl) {
  return VIDEO_URL_PATTERN.test(cleanVideoUrl(videoUrl));
}

function getVideoPosterUrl(videoUrl) {
  return `${cleanVideoUrl(videoUrl)}?format=jpeg`;
}

/** POC: always muted autoplay — multiple embed params for Adobe TV player compatibility. */
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

function clearFigureMedia(cardFigure) {
  cardFigure.querySelector('.laptop-container')?.remove();
  cardFigure.querySelector('img')?.remove();
  cardFigure.querySelector('.play-button')?.remove();
  cardFigure.querySelector('.event-video-preview')?.remove();
  cardFigure.querySelector('.event-series-banner')?.remove();
  cardFigure.querySelector('.event-video-status')?.remove();
  cardFigure.classList.remove('has-fallback-image', 'has-video-preview', 'has-no-video-preview', 'img-custom-height');
}

function appendSeriesBanner(cardFigure, seriesText) {
  if (!seriesText) return;
  cardFigure.appendChild(createTag('div', { class: 'event-series-banner' }, seriesText));
}

function appendFallbackImage(cardFigure) {
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

function appendVideoStatusBadge(cardFigure) {
  cardFigure.appendChild(
    createTag('span', { class: 'event-video-status event-video-status-unavailable visually-hidden' }, 'Preview unavailable'),
  );
}

/** Events Search POC: poster under a always-muted autoplay iframe — no observer, no click-to-play. */
function buildEventsSearchVideo(card, cardFigure, model) {
  const { videoUrl, title } = model;
  card.dataset.videoUrl = videoUrl;
  card.classList.add('has-video-preview', 'has-events-search-autoplay');
  cardFigure.classList.add('has-video-preview');

  const preview = createTag('div', { class: 'event-video-preview is-playing' });
  const poster = createTag('img', {
    class: 'event-video-poster',
    loading: 'eager',
    alt: title ? `Video preview for ${title}` : 'Event video preview',
  });
  poster.src = getVideoPosterUrl(videoUrl);

  const iframe = createTag('iframe', {
    class: 'event-video-iframe',
    src: getMutedAutoplayEmbedUrl(videoUrl),
    title: title ? `Video: ${title}` : 'Event video',
    loading: 'lazy',
    allow: 'autoplay; encrypted-media; fullscreen',
    allowfullscreen: '',
  });

  preview.append(poster, iframe);
  cardFigure.appendChild(preview);
}

/** Non–Events Search: static poster thumbnail only (no inline player). */
function buildPosterThumbnail(card, cardFigure, model) {
  const { videoUrl, title } = model;
  card.dataset.videoUrl = videoUrl;
  card.classList.add('has-video-preview');
  cardFigure.classList.add('has-video-preview');

  const preview = createTag('div', { class: 'event-video-preview' });
  const poster = createTag('img', {
    class: 'event-video-poster',
    loading: 'lazy',
    alt: title ? `Video preview for ${title}` : 'Event video preview',
  });
  poster.src = getVideoPosterUrl(videoUrl);
  preview.appendChild(poster);
  cardFigure.appendChild(preview);
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

  const { event, videoUrl = '' } = model;
  const cardFigure = card.querySelector('.browse-card-figure');
  if (!cardFigure) return;

  const hasSeries = event?.series;
  const hasValidVideo = isValidVideoUrl(videoUrl);
  const isEventsSearch = !!card.closest('.events-search');

  clearFigureMedia(cardFigure);
  card.classList.remove('has-video-preview', 'has-events-search-autoplay', 'is-video-playing');
  delete card.dataset.videoUrl;

  if (hasValidVideo && isEventsSearch) {
    buildEventsSearchVideo(card, cardFigure, model);
  } else if (hasValidVideo) {
    buildPosterThumbnail(card, cardFigure, model);
  } else if (!hasSeries) {
    appendFallbackImage(cardFigure);
  }

  if (isEventsSearch && !hasValidVideo) {
    cardFigure.classList.add('has-no-video-preview');
    card.dataset.videoAvailable = 'false';
    appendVideoStatusBadge(cardFigure);
  } else if (hasValidVideo) {
    card.dataset.videoAvailable = 'true';
  }

  appendSeriesBanner(cardFigure, hasSeries ? event.series : '');
  if (hasSeries) {
    card.dataset.eventSeries = event.series;
  } else {
    delete card.dataset.eventSeries;
  }
};

export default decorateOnDemandEvents;
