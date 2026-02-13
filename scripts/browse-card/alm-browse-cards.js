/* eslint-disable camelcase, no-unused-vars */
import { loadCSS } from '../lib-franklin.js';
import { fetchLanguagePlaceholders } from '../scripts.js';
import { sendCoveoClickEvent } from '../coveo-analytics.js';
import { pushBrowseCardClickEvent } from '../analytics/lib-analytics.js';
import UserActions from '../user-actions/user-actions.js';

/**
 * @fileoverview ALM (Adobe Learning Manager) specific browse card implementation
 * Handles rendering of ALM courses and cohorts with specialized UI components
 */

/* Cached placeholders for localization */
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * Normalizes URLs to lowercase for same-origin links
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 * @private
 */
function lowerCaseSameOriginUrls(url) {
  if (!url) return url;

  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin === window.location.origin 
      ? urlObj.toString().toLowerCase() 
      : url;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error parsing URL:', e);
    return url;
  }
}

/**
 * Extracts card header and position for analytics tracking
 * @param {HTMLElement} card - Card element
 * @param {HTMLElement} element - Container element
 * @returns {{cardHeader: string, cardPosition: string}} Tracking information
 * @private
 */
function getCardHeaderAndPosition(card, element) {
  const currentBlock = card.closest('.block');
  
  // Extract header text
  const headerEl = currentBlock?.querySelector(
    '.browse-cards-block-title, .rec-block-header, .inprogress-courses-header-wrapper',
  );
  
  let cardHeader = '';
  if (headerEl) {
    const cloned = headerEl.cloneNode(true);
    cloned.querySelectorAll('[data-cs-mask]').forEach((el) => el.remove());
    cardHeader = cloned.innerText.trim();
  }
  cardHeader = cardHeader || currentBlock?.getAttribute('data-block-name')?.trim() || '';

  // Calculate position
  let cardPosition = '';
  if (element?.parentElement?.children) {
    const siblings = Array.from(element.parentElement.children);
    cardPosition = String(siblings.indexOf(element) + 1);
  }

  return { cardHeader, cardPosition };
}

/**
 * Gets bookmark ID from either the id field or viewLink pathname
 * @param {string} id - Content ID
 * @param {string} viewLink - View link URL
 * @returns {string} Bookmark identifier
 * @private
 */
function getBookmarkId(id, viewLink) {
  if (id) return id;
  try {
    return viewLink ? new URL(viewLink).pathname : '';
  } catch {
    return '';
  }
}

/**
 * Builds thumbnail container with image and user actions overlay
 * @param {Object} params - Thumbnail parameters
 * @returns {HTMLElement} Thumbnail figure element
 * @private
 */
