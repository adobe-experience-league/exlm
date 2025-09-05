import { decorateIcons, loadCSS } from '../lib-franklin.js';
import { createTag, htmlToElement, fetchLanguagePlaceholders, getPathDetails } from '../scripts.js';
import { AUTHOR_TYPE, RECOMMENDED_COURSES_CONSTANTS, VIDEO_THUMBNAIL_FORMAT } from './browse-cards-constants.js';
import { sendCoveoClickEvent } from '../coveo-analytics.js';
import UserActions from '../user-actions/user-actions.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';

const bookmarkExclusionContentypes = [
  CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY,
  CONTENT_TYPES.COMMUNITY.MAPPING_KEY,
  CONTENT_TYPES.INSTRUCTOR_LED.MAPPING_KEY,
];

/* Fetch data from the Placeholder.json */
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

// Function to parse a duration string and convert it to total hours
const parseTotalDuration = (durationStr) => {
  // Regular expressions to match hours and minutes in the input string
  const hoursRegex = /(\d+)\s*hour?/;
  const minutesRegex = /(\d+)\s*minute?/;

  // Match the input string against the hours and minutes regex
  const hoursMatch = durationStr.match(hoursRegex);
  const minutesMatch = durationStr.match(minutesRegex);

  // Extract hours and minutes from the matches or default to 0 if not found
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

  // Calculate and return the total duration in hours
  return hours + minutes / 60;
};

// Function to calculate remaining time based on total duration and percentage complete
const calculateRemainingTime = (totalTimeDuration, percentageComplete) => {
  // Parse the total duration using the parseTotalDuration function
  const totalDuration = parseTotalDuration(totalTimeDuration);

  // Calculate remaining seconds based on total duration and percentage complete
  const remainingSeconds = ((100 - percentageComplete) / 100) * totalDuration * 3600;

  // Calculate remaining time in hours and minutes
  const remainingHours = Math.floor(remainingSeconds / 3600);
  const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);

  // Return an object containing the remaining hours and minutes
  return { hours: remainingHours, minutes: remainingMinutes };
};

const formatRemainingTime = (remainingTime) => {
  // Check if there are no remaining minutes
  if (remainingTime.minutes === 0) {
    // Format and return hours-only string
    return `${remainingTime.hours} hours`;
  }

  // Check if there are no remaining hours
  if (remainingTime.hours === 0) {
    // Format and return minutes-only string
    return `${remainingTime.minutes} minutes`;
  }

  // If there are both remaining hours and minutes
  return `${remainingTime.hours} hours and ${remainingTime.minutes} minutes`;
};

const getBookmarkId = ({ id, viewLink, contentType }) => {
  if (id) {
    return contentType === CONTENT_TYPES.PLAYLIST.MAPPING_KEY ? `/playlists/${id}` : id;
  }
  return viewLink ? new URL(viewLink).pathname : '';
};

const getBookmarkPath = ({ id, viewLink, contentType }) => {
  if (contentType === CONTENT_TYPES.PLAYLIST.MAPPING_KEY && id) {
    return `/playlists/${id}`;
  }
  return viewLink ? new URL(viewLink).pathname : '';
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const optionsDate = { month: 'short', day: '2-digit' };
  const optionsTime = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: userTimeZone,
  };

  const formattedDate = date.toLocaleDateString(undefined, optionsDate).toUpperCase();
  const formattedTime = date.toLocaleTimeString(undefined, optionsTime);

  // Get timezone abbreviation
  const timeZoneAbbr = {
    'America/Los_Angeles': 'PT',
    'America/Denver': 'MT',
    'America/Chicago': 'CT',
    'America/New_York': 'ET',
    'Pacific/Honolulu': 'HT',
    'Australia/Sydney': 'AEST',
    'Europe/London': 'BST',
    'Europe/Paris': 'CET',
    'Asia/Calcutta': 'IST',
    'Asia/Kolkata': 'IST',
    'Etc/GMT': 'GMT',
  }[userTimeZone];

  let finalTimeZone = timeZoneAbbr;

  if (!timeZoneAbbr) {
    const offsetMinutes = date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes <= 0 ? '+' : '-';

    const paddedHours = offsetHours.toString();
    const paddedMinutes = offsetMins.toString().padStart(2, '0');

    finalTimeZone = `UTC${sign}${paddedHours}:${paddedMinutes}`;
  }

  return `${formattedDate} | ${formattedTime} ${finalTimeZone}`;
};

