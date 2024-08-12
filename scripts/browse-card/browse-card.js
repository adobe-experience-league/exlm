import { decorateIcons, loadCSS } from '../lib-franklin.js';
import { createTag, htmlToElement, fetchLanguagePlaceholders, getPathDetails } from '../scripts.js';
import { createTooltip } from './browse-card-tooltip.js';
import { CONTENT_TYPES, RECOMMENDED_COURSES_CONSTANTS, AUTHOR_TYPE } from './browse-cards-constants.js';
import { sendCoveoClickEvent } from '../coveo-analytics.js';
import UserActions from '../user-actions/user-actions.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`);

/* Fetch data from the Placeholder.json */
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const { lang } = getPathDetails();

/* User Info for Community Section - Will accomodate once we have KHOROS integration */
// const generateContributorsMarkup = (contributor) => {
//   const { name, thumbnail, level, date } = contributor;
//   return htmlToElement(`
//         <div class="browse-card-contributor-info">
//             <img src="${thumbnail}">
//             <div class="browse-card-name-plate">
//             <span class="browse-card-contributor-name">${name}</span>
//             <div class="browse-card-contributor-level">
//                 <span>L</span>
//                 <span>Level ${level}</span>
//             </div>
//             <span>${date}</span>
//             </div>
//         </div>`);
// };

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

const buildTagsContent = (cardMeta, tags = []) => {
  tags.forEach((tag) => {
    const { icon: iconName, text } = tag;
    if (text) {
      const anchor = createTag('div', { class: 'browse-card-meta-anchor' });
      const span = createTag('span', { class: `icon icon-${iconName}` });
      anchor.textContent = text;
      anchor.appendChild(span);
      cardMeta.appendChild(anchor);
    }
  });
};

/* Default No Results Content from Placeholder */
export const buildNoResultsContent = (block, show) => {
  if (show) {
    const noResultsInfo = htmlToElement(`
    <div class="browse-card-no-results">${placeholders.noResultsText}</div>
  `);
    block.appendChild(noResultsInfo);
  } else {
    const existingNoResultsInfo = block.querySelector('.browse-card-no-results');
    if (existingNoResultsInfo) {
      block.removeChild(existingNoResultsInfo);
    }
  }
};

function formatDateString(dateString) {
  const date = new Date(dateString);
  const optionsDate = { month: 'short', day: '2-digit' };
  const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' };

  const formattedDate = date.toLocaleDateString(undefined, optionsDate).toUpperCase();
  const formattedTime = date.toLocaleTimeString(undefined, optionsTime);

  const [time, period] = formattedTime.split(' ');
  const formattedTimeWithoutZone = `${time} ${period}`;
  // Return date and time without timezone
  return `${formattedDate} | ${formattedTimeWithoutZone}`;
}