function buildALMThumbnail({ thumbnail, title, id, viewLink, copyLink, card, element, model, startLabel, isNew, loFormat, isCourseCard }) {
  const cardFigure = document.createElement('div');
  cardFigure.className = 'alm-card-figure';

  // Create and configure thumbnail image
  if (thumbnail) {
    const img = document.createElement('img');
    img.src = thumbnail;
    img.loading = 'lazy';
    img.alt = title;
    img.width = 254;
    img.height = 153;

    // Handle image load states
    const handleImageError = () => {
      card.classList.add('alm-thumbnail-not-loaded');
      img.style.display = 'none';
    };

    const handleImageLoad = () => {
      img.classList.add('img-loaded');
    };

    img.addEventListener('error', handleImageError);
    img.addEventListener('load', handleImageLoad);
    
    if (img.complete) {
      img.classList.add('img-loaded');
    }

    cardFigure.appendChild(img);
  } else {
    card.classList.add('alm-thumbnail-not-loaded');
  }

  // Add user actions overlay (bookmark & copy)
  const cardActions = document.createElement('div');
  cardActions.className = 'alm-card-actions';
  const bookmarkId = getBookmarkId(id, viewLink);

  const createAnalyticsCallback = (eventName) => (linkType, position) => {
    const { cardHeader, cardPosition } = getCardHeaderAndPosition(card, element);
    pushBrowseCardClickEvent(
      eventName,
      model,
      linkType || cardHeader || '',
      position || cardPosition || '',
    );
  };

  const cardAction = UserActions({
    container: cardActions,
    id: bookmarkId,
    bookmarkPath: bookmarkId,
    link: copyLink,
    bookmarkConfig: { icons: ['bookmark-white-fill'] },
    copyConfig: { icons: ['copy-white-fill'] },
    bookmarkCallback: createAnalyticsCallback('bookmarkLinkBrowseCard'),
    copyCallback: createAnalyticsCallback('copyLinkBrowseCard'),
  });

  cardAction.decorate();
  cardFigure.appendChild(cardActions);

  if (startLabel) {
    const startLabelContainer = document.createElement('div');
    startLabelContainer.className = 'alm-card-start-label-container';
    const startLabelElement = document.createElement('p');
    startLabelElement.className = 'alm-card-start-label';
    startLabelElement.innerHTML = startLabel;
    startLabelContainer.appendChild(startLabelElement);
    cardFigure.appendChild(startLabelContainer);
  }

  // Show New label for both courses and cohorts
  // Show loFormat label only for courses
  if (isNew || (isCourseCard && loFormat)) {
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'alm-card-tags-container';
    
    if (isNew) {
      const newTagElement = document.createElement('p');
      newTagElement.className = 'alm-card-tag alm-card-new-tag';
      newTagElement.innerHTML = 'New';
      tagsContainer.appendChild(newTagElement);
    }
    
    if (isCourseCard && loFormat) {
      const formatTagElement = document.createElement('p');
      formatTagElement.className = 'alm-card-tag alm-card-format-tag';
      formatTagElement.innerHTML = loFormat;
      tagsContainer.appendChild(formatTagElement);
    }
    
    cardFigure.appendChild(tagsContainer);
  }

  return cardFigure;
}

/**
 * Builds meta information section (duration, level, rating)
 * @param {Object} meta - Metadata object from card model
 * @param {boolean} isCourseCar - Whether this is a course card (not cohort)
 * @returns {HTMLElement} Meta information container
 * @private
 */
function buildALMMetaInfo(meta, isCourseCard = false) {
  const metaContainer = document.createElement('div');
  metaContainer.className = 'alm-card-meta';
  const metaParts = [];

  // Collect available metadata
  if (meta?.duration) metaParts.push(meta.duration);
  if (meta?.level) metaParts.push(meta.level);
  
  if (!isCourseCard && meta?.rating?.average > 0) {
    metaParts.push(`${meta.rating.average.toFixed(1)} ★`);
  }

  // Create meta text element if we have data
  if (metaParts.length > 0) {
    const metaElement = document.createElement('p');
    metaElement.className = 'alm-card-meta-text';
    metaElement.textContent = metaParts.join(' • ');
    metaContainer.appendChild(metaElement);
  }

  return metaContainer;
}

/**
 * Attaches click event handlers for analytics tracking
 * @param {HTMLElement} element - Container element
 * @param {HTMLElement} card - Card element
 * @param {Object} model - Card data model
 * @private
 */
function attachClickHandlers(element, card, model) {
  const anchor = element.querySelector('a');
  if (!anchor) return;

  // Handle card and CTA clicks
  anchor.addEventListener('click', (e) => {
    const { cardHeader, cardPosition } = getCardHeaderAndPosition(card, element);

    // Ignore user action clicks
    if (e.target.closest('.user-actions')) return;

    // Track CTA clicks
    if (e.target.closest('.alm-card-cta-button')) {
      pushBrowseCardClickEvent('browseCardCTAClick', model, cardHeader, cardPosition);
      return;
    }

    // Track general card clicks
    if (e.target.closest('a:not(.user-actions):not(.alm-card-cta-button)')) {
      pushBrowseCardClickEvent('browseCardClicked', model, cardHeader, cardPosition);
    }
  });

  // Send Coveo analytics event (once)
  anchor.addEventListener('click', () => sendCoveoClickEvent('browse-card', model), { once: true });
}