const buildTagsContent = (cardMeta, tags = []) => {
  tags.forEach((tag) => {
    const { icon: iconName, text } = tag;
    if (text) {
      const anchor = createTag('div', { class: 'browse-card-meta-anchor' });
      const span = createTag('span', { class: `icon icon-${iconName}` });
      anchor.textContent = text;
      anchor.appendChild(span);
      cardMeta.appendChild(anchor);
      decorateIcons(anchor);
    }
  });
};

const buildEventContent = ({ event, contentType, cardContent, card }) => {
  const { time, date } = event;
  const eventInfo = htmlToElement(`
    <div class="browse-card-event-info">
        <span class="icon icon-time"></span>
        <div class="browse-card-event-time">
        ${
          contentType === CONTENT_TYPES.INSTRUCTOR_LED.MAPPING_KEY
            ? `<h6>${date} | ${time}</h6>`
            : `<h6>${formatDate(time)}</h6>`
        }
        </div>
    </div>
  `);
  decorateIcons(eventInfo);
  const title = card.querySelector('.browse-card-title-text');
  cardContent.insertBefore(eventInfo, title.nextElementSibling);
};

const buildInProgressBarContent = ({ inProgressStatus, cardFigure, card }) => {
  if (inProgressStatus) {
    const perValue = inProgressStatus;
    const progressBarDiv = htmlToElement(`
    <div class="skill-bar">
      <div class="skill-bar-container">
      <div class="skill-bar-value"></div>
      </div>
    </div>
  `);
    cardFigure.appendChild(progressBarDiv);
    // Set the width of skill-bar-value based on the value
    card.querySelector('.skill-bar-value').style.width = `${perValue}%`;
  }
};

const buildCourseDurationContent = ({ inProgressStatus, inProgressText, cardContent }) => {
  const titleElement = createTag('p', { class: 'course-duration' });
  const { lang } = getPathDetails();
  if (lang === 'en') {
    const remainingTime = calculateRemainingTime(inProgressText, inProgressStatus);
    const timeleftLabel = placeholders?.recommendedCoursesTimeLeftLabel || 'You have $[TIME_LEFT] left in this course';
    titleElement.textContent = timeleftLabel.replace('$[TIME_LEFT]', formatRemainingTime(remainingTime));
  } else {
    const totalDurationTime = placeholders?.recommendedCoursesTotalDurationLabel || 'Total Duration';
    titleElement.textContent = `${totalDurationTime} ${inProgressText}`;
  }
  cardContent.appendChild(titleElement);
};

const buildCardCtaContent = ({ cardFooter, contentType, viewLinkText, viewLink }) => {
  if (viewLinkText) {
    let icon = null;
    const isLeftPlacement = false;
    if (
      [CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY, CONTENT_TYPES.INSTRUCTOR_LED.MAPPING_KEY].includes(
        contentType?.toLowerCase(),
      )
    ) {
      icon = 'new-tab-blue';
    } else {
      icon = 'chevron-right-blue';
    }
    const iconMarkup = icon ? `<span class="icon icon-${icon}"></span>` : '';
    const linkText = htmlToElement(`
          <div class="browse-card-cta-element" data-analytics-id="${viewLink}">
              ${isLeftPlacement ? `${iconMarkup} ${viewLinkText}` : `${viewLinkText} ${iconMarkup}`}
          </div>
      `);
    decorateIcons(linkText);
    cardFooter.appendChild(linkText);
  }
};

const stripScriptTags = (input) => input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

