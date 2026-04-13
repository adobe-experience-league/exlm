/* eslint-disable camelcase, no-unused-vars */
import { loadCSS, decorateIcons } from '../lib-franklin.js';
import { fetchLanguagePlaceholders } from '../scripts.js';
import UserActions from '../user-actions/user-actions.js';

/**
 * @fileoverview premium-learning specific browse card implementation
 * Handles rendering of premium-learning courses and cohorts with specialized UI components
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
    return urlObj.origin === window.location.origin ? urlObj.toString().toLowerCase() : url;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error parsing URL:', e);
    return url;
  }
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
function buildPLThumbnail({
  thumbnail,
  title,
  id,
  viewLink,
  copyLink,
  card,
  startLabel,
  isNew,
  loFormat,
  isCourseCard,
  contentType,
}) {
  const cardFigure = document.createElement('div');
  cardFigure.className = 'premium-learning-card-figure';

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
      card.classList.add('premium-learning-thumbnail-not-loaded');
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
    card.classList.add('premium-learning-thumbnail-not-loaded');
  }

  // Add user actions overlay (bookmark & copy)
  const cardActions = document.createElement('div');
  cardActions.className = 'premium-learning-card-actions';
  const bookmarkId = getBookmarkId(id, viewLink);

  const cardAction = UserActions({
    container: cardActions,
    id: bookmarkId,
    bookmarkPath: bookmarkId,
    link: copyLink,
    contentType,
    bookmarkConfig: true,
    copyConfig: { icons: ['copy-white-fill'] },
  });

  cardAction.decorate();
  cardFigure.appendChild(cardActions);

  if (startLabel) {
    const startLabelContainer = document.createElement('div');
    startLabelContainer.className = 'premium-learning-card-start-label-container';

    const calendarIcon = document.createElement('span');
    calendarIcon.className = 'icon icon-pl-calender';
    startLabelContainer.appendChild(calendarIcon);

    const startLabelElement = document.createElement('p');
    startLabelElement.className = 'premium-learning-card-start-label';
    startLabelElement.innerHTML = startLabel;
    startLabelContainer.appendChild(startLabelElement);
    decorateIcons(startLabelContainer);
    cardFigure.appendChild(startLabelContainer);
  }

  // Show New label only for cohorts
  // Show loFormat label only for courses
  if (isNew || (isCourseCard && loFormat)) {
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'premium-learning-card-tags-container';

    if (isNew && !isCourseCard) {
      const newTagElement = document.createElement('p');
      newTagElement.className = 'premium-learning-card-tag premium-learning-card-new-tag';
      newTagElement.textContent = placeholders.premiumLearningBrowseCardNewTag || 'New';
      tagsContainer.appendChild(newTagElement);
    }

    if (isCourseCard && loFormat) {
      const formatTagElement = document.createElement('p');
      formatTagElement.className = 'premium-learning-card-tag premium-learning-card-format-tag';
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
function buildPLMetaInfo(meta, isCourseCard = false) {
  const metaContainer = document.createElement('div');
  metaContainer.className = 'premium-learning-card-meta';
  const metaParts = [];

  // Collect available metadata
  if (meta?.duration) metaParts.push(meta.duration);
  if (meta?.level) metaParts.push(meta.level);

  // Create meta text element if we have data
  if (metaParts.length > 0) {
    const metaElement = document.createElement('p');
    metaElement.className = 'premium-learning-card-meta-text';
    metaElement.textContent = metaParts.join(' • ');
    metaContainer.appendChild(metaElement);
  }

  return metaContainer;
}

/**
 * Builds an premium-learning-specific browse card
 * Creates specialized card layout for Adobe Learning Manager content (courses and cohorts)
 *
 * @param {HTMLElement} element - Container element for the card
 * @param {Object} model - Card data model from premium-learning adaptor
 * @returns {Promise<void>}
 * @public
 */
export async function buildPLCard(element, model) {
  const { id, thumbnail, title, contentType, viewLink, copyLink, meta, failedToLoad = false } = model;

  // Normalize URLs
  model.viewLink = lowerCaseSameOriginUrls(viewLink);
  model.copyLink = lowerCaseSameOriginUrls(copyLink);

  const type = contentType?.toLowerCase();

  // Create card structure
  const card = document.createElement('div');
  card.className = `browse-card premium-learning-browse-card ${type}-card ${failedToLoad ? 'browse-card-frozen' : ''}`;

  // Determine if this is a course card
  const isCourseCard = type === 'premium-learning-course';

  // Build thumbnail section
  const cardFigure = buildPLThumbnail({
    thumbnail,
    title,
    id,
    viewLink: model.viewLink,
    copyLink: model.copyLink,
    card,
    startLabel: meta?.startLabel,
    isNew: meta?.isNew,
    loFormat: meta?.loFormat,
    isCourseCard,
    contentType,
  });

  // Add rating overlay to thumbnail for both courses and cohorts
  if (typeof meta?.rating?.average === 'number' && meta.rating.average > 0) {
    const ratingOverlay = document.createElement('div');
    ratingOverlay.className = 'premium-learning-card-rating-overlay';
    ratingOverlay.innerHTML = `${meta.rating.average.toFixed(1)} <span class="rating-star">★</span>`;
    cardFigure.appendChild(ratingOverlay);
  }

  card.appendChild(cardFigure);

  // Build content section
  const cardContent = document.createElement('div');
  cardContent.className = 'premium-learning-card-content';

  // Add title for both courses and cohorts
  if (title) {
    const titleElement = document.createElement('h3');
    titleElement.className = 'premium-learning-card-title';
    titleElement.innerHTML = title;
    cardContent.appendChild(titleElement);
  }

  card.appendChild(cardContent);

  // Load required CSS
  await Promise.all([
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`),
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-premium-learning.css`),
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
  } else {
    element.appendChild(card);
  }
}

export default { buildPLCard };
