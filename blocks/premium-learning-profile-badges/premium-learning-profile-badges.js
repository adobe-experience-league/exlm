import { htmlToElement, getConfig } from '../../scripts/scripts.js';
import { getCookie } from '../../scripts/utils/cookie-utils.js';
import { fetchUserBadges } from '../../scripts/data-service/premium-learning-data-service.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';

const MAX_BADGES = 9;

/**
 * Renders a single badge card
 * @param {Object} userBadge - User badge data
 * @param {Object} badge - Badge details from included
 * @param {Object} learningObject - Learning object details from included
 * @returns {HTMLElement} Badge card element
 */
function renderBadgeCard(userBadge, badge, learningObject) {
  const badgeName = badge?.attributes?.name || 'Badge';
  const badgeImageUrl = badge?.attributes?.imageUrl || '';
  const loName = learningObject?.attributes?.localizedMetadata?.[0]?.name || 'Cohort Name';
  const loType = learningObject?.attributes?.loType || '';
  const loFormat = learningObject?.attributes?.loFormat || '';

  // Determine the subtitle based on learning object type and format
  let subtitle = 'Cohort Completion';
  if (loType === 'course') {
    if (loFormat === 'Self Paced') {
      subtitle = 'On Demand';
    } else if (loFormat === 'Virtual Classroom' || loFormat === 'Classroom' || loFormat === 'Blended') {
      subtitle = 'Instructor-Led Training';
    } else {
      subtitle = 'On Demand'; // Default for unknown formats
    }
  } else if (loType === 'learningProgram') {
    subtitle = 'Cohort Completion';
  }

  const cardHTML = `
    <div class="badge-card">
      <div class="badge-image${!badgeImageUrl ? ' no-badge-image' : ''}">
        <img src="${badgeImageUrl}" alt="${badgeName}" loading="lazy" />
      </div>
      <div class="badge-info">
        <p class="badge-cohort-name">${loName}</p>
        <p class="badge-subtitle">${subtitle}</p>
      </div>
    </div>
  `;

  return htmlToElement(cardHTML);
}

/**
 * Decorates the premium learning profile badges block
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  const config = getConfig();

  // Extract authored content
  const [headingElement, descriptionElement] = [...block.children];

  // Clear block
  block.innerHTML = '';

  // Build header with authored content
  const headerHTML = `
    <div class="badges-header">
      <div class="badges-title">
        ${headingElement?.innerHTML || ''}
      </div>
      <div class="badges-description">
        ${descriptionElement?.innerHTML || ''}
      </div>
    </div>
  `;

  const contentContainer = htmlToElement(`
    <div>
      ${headerHTML}
      <div class="badges-content"></div>
    </div>
  `);

  block.appendChild(contentContainer);

  const badgesContentEl = block.querySelector('.badges-content');

  // Show shimmer while loading
  const shimmer = new BrowseCardShimmer(3);
  shimmer.addShimmer(badgesContentEl);

  try {
    // Get user ID from cookie
    const userId = getCookie('alm_user_id');

    if (!userId) {
      // eslint-disable-next-line no-console
      console.error('User ID not found in cookie');
      block.remove();
      return;
    }

    // Fetch user badges
    const badgesData = await fetchUserBadges(userId, config, MAX_BADGES);

    if (!badgesData || !badgesData.data || badgesData.data.length === 0) {
      block.remove();
      return;
    }

    // Build a map of included data for quick lookup
    const includedMap = {};
    if (badgesData.included) {
      badgesData.included.forEach((item) => {
        includedMap[`${item.type}:${item.id}`] = item;
      });
    }

    // Filter for completed badges only (those with dateAchieved)
    const completedBadges = badgesData.data.filter((userBadge) => userBadge?.attributes?.dateAchieved);

    if (completedBadges.length === 0) {
      block.remove();
      return;
    }

    const badgesGrid = htmlToElement('<div class="badges-grid"></div>');

    completedBadges.forEach((userBadge) => {
      const badgeId = userBadge.relationships?.badge?.data?.id;
      const modelId = userBadge.relationships?.model?.data?.id;

      const badge = badgeId ? includedMap[`badge:${badgeId}`] : null;
      const learningObject = modelId ? includedMap[`learningObject:${modelId}`] : null;

      if (badge) {
        const badgeCard = renderBadgeCard(userBadge, badge, learningObject);
        badgesGrid.appendChild(badgeCard);
      }
    });

    shimmer.removeShimmer();
    badgesContentEl.innerHTML = '';
    badgesContentEl.appendChild(badgesGrid);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading premium learning badges:', error);
    shimmer.removeShimmer();
    block.remove();
  }
}
