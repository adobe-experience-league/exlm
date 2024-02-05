import { loadCSS } from '../lib-franklin.js';
import { createTag, htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';
import { createTooltip } from './browse-card-tooltip.js';
import { CONTENT_TYPES, RECOMMENDED_COURSES_CONSTANTS } from './browse-cards-constants.js';
import loadJWT from '../auth/jwt.js';
import { adobeIMS, profile } from '../data-service/profile-service.js';
import { tooltipTemplate } from '../toast/toast.js';
import renderBookmark from '../bookmark/bookmark.js';
import attachCopyLink from '../copy-link/copy-link.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/toast/toast.css`);

const isSignedIn = adobeIMS?.isSignedInUser();

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

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

// Default No Results Content from Placeholder
export const buildNoResultsContent = (block) => {
  loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`); // load css dynamically
  const noResultsInfo = htmlToElement(`
    <div class="browse-card-no-results">${placeholders.noResultsText}</div>
  `);
  block.appendChild(noResultsInfo);
};

const buildEventContent = ({ event, cardContent, card }) => {
  const { time } = event;
  const eventInfo = htmlToElement(`
    <div class="browse-card-event-info">
        <span class="icon icon-time"></span>
        <div class="browse-card-event-time">
            <h6>${time}</h6>
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
  const remainingTime = calculateRemainingTime(inProgressText, inProgressStatus);
  titleElement.textContent = `You have ${formatRemainingTime(remainingTime)} left in this course`;
  cardContent.appendChild(titleElement);
};

const buildCardCtaContent = ({ cardFooter, contentType, viewLink, viewLinkText }) => {
  let icon = null;
  let isLeftPlacement = false;
  if (contentType === 'tutorial') {
    icon = 'play-outline';
    isLeftPlacement = false;
  } else if (
    contentType === CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY ||
    contentType === CONTENT_TYPES.EVENT.MAPPING_KEY ||
    contentType === CONTENT_TYPES.INSTRUCTOR_LED_TRANING.MAPPING_KEY
  ) {
    icon = 'new-tab';
  }
  const iconMarkup = icon ? `<span class="icon icon-${icon}"></span>` : '';
  const ctaText = viewLinkText || '';
  const anchorLink = htmlToElement(`
        <a class="browse-card-cta-element" target="_blank" href="${viewLink}">
            ${isLeftPlacement ? `${iconMarkup} ${ctaText}` : `${ctaText} ${iconMarkup}`}
        </a>
    `);
  cardFooter.appendChild(anchorLink);
};

const stripScriptTags = (input) => input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

const buildCardContent = (card, model) => {
  const {
    id,
    description,
    contentType: type,
    viewLinkText,
    viewLink,
    copyLink,
    tags,
    event,
    inProgressText,
    inProgressStatus = {},
  } = model;
  const contentType = type.toLowerCase();
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

  if (contentType === CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY) {
    buildEventContent({ event, cardContent, card });
  }
  const cardOptions = document.createElement('div');
  cardOptions.classList.add('browse-card-options');
  if (
    contentType !== CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY &&
    contentType !== CONTENT_TYPES.COMMUNITY.MAPPING_KEY &&
    contentType !== CONTENT_TYPES.INSTRUCTOR_LED_TRANING.MAPPING_KEY
  ) {
    const unAuthBookmark = document.createElement('div');
    unAuthBookmark.className = 'bookmark';
    unAuthBookmark.innerHTML = tooltipTemplate('bookmark-icon', '', `${placeholders.bookmarkUnauthLabel}`);

    const authBookmark = document.createElement('div');
    authBookmark.className = 'bookmark auth';
    authBookmark.innerHTML = tooltipTemplate('bookmark-icon', '', `${placeholders.bookmarkAuthLabelSet}`);
    if (isSignedIn) {
      cardOptions.appendChild(authBookmark);
      if (id) {
        cardOptions.children[0].setAttribute('data-id', id);
      } else {
        cardOptions.children[0].setAttribute('data-id', 'none');
      }
    } else {
      cardOptions.appendChild(unAuthBookmark);
    }
  }
  if (copyLink) {
    const copyLinkElem = document.createElement('div');
    copyLinkElem.className = 'copy-link';
    copyLinkElem.innerHTML = tooltipTemplate('copy-icon', '', `${placeholders.toastTiptext}`);
    cardOptions.appendChild(copyLinkElem);
    copyLinkElem.setAttribute('data-link', copyLink);
    if (id) {
      copyLinkElem.setAttribute('data-id', id);
    }
  }
  cardFooter.appendChild(cardOptions);
  buildCardCtaContent({ cardFooter, contentType, viewLink, viewLinkText });
};

const setupBookmarkAction = (wrapper) => {
  loadJWT().then(async () => {
    profile().then(async (data) => {
      const bookmarkAuthed = Array.from(
        wrapper.querySelectorAll('.browse-card-footer .browse-card-options .bookmark.auth'),
      );
      bookmarkAuthed.forEach((bookmark) => {
        const bookmarkAuthedToolTipLabel = bookmark.querySelector('.exl-tooltip-label');
        const bookmarkAuthedToolTipIcon = bookmark.querySelector('.bookmark-icon');
        const bookmarkId = bookmark.getAttribute('data-id');
        renderBookmark(bookmarkAuthedToolTipLabel, bookmarkAuthedToolTipIcon, bookmarkId);
        if (data.bookmarks.includes(bookmarkId)) {
          bookmarkAuthedToolTipIcon.classList.add('authed');
          bookmarkAuthedToolTipLabel.innerHTML = `${placeholders.bookmarkAuthLabelRemove}`;
        }
      });
    });
  });
};

const setupCopyAction = (wrapper) => {
  Array.from(wrapper.querySelectorAll('.copy-link')).forEach((copylink) => {
    const copylinkvalue = copylink.getAttribute('data-link');
    if (copylinkvalue) {
      attachCopyLink(copylink, copylinkvalue, placeholders.toastSet);
    }
  });
};

export async function buildCard(container, element, model) {
  loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`); // load css dynamically
  const { thumbnail, product, title, contentType, badgeTitle, inProgressStatus } = model;
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
    cardFigure.classList.add('img-custom-height');
    cardFigure.appendChild(img);
  }

  const bannerElement = createTag('h3', { class: 'browse-card-banner' });
  bannerElement.innerText = badgeTitle;
  cardFigure.appendChild(bannerElement);

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
        content: product.join(', ').replace(/\|/g, ' | '),
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
  buildCardContent(card, model);
  setupBookmarkAction(card);
  setupCopyAction(card);
  element.appendChild(card);
}