const buildEventContent = ({ event, cardContent, card }) => {
  const { time } = event;
  const eventInfo = htmlToElement(`
    <div class="browse-card-event-info">
        <span class="icon icon-time"></span>
        <div class="browse-card-event-time">
            <h6>${formatDateString(time)}</h6>
        </div>
    </div>
  `);
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

const buildCardCtaContent = ({ cardFooter, contentType, viewLinkText }) => {
  if (viewLinkText) {
    let icon = null;
    let isLeftPlacement = false;
    if (contentType?.toLowerCase() === CONTENT_TYPES.TUTORIAL.MAPPING_KEY) {
      icon = 'play-outline';
      isLeftPlacement = false;
    } else if (
      [CONTENT_TYPES.LIVE_EVENT.MAPPING_KEY, CONTENT_TYPES.INSTRUCTOR_LED.MAPPING_KEY].includes(
        contentType?.toLowerCase(),
      )
    ) {
      icon = 'new-tab';
    }
    const iconMarkup = icon ? `<span class="icon icon-${icon}"></span>` : '';
    const linkText = htmlToElement(`
          <div class="browse-card-cta-element">
              ${isLeftPlacement ? `${iconMarkup} ${viewLinkText}` : `${viewLinkText} ${iconMarkup}`}
          </div>
      `);
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
  } = model;
  const contentType = type?.toLowerCase();
  const cardContent = card.querySelector('.browse-card-content');
  const cardFooter = card.querySelector('.browse-card-footer');

  if (description) {
    const stringContent = description.length > 100 ? `${description.substring(0, 100).trim()}...` : description;
    const descriptionElement = document.createElement('p');
    descriptionElement.classList.add('browse-card-description-text');
    descriptionElement.innerHTML = stripScriptTags(stringContent);
    cardContent.appendChild(descriptionElement);
  }

  const cardMeta = document.createElement('div');
  cardMeta.classList.add('browse-card-meta-info');

  if (
    contentType === CONTENT_TYPES.COURSE.MAPPING_KEY ||
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

  /* User Info for Community Section - Will accomodate once we have KHOROS integration */
  // if (contentType === CONTENT_TYPES.COMMUNITY.MAPPING_KEY) {
  //   const contributorInfo = document.createElement('div');
  //   contributorInfo.classList.add('browse-card-contributor-info');
  //   const contributorElement = generateContributorsMarkup(contributor);
  //   contributorInfo.appendChild(contributorElement);
  //   buildTagsContent(cardMeta, tags);
  //   cardContent.insertBefore(contributorInfo, cardMeta);
  // }

  if (contentType === CONTENT_TYPES.LIVE_EVENT.MAPPING_KEY) {
    buildEventContent({ event, cardContent, card });
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
    if (authorInfo?.type[0] === AUTHOR_TYPE.ADOBE) {
      authorBadge = createTag('span', { class: 'browse-card-author-badge' }, placeholders?.articleAdobeTag);
    } else if (authorInfo?.type[0] === AUTHOR_TYPE.EXTERNAL) {
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

  const bookmarkEnabled = ![
    CONTENT_TYPES.LIVE_EVENT.MAPPING_KEY,
    CONTENT_TYPES.COMMUNITY.MAPPING_KEY,
    CONTENT_TYPES.PERSPECTIVE.MAPPING_KEY,
    CONTENT_TYPES.INSTRUCTOR_LED.MAPPING_KEY,
  ].includes(contentType);
  const cardAction = UserActions({
    container: cardOptions,
    id: id || (viewLink ? new URL(viewLink).pathname : ''),
    link: copyLink,
    bookmarkConfig: bookmarkEnabled,
  });

  cardAction.decorate();

  cardFooter.appendChild(cardOptions);
  buildCardCtaContent({ cardFooter, contentType, viewLinkText });
};

/**
 * @typedef {Object} CardModel
 * @property {string} thumbnail
 * @property {string[]} product
 * @property {string} title
 * @property {string} contentType
 * @property {string} badgeTitle
 * @property {number} inProgressStatus
 */

/**
 *
 * @param {HTMLElement} container
 * @param {HTMLElement} element
 * @param {*} model
 */
export async function buildCard(container, element, model) {
  const { thumbnail, product, title, contentType, badgeTitle, inProgressStatus } = model;
  // lowercase all urls - because all of our urls are lower-case
  model.viewLink = model.viewLink?.toLowerCase();
  model.copyLink = model.copyLink?.toLowerCase();

  let type = contentType?.toLowerCase();
  const courseMappingKey = CONTENT_TYPES.COURSE.MAPPING_KEY.toLowerCase();
  const tutorialMappingKey = CONTENT_TYPES.TUTORIAL.MAPPING_KEY.toLowerCase();
  const inProgressMappingKey = RECOMMENDED_COURSES_CONSTANTS.IN_PROGRESS.MAPPING_KEY.toLowerCase();
  const recommededMappingKey = RECOMMENDED_COURSES_CONSTANTS.RECOMMENDED.MAPPING_KEY.toLowerCase();
  if (contentType === inProgressMappingKey || contentType === recommededMappingKey) {
    const mappingKey = Object.keys(CONTENT_TYPES).find(
      (key) => CONTENT_TYPES[key].LABEL.toUpperCase() === badgeTitle.toUpperCase(),
    );

    if (mappingKey) {
      type = mappingKey.toLowerCase();
    }
  }
  const card = createTag(
    'div',
    { class: `browse-card ${type}-card` },
    `<div class="browse-card-figure"></div><div class="browse-card-content"></div><div class="browse-card-footer"></div>`,
  );
  const cardFigure = card.querySelector('.browse-card-figure');
  const cardContent = card.querySelector('.browse-card-content');

  if (
    (type === courseMappingKey ||
      type === tutorialMappingKey ||
      type === inProgressMappingKey ||
      type === recommededMappingKey) &&
    thumbnail
  ) {
    const img = document.createElement('img');
    img.src = thumbnail;
    img.loading = 'lazy';
    img.alt = title;
    img.width = 254;
    img.height = 153;
    cardFigure.appendChild(img);
    img.addEventListener('error', () => {
      img.style.display = 'none';
    });
    img.addEventListener('load', () => {
      cardFigure.classList.add('img-custom-height');
    });
  }

  if (badgeTitle) {
    const bannerElement = createTag('h3', { class: 'browse-card-banner' });
    bannerElement.innerText = badgeTitle || '';
    cardFigure.appendChild(bannerElement);
  }

  if (contentType === RECOMMENDED_COURSES_CONSTANTS.IN_PROGRESS.MAPPING_KEY) {
    buildInProgressBarContent({ inProgressStatus, cardFigure, card });
  }

  if (product) {
    let tagElement;
    if (product.length > 1) {
      tagElement = createTag(
        'div',
        { class: 'browse-card-tag-text' },
        `<h4>${placeholders.multiSolutionText || 'multisolution'}</h4><div class="tooltip-placeholder"></div>`,
      );
      cardContent.appendChild(tagElement);
      const tooltipElem = cardContent.querySelector('.tooltip-placeholder');
      const tooltipConfig = {
        position: 'top',
        color: 'grey',
        content: product.join(', '),
      };
      createTooltip(container, tooltipElem, tooltipConfig);
    } else {
      tagElement = createTag('div', { class: 'browse-card-tag-text' }, `<h4>${product.join(', ')}</h4>`);
      cardContent.appendChild(tagElement);
    }
  }

  if (title) {
    const titleElement = createTag('h5', { class: 'browse-card-title-text' });
    titleElement.textContent = title;
    cardContent.appendChild(titleElement);
  }
  await buildCardContent(card, model);
  if (model.viewLink) {
    const cardContainer = document.createElement('a');
    cardContainer.setAttribute('href', model.viewLink);
    cardContainer.addEventListener('click', (e) => {
      const preventLinkRedirection = !!(e.target && e.target.closest('.user-actions'));
      if (preventLinkRedirection) {
        e.preventDefault();
      }
    });
    if (
      [CONTENT_TYPES.LIVE_EVENT.MAPPING_KEY, CONTENT_TYPES.INSTRUCTOR_LED.MAPPING_KEY].includes(
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
  await decorateIcons(element);
}
