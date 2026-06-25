import { createTag } from '../scripts.js';
import { decorateIcons } from '../lib-franklin.js';
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

function clearFigureMedia(cardFigure) {
  cardFigure.querySelector('.laptop-container')?.remove();
  cardFigure.querySelector('img')?.remove();
  cardFigure.querySelector('.play-button')?.remove();
  cardFigure.querySelector('.event-video-preview')?.remove();
  cardFigure.querySelector('.event-series-banner')?.remove();
  cardFigure.querySelector('.event-video-status')?.remove();
  cardFigure.classList.remove('has-fallback-image', 'has-video-preview', 'has-no-video-preview');
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

function buildVideoPreview(card, cardFigure, model) {
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

  const playButton = createTag(
    'button',
    {
      class: 'event-video-play',
      type: 'button',
      'aria-label': title ? `Play ${title}` : 'Play event video',
    },
    '<span class="icon icon-play-outline-white"></span>',
  );

  preview.append(poster, playButton);
  cardFigure.appendChild(preview);
  decorateIcons(playButton);

  if (card.closest('.events-search')) {
    const status = createTag('span', { class: 'event-video-status event-video-status-available' }, 'Video preview');
    cardFigure.appendChild(status);
  }

  const startPlayback = (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.querySelectorAll('.browse-card.event-on-demand-event-card.is-video-playing').forEach((otherCard) => {
      if (otherCard !== card) {
        // eslint-disable-next-line no-use-before-define -- paired with stopVideoPlayback below
        stopVideoPlayback(otherCard);
      }
    });

    card.classList.add('is-video-playing');
    preview.innerHTML = '';
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
      // eslint-disable-next-line no-use-before-define -- paired with stopVideoPlayback below
      stopVideoPlayback(card);
    });
    preview.appendChild(closeButton);
    decorateIcons(closeButton);
  };

  playButton.addEventListener('click', startPlayback);
  poster.addEventListener('click', startPlayback);
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
    const status = createTag(
      'span',
      { class: 'event-video-status event-video-status-unavailable' },
      'Preview unavailable',
    );
    cardFigure.appendChild(status);
  }

  appendSeriesBanner(cardFigure, seriesText);
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
  card.classList.remove('has-video-preview', 'is-video-playing');
  delete card.dataset.videoUrl;

  if (hasValidVideo) {
    buildVideoPreview(card, cardFigure, model);
  } else if (!hasSeries) {
    appendFallbackImage(cardFigure);
  }

  if (isEventsSearch && !hasValidVideo) {
    cardFigure.classList.add('has-no-video-preview');
    card.dataset.videoAvailable = 'false';
    const status = createTag(
      'span',
      { class: 'event-video-status event-video-status-unavailable' },
      'Preview unavailable',
    );
    cardFigure.appendChild(status);
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
          if (!entry.isIntersecting) {
            stopVideoPlayback(card);
          }
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(card);
  }
};

export default decorateOnDemandEvents;
