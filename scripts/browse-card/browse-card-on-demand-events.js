import { createTag } from '../scripts.js';
import { decorateIcons } from '../lib-franklin.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';

const VIDEO_URL_PATTERN = /^https:\/\/video\.tv\.adobe\.com\/v\/\d+/;
const AUTOPLAY_VISIBILITY_THRESHOLD = 0.45;

/** @type {Map<HTMLElement, number>} */
const autoplayCandidates = new Map();
let autoplayUpdateScheduled = false;

function cleanVideoUrl(videoUrl) {
  return (videoUrl || '').split('?')[0];
}

function isValidVideoUrl(videoUrl) {
  return VIDEO_URL_PATTERN.test(cleanVideoUrl(videoUrl));
}

function getVideoPosterUrl(videoUrl) {
  return `${cleanVideoUrl(videoUrl)}?format=jpeg`;
}

function getVideoEmbedUrl(videoUrl) {
  try {
    const url = new URL(videoUrl);
    url.searchParams.set('autoplay', 'true');
    if (!url.searchParams.has('learn')) {
      url.searchParams.set('learn', 'on');
    }
    return url.toString();
  } catch (e) {
    return videoUrl;
  }
}

function isAutoplayEnabled() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const banner = createTag('div', { class: 'event-series-banner' }, seriesText);
  cardFigure.appendChild(banner);
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

function appendVideoStatusBadge(cardFigure, isEventsSearch, available) {
  if (!isEventsSearch || available) return;
  cardFigure.appendChild(
    createTag('span', { class: 'event-video-status event-video-status-unavailable visually-hidden' }, 'Preview unavailable'),
  );
}

function buildVideoPreview(card, cardFigure, model) {
  const { videoUrl, title } = model;
  card.dataset.videoUrl = videoUrl;
  card.classList.add('has-video-preview');
  cardFigure.classList.add('has-video-preview');

  const preview = createTag('div', { class: 'event-video-preview' });
  const scrim = createTag('div', { class: 'event-video-scrim', 'aria-hidden': 'true' });
  const poster = createTag('img', {
    class: 'event-video-poster',
    loading: 'lazy',
    alt: title ? `Video preview for ${title}` : 'Event video preview',
  });
  poster.src = getVideoPosterUrl(videoUrl);

  const playButton = createTag(
    'button',
    {
      class: 'event-video-play',
      type: 'button',
      'aria-label': title ? `Play ${title}` : 'Play event video',
    },
    '<span class="icon icon-play"></span>',
  );

  preview.append(poster, scrim, playButton);
  cardFigure.appendChild(preview);
  decorateIcons(playButton);

  const handlePlayRequest = (event) => {
    event.preventDefault();
    event.stopPropagation();
    // eslint-disable-next-line no-use-before-define -- paired with startVideoPlayback below
    startVideoPlayback(card, { userInitiated: true });
  };

  playButton.addEventListener('click', handlePlayRequest);
  poster.addEventListener('click', handlePlayRequest);
}

function stopVideoPlayback(card) {
  if (!card?.classList.contains('is-video-playing')) return;
  const cardFigure = card.querySelector('.browse-card-figure');
  const { videoUrl } = card.dataset;
  const title = card.querySelector('.browse-card-title-text')?.textContent?.trim() || '';
  const seriesText = card.dataset.eventSeries || '';
  const isEventsSearch = !!card.closest('.events-search');
  const hasValidVideo = isValidVideoUrl(videoUrl);

  card.classList.remove('is-video-playing');
  if (!cardFigure) return;

  clearFigureMedia(cardFigure);

  if (hasValidVideo) {
    buildVideoPreview(card, cardFigure, { videoUrl, title });
  } else if (!seriesText) {
    appendFallbackImage(cardFigure);
  }

  if (isEventsSearch && !hasValidVideo) {
    cardFigure.classList.add('has-no-video-preview');
    appendVideoStatusBadge(cardFigure, true, false);
  }

  appendSeriesBanner(cardFigure, seriesText);
}