/**
 * Builds an ALM-specific browse card
 * Creates specialized card layout for Adobe Learning Manager content (courses and cohorts)
 * 
 * @param {HTMLElement} element - Container element for the card
 * @param {Object} model - Card data model from ALM adaptor
 * @returns {Promise<void>}
 * @public
 */
export async function buildALMCard(element, model) {
  const {
    id,
    thumbnail,
    title,
    contentType,
    viewLink,
    copyLink,
    meta,
    failedToLoad = false,
  } = model;

  // Set analytics attribute
  element.setAttribute('data-analytics-content-type', contentType);

  // Normalize URLs
  model.viewLink = lowerCaseSameOriginUrls(viewLink);
  model.copyLink = lowerCaseSameOriginUrls(copyLink);

  const type = contentType?.toLowerCase();

  // Create card structure
  const card = document.createElement('div');
  card.className = `browse-card alm-browse-card ${type}-card ${failedToLoad ? 'browse-card-frozen' : ''}`;

  // Determine if this is a course card (for rating display logic)
  const isCourseCard = type === 'alm-course';
  
  // Build thumbnail section
  const cardFigure = buildALMThumbnail({
    thumbnail,
    title,
    id,
    viewLink: model.viewLink,
    copyLink: model.copyLink,
    card,
    element,
    model,
    startLabel: meta?.startLabel,
    isNew: meta?.isNew,
    loFormat: meta?.loFormat,
    isCourseCard,
  });
  
  // Add rating overlay to thumbnail ONLY for courses 
  if (isCourseCard && meta?.rating?.average > 0) {
    const ratingOverlay = document.createElement('div');
    ratingOverlay.className = 'alm-card-rating-overlay';
    ratingOverlay.innerHTML = `${meta.rating.average.toFixed(1)} <span class="rating-star">★</span>`;
    cardFigure.appendChild(ratingOverlay);
  }
  
  card.appendChild(cardFigure);

  // Build content section
  const cardContent = document.createElement('div');
  cardContent.className = 'alm-card-content';

  // For courses: description before title; For cohorts: title before meta
  if (isCourseCard && meta?.description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'alm-card-description';
    descriptionElement.textContent = meta.description.length > 20 
      ? `${meta.description.substring(0, 20)}...` 
      : meta.description;
    cardContent.appendChild(descriptionElement);
  }

  // Add title for both courses and cohorts
  if (title) {
    const titleElement = document.createElement('h3');
    titleElement.className = 'alm-card-title';
    titleElement.innerHTML = title;
    cardContent.appendChild(titleElement);
  }

  // Add metadata for cohorts only
  if (!isCourseCard) {
    const metaInfo = buildALMMetaInfo(meta, isCourseCard);
    if (metaInfo.children.length > 0) {
      cardContent.appendChild(metaInfo);
    }
  }

  card.appendChild(cardContent);

  // Build footer with instances - only for cohorts, not for courses
  if (!isCourseCard && meta?.instances?.length > 0) {
    const cardFooter = document.createElement('div');
    cardFooter.className = 'alm-card-footer';
    const instancesContainer = document.createElement('div');
    instancesContainer.className = 'alm-card-instances';
    meta.instances.forEach((instance) => {
      const instanceElement = document.createElement('p');
      instanceElement.className = 'alm-card-instance';
      instanceElement.innerHTML = instance.name;
      instancesContainer.appendChild(instanceElement);
    });
    cardFooter.appendChild(instancesContainer);
    card.appendChild(cardFooter);
  }


  // Load required CSS
  await Promise.all([
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`),
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-alm.css`),
  ]);

  // Wrap card in anchor if we have a link
  if (model.viewLink) {
    const cardContainer = document.createElement('a');
    cardContainer.href = model.viewLink;

    // Prevent navigation when clicking user actions
    cardContainer.addEventListener('click', (e) => {
      if (e.target?.closest('.user-actions')) {
        e.preventDefault();
      }
    });

    cardContainer.appendChild(card);
    element.appendChild(cardContainer);

    // Attach analytics handlers
    attachClickHandlers(element, card, model);
  } else {
    element.appendChild(card);
  }
}

export default { buildALMCard };