const buildCardContent = async (card, model) => {
  const {
    id,
    description,
    contentType: type,
    viewLink,
    viewLinkText,
    copyLink,
    tags,
    authorInfo,
    event,
    inProgressText,
    inProgressStatus = {},
    failedToLoad = false,
    truncateDescription = false,
  } = model;
  const contentType = type?.toLowerCase();
  const cardContent = card.querySelector('.browse-card-content');
  const cardFooter = card.querySelector('.browse-card-footer');

  if (description) {
    const stringContent =
      description.length > 100 && truncateDescription ? `${description.substring(0, 100).trim()}...` : description;
    const descriptionElement = document.createElement('p');
    descriptionElement.classList.add('browse-card-description-text');
    descriptionElement.innerHTML = stripScriptTags(stringContent);
    cardContent.appendChild(descriptionElement);
  }

  const cardMeta = document.createElement('div');
  cardMeta.classList.add('browse-card-meta-info');

  if (
    contentType === CONTENT_TYPES.PLAYLIST.MAPPING_KEY ||
    contentType === CONTENT_TYPES.COMMUNITY.MAPPING_KEY ||
    contentType === RECOMMENDED_COURSES_CONSTANTS.RECOMMENDED.MAPPING_KEY
  ) {
    buildTagsContent(cardMeta, tags);
  }

  if (contentType === RECOMMENDED_COURSES_CONSTANTS.IN_PROGRESS.MAPPING_KEY) {
    if (inProgressStatus && inProgressText) {
      buildCourseDurationContent({ inProgressStatus, inProgressText, cardContent });
    }
  }

  cardContent.appendChild(cardMeta);

  if (
    contentType === CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY ||
    contentType === CONTENT_TYPES.INSTRUCTOR_LED.MAPPING_KEY
  ) {
    buildEventContent({ event, contentType, cardContent, card });
  }

  if (contentType === CONTENT_TYPES.PERSPECTIVE.MAPPING_KEY) {
    const authorElement = createTag('div', { class: 'browse-card-author-info' });

    if (authorInfo?.name) {
      const authorPrefix = createTag(
        'span',
        { class: 'browse-card-author-prefix' },
        placeholders?.articleAuthorPrefixLabel,
      );
      const authorName = createTag('span', { class: 'browse-card-author-name' }, authorInfo?.name.join(', '));
      authorElement.append(authorPrefix, authorName);
    }

    let authorBadge = '';
    if (authorInfo?.type.includes(AUTHOR_TYPE.ADOBE)) {
      authorBadge = createTag('span', { class: 'browse-card-author-badge' }, placeholders?.articleAdobeTag);
    } else if (authorInfo?.type.includes(AUTHOR_TYPE.EXTERNAL)) {
      authorBadge = createTag('span', { class: 'browse-card-author-badge' }, placeholders?.articleExternalTag);
      authorBadge.classList.add('author-badge-external');
    }
    if (authorBadge) {
      authorElement.append(authorBadge);
    }

    cardContent.appendChild(authorElement);
  }

  const cardOptions = document.createElement('div');
  cardOptions.classList.add('browse-card-options');

  const cardAction = UserActions({
    container: cardOptions,
    id: getBookmarkId({ id, viewLink, contentType }),
    bookmarkPath: getBookmarkPath({ id, viewLink, contentType }),
    link: copyLink,
    bookmarkConfig: !bookmarkExclusionContentypes.includes(contentType),
    copyConfig: failedToLoad ? false : undefined,
  });

  cardAction.decorate();

  cardFooter.appendChild(cardOptions);
  buildCardCtaContent({ cardFooter, contentType, viewLinkText, viewLink });
};

/* Default No Results Content from Placeholder */
export const buildNoResultsContent = (block, show, placeholder = placeholders.noResultsText) => {
  if (show) {
    const noResultsInfo = htmlToElement(`
    <div class="browse-card-no-results">${placeholder}</div>
  `);
    block.appendChild(noResultsInfo);
  } else {
    const existingNoResultsInfo = block.querySelector('.browse-card-no-results');
    if (existingNoResultsInfo) {
      block.removeChild(existingNoResultsInfo);
    }
  }
};

/**
 * Lowercases the url if it is the same origin, handles relative urls as well
 * @param {string} url - The url to lowercase
 * @returns {string} The lowercase url
 */
function lowerCaseSameOriginUrls(url) {
  if (url) {
    let urlObj;
    try {
      urlObj = new URL(url, window.location.origin);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error parsing url:', e);
      return url; // gracefully handle malformed urls
    }
    if (urlObj.origin === window.location.origin) {
      return urlObj.toString().toLowerCase();
    }
  }
  return url;
}

let videoClipModalPromise = null;

const getVideoClipModal = () => {
  if (!videoClipModalPromise) {
    videoClipModalPromise = import('./browse-card-video-clip-modal.js');
  }
  return videoClipModalPromise;
};