function startVideoPlayback(card, { userInitiated = false } = {}) {
  if (!card || card.classList.contains('is-video-playing')) return;

  const { videoUrl } = card.dataset;
  if (!isValidVideoUrl(videoUrl)) return;

  if (userInitiated) {
    delete card.dataset.videoManualStop;
  }

  document.querySelectorAll('.browse-card.event-on-demand-event-card.is-video-playing').forEach((otherCard) => {
    if (otherCard !== card) {
      stopVideoPlayback(otherCard);
    }
  });

  const preview = card.querySelector('.event-video-preview');
  if (!preview) return;

  const title = card.querySelector('.browse-card-title-text')?.textContent?.trim() || '';
  card.classList.add('is-video-playing');
  preview.innerHTML = '';
  preview.classList.add('is-playing');

  const iframe = createTag('iframe', {
    class: 'event-video-iframe',
    src: getVideoEmbedUrl(videoUrl),
    title: title ? `Video: ${title}` : 'Event video',
    loading: 'lazy',
    allow: 'autoplay; encrypted-media; fullscreen',
    allowfullscreen: '',
  });
  preview.appendChild(iframe);

  const closeButton = createTag(
    'button',
    {
      class: 'event-video-close',
      type: 'button',
      'aria-label': 'Close video preview',
    },
    '<span class="icon icon-close-light"></span>',
  );
  closeButton.addEventListener('click', (closeEvent) => {
    closeEvent.preventDefault();
    closeEvent.stopPropagation();
    card.dataset.videoManualStop = 'true';
    stopVideoPlayback(card);
    // eslint-disable-next-line no-use-before-define -- paired with scheduleAutoplayUpdate below
    scheduleAutoplayUpdate();
  });
  preview.appendChild(closeButton);
  decorateIcons(closeButton);
}

function updateAutoplayCandidate() {
  if (!isAutoplayEnabled()) return;

  let bestCard = null;
  let bestRatio = AUTOPLAY_VISIBILITY_THRESHOLD;

  autoplayCandidates.forEach((ratio, card) => {
    if (card.dataset.videoManualStop === 'true') return;
    if (!isValidVideoUrl(card.dataset.videoUrl)) return;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestCard = card;
    }
  });

  document.querySelectorAll('.browse-card.event-on-demand-event-card.is-video-playing').forEach((playingCard) => {
    if (playingCard !== bestCard) {
      stopVideoPlayback(playingCard);
    }
  });

  if (bestCard && !bestCard.classList.contains('is-video-playing')) {
    startVideoPlayback(bestCard);
  }
}

function scheduleAutoplayUpdate() {
  if (!isAutoplayEnabled() || autoplayUpdateScheduled) return;
  autoplayUpdateScheduled = true;
  requestAnimationFrame(() => {
    autoplayUpdateScheduled = false;
    updateAutoplayCandidate();
  });
}

export { stopVideoPlayback };

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
  card.classList.remove('has-video-preview', 'is-video-playing', 'thumbnail-loaded', 'thumbnail-not-loaded');
  delete card.dataset.videoUrl;
  delete card.dataset.videoManualStop;

  if (hasValidVideo) {
    buildVideoPreview(card, cardFigure, model);
  } else if (!hasSeries) {
    appendFallbackImage(cardFigure);
  }

  if (isEventsSearch && !hasValidVideo) {
    cardFigure.classList.add('has-no-video-preview');
    card.dataset.videoAvailable = 'false';
    appendVideoStatusBadge(cardFigure, true, false);
  } else if (hasValidVideo) {
    card.dataset.videoAvailable = 'true';
  }

  appendSeriesBanner(cardFigure, hasSeries ? event.series : '');
  if (hasSeries) {
    card.dataset.eventSeries = event.series;
  } else {
    delete card.dataset.eventSeries;
  }

  if (hasValidVideo && !card.dataset.videoObserverAttached) {
    card.dataset.videoObserverAttached = 'true';
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const ratio = entry.intersectionRatio;
          if (entry.isIntersecting && ratio >= AUTOPLAY_VISIBILITY_THRESHOLD) {
            autoplayCandidates.set(card, ratio);
          } else {
            autoplayCandidates.delete(card);
            if (card.classList.contains('is-video-playing')) {
              stopVideoPlayback(card);
            }
          }
          scheduleAutoplayUpdate();
        });
      },
      { threshold: [0, 0.25, 0.45, 0.6, 0.75, 1] },
    );
    observer.observe(card);
    scheduleAutoplayUpdate();
  }
};

export default decorateOnDemandEvents;
