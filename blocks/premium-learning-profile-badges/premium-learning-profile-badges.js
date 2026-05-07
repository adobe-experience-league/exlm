import { htmlToElement, getConfig } from '../../scripts/scripts.js';
import { getCookie } from '../../scripts/utils/cookie-utils.js';
import { fetchUserBadges } from '../../scripts/data-service/premium-learning-data-service.js';

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
    subtitle = loFormat === 'Blended' || loFormat === 'Classroom' ? 'Instructor-Led Training' : 'On-Demand';
  } else if (loType === 'learningProgram') {
    subtitle = 'Cohort Completion';
  }

  const cardHTML = `
    <div class="badge-card">
      <div class="badge-image">
        ${
          badgeImageUrl
            ? `<img src="${badgeImageUrl}" alt="${badgeName}" loading="lazy" />`
            : '<div class="badge-placeholder"></div>'
        }
      </div>
      <div class="badge-info">
        <p class="badge-lo-name">${loName}</p>
        <p class="badge-subtitle">${subtitle}</p>
      </div>
    </div>
  `;

  return htmlToElement(cardHTML);
}

/**
 * Renders shimmer loading state
 * @param {HTMLElement} container - Container element
 * @param {number} count - Number of shimmer cards
 */
function renderShimmer(container, count = 3) {
  const shimmerHTML = `
    <div class="badges-shimmer">
      ${Array(count)
        .fill(0)
        .map(
          () => `
        <div class="badge-card-shimmer">
          <div class="shimmer-image"></div>
          <div class="shimmer-info">
            <div class="shimmer-line shimmer-title"></div>
            <div class="shimmer-line shimmer-subtitle"></div>
          </div>
        </div>
      `,
        )
        .join('')}
    </div>
  `;

  container.innerHTML = shimmerHTML;
}

/**
 * Renders empty state
 * @param {HTMLElement} container - Container element
 */
function renderEmptyState(container) {
  const emptyHTML = `
    <div class="badges-empty-state">
      <p>No badges earned yet. Complete Premium Learning courses to earn badges!</p>
    </div>
  `;

  container.innerHTML = emptyHTML;
}

/**
 * Decorates the premium learning profile badges block
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  const config = getConfig();

  // Extract authored content (header and description)
  const [headingElement, descriptionElement] = [...block.children];

  // Clear block
  block.innerHTML = '';

  // Build header with authored content
  const headerHTML = `
    <div class="badges-header">
      ${headingElement?.innerHTML || '<h2>Premium Learning Badges</h2>'}
      ${
        descriptionElement?.innerHTML ||
        '<p class="badges-description">Visit the <a href="https://experienceleague.adobe.com/en/premium/my-achievements" target="_blank" rel="noopener noreferrer">Premium Learning portal</a> to see more.</p>'
      }
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
  renderShimmer(badgesContentEl);

  try {
    // Get user ID from cookie
    const userId = getCookie('alm_user_id');

    if (!userId) {
      // eslint-disable-next-line no-console
      console.error('User ID not found in cookie');
      renderEmptyState(badgesContentEl);
      return;
    }

    // eslint-disable-next-line no-console
    console.log('Fetching badges for user:', userId);

    // Fetch user badges
    const badgesData = await fetchUserBadges(userId, config, MAX_BADGES);

    if (!badgesData || !badgesData.data || badgesData.data.length === 0) {
      renderEmptyState(badgesContentEl);
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

    // eslint-disable-next-line no-console
    console.log(`Found ${completedBadges.length} completed badge(s)`);

    if (completedBadges.length === 0) {
      renderEmptyState(badgesContentEl);
      return;
    }

    // Render badge cards
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

    badgesContentEl.innerHTML = '';
    badgesContentEl.appendChild(badgesGrid);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading premium learning badges:', error);
    renderEmptyState(badgesContentEl);
  }
}