/**
 * Builds a browse card element with various components based on the provided model data.
 *
 * @param {HTMLElement} container - The container element for the browse card.
 * @param {HTMLElement} element - The element where the card will be appended.
 * @param {Object} model - The data model containing information about the card.
 * @param {string} model.thumbnail - URL for the card thumbnail image.
 * @param {string} model.product - Product information to be displayed, which can include multiple solutions.
 * @param {string} model.title - Title of the card.
 * @param {string} model.contentType - Type of the content, used for CSS styling and analytics.
 * @param {string} model.badgeTitle - Title of the badge, displayed as a banner.
 * @param {string} model.inProgressStatus - Status information for progress-related content types.
 * @param {boolean} [model.failedToLoad=false] - Indicates if the card failed to load, triggering specific styles.
 * @param {string} [model.viewLink] - URL link to view more details about the card content.
 * @param {string} [model.copyLink] - URL link for a copy/share action on the card.
 * @returns {Promise<void>} Resolves when the card is fully built and added to the DOM.
 */
export async function buildCard(container, element, model) {
  const { thumbnail, product, title, contentType, badgeTitle, inProgressStatus, failedToLoad = false } = model;

  element.setAttribute('data-analytics-content-type', contentType);
  // lowercase all urls - because all of our urls are lower-case
  model.viewLink = lowerCaseSameOriginUrls(model.viewLink);
  model.copyLink = lowerCaseSameOriginUrls(model.copyLink);

  const isVideoClip = badgeTitle?.toUpperCase() === CONTENT_TYPES['VIDEO CLIP'].LABEL.toUpperCase();

  let type = contentType?.toLowerCase();
  const inProgressMappingKey = RECOMMENDED_COURSES_CONSTANTS.IN_PROGRESS.MAPPING_KEY.toLowerCase();
  const recommededMappingKey = RECOMMENDED_COURSES_CONSTANTS.RECOMMENDED.MAPPING_KEY.toLowerCase();
  if (isVideoClip) {
    type = CONTENT_TYPES['VIDEO CLIP'].MAPPING_KEY;
  } else if (contentType === inProgressMappingKey || contentType === recommededMappingKey) {
    const mappingKey = Object.keys(CONTENT_TYPES).find(
      (key) => CONTENT_TYPES[key].LABEL.toUpperCase() === badgeTitle.toUpperCase(),
    );

    if (mappingKey) {
      type = mappingKey.toLowerCase();
    }
  }

  const clickableLink = !(isVideoClip && !model.parentURL);
  const showVideoIconOnly = isVideoClip;

  if (isVideoClip) {
    const link = model.parentURL || model.videoURL;
    if (link) {
      model.copyLink = lowerCaseSameOriginUrls(link);
      model.viewLink = lowerCaseSameOriginUrls(link);
    }
  }

  const card = createTag(
    'div',
    { class: `browse-card ${type}-card ${failedToLoad ? 'browse-card-frozen' : ''}` },
    `<div class="browse-card-figure"></div>${
      showVideoIconOnly ? `<div class="browse-card-video-clip"></div>` : ''
    }<div class="browse-card-content"></div><div class="browse-card-footer"></div>`,
  );
  const cardFigure = card.querySelector('.browse-card-figure');
  const cardContent = card.querySelector('.browse-card-content');

  if (showVideoIconOnly) {
    const cardClipContainer = card.querySelector('.browse-card-video-clip');
    const playButton = document.createElement('div');
    playButton.classList.add('play-button');
    playButton.innerHTML = '<span class="icon icon-play-outline-white"></span>';
    cardClipContainer.appendChild(playButton);
    decorateIcons(playButton);
  } else if (thumbnail) {
    const laptopContainer = document.createElement('div');
    laptopContainer.classList.add('laptop-container');
    const laptopScreen = document.createElement('div');
    const laptopKeyboard = document.createElement('div');
    laptopContainer.append(laptopScreen, laptopKeyboard);

    cardFigure.classList.add('img-custom-height');
    card.classList.add('thumbnail-loaded');
    cardFigure.appendChild(laptopContainer);

    const img = document.createElement('img');
    img.src = thumbnail;
    img.loading = 'lazy';
    img.alt = title;
    img.width = 254;
    img.height = 153;
    cardFigure.appendChild(img);
    img.addEventListener('error', () => {
      cardFigure.classList.remove('img-custom-height');
      card.classList.remove('thumbnail-loaded');
      card.classList.add('thumbnail-not-loaded');
      img.style.display = 'none';
      laptopContainer.style.display = 'none';
    });

    if (img.complete) {
      img.classList.add('img-loaded');
    }

    img.addEventListener('load', () => {
      img.classList.add('img-loaded');
      if (
        VIDEO_THUMBNAIL_FORMAT.test(thumbnail) ||
        type === CONTENT_TYPES.PLAYLIST.MAPPING_KEY ||
        type === CONTENT_TYPES.TUTORIAL.MAPPING_KEY ||
        type === CONTENT_TYPES.EVENT.MAPPING_KEY ||
        type === CONTENT_TYPES['VIDEO CLIP'].MAPPING_KEY
      ) {
        const playButton = document.createElement('div');
        playButton.classList.add('play-button');
        playButton.innerHTML = '<span class="icon icon-play-outline-white"></span>';
        cardFigure.appendChild(playButton);
        decorateIcons(playButton);
      }
    });
  } else {
    card.classList.add('thumbnail-not-loaded');
  }
  if (badgeTitle || failedToLoad) {
    const bannerElement = createTag('h3', { class: 'browse-card-banner' });
    bannerElement.innerText = badgeTitle || '';
    bannerElement.style.backgroundColor = `var(--browse-card-color-${type}-primary)`;
    cardFigure.appendChild(bannerElement);
  }

  if (contentType === RECOMMENDED_COURSES_CONSTANTS.IN_PROGRESS.MAPPING_KEY) {
    buildInProgressBarContent({ inProgressStatus, cardFigure, card });
  }

  if (product?.length > 0 || failedToLoad) {
    const tagText = product?.join(', ') || '';
    const isMultiSolution = product?.length > 1;

    const tagElement = createTag(
      'div',
      { class: 'browse-card-tag-text' },
      `<h4>${isMultiSolution ? placeholders.multiSolutionText || 'multisolution' : tagText}</h4>`,
    );

    if (isMultiSolution) {
      const tooltip = htmlToElement(`
        <div class="tooltip-placeholder">
          <div class="tooltip tooltip-top tooltip-grey">
            <span class="icon icon-info"></span>
            <span class="tooltip-text">${tagText}</span>
          </div>
        </div>
      `);
      // Eventlistener to make the tooltip clickable inside the anchor tag
      tooltip.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });

      tagElement.appendChild(tooltip);
      decorateIcons(tagElement);
    }
    cardContent.appendChild(tagElement);
  }

  if (title) {
    const titleElement = createTag('h5', { class: 'browse-card-title-text' });
    titleElement.innerHTML = title;
    cardContent.appendChild(titleElement);
  }
  await loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`);
  await buildCardContent(card, model);

  if (isVideoClip) {
    const cardOptions = card.querySelector('.browse-card-options');
    card.addEventListener('click', (e) => {
      if (cardOptions?.contains(e.target)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      getVideoClipModal().then(async ({ BrowseCardVideoClipModal }) => {
        const modal = await BrowseCardVideoClipModal.create({
          model,
        });
        modal.open();
      });
    });
  }

  if (model.viewLink) {
    const cardContainer = document.createElement('a');
    if (clickableLink) {
      cardContainer.setAttribute('href', model.viewLink);
    }
    cardContainer.addEventListener('click', (e) => {
      const preventLinkRedirection = !!(e.target && e.target.closest('.user-actions'));

      // Prevent default link behavior for user actions and video clips
      if (
        preventLinkRedirection ||
        (isVideoClip && (e.target.closest('.browse-card-figure') || e.target.closest('.play-button')))
      ) {
        e.preventDefault();
      }
    });
    if (
      [CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY, CONTENT_TYPES.INSTRUCTOR_LED.MAPPING_KEY].includes(
        contentType?.toLowerCase(),
      )
    ) {
      cardContainer.setAttribute('target', '_blank');
    }
    cardContainer.appendChild(card);
    element.appendChild(cardContainer);
  } else {
    element.appendChild(card);
  }

  element.querySelector('a').addEventListener(
    'click',
    () => {
      sendCoveoClickEvent('browse-card', model);
    },
    { once: true },
  );
}
