/* eslint-disable no-use-before-define */
import { htmlToElement } from '../../scripts/scripts.js';
import { isPLEligible } from '../../scripts/utils/premium-learning-utils.js';
import { getUserProfile } from '../../scripts/auth/profile.js';
import { getConfig } from '../../scripts/scripts.js';
import PLDataService from '../../scripts/data-service/premium-learning-data-service.js';

const MAX_BADGES = 9;

/**
 * Fetches user badges from Adobe Learning Manager API
 * @param {string} userId - User ID
 * @param {Object} config - Config object
 * @returns {Promise<Object|null>} Badge data or null on error
 */
async function fetchUserBadges(userId, config) {
  try {
    const apiBaseUrl = config?.plApiBaseUrl;
    if (!apiBaseUrl || !userId) {
      return null;
    }

    const url = new URL(`${apiBaseUrl}/users/${userId}/userBadges`);
    url.searchParams.set('page[offset]', '0');
    url.searchParams.set('page[limit]', String(MAX_BADGES));
    url.searchParams.set('sort', '-dateAchieved');
    url.searchParams.set('include', 'badge,model');

    const headers = PLDataService.buildRequestHeaders();
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`User badges API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user badges:', error);
    return null;
  }
}

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
  const loName = learningObject?.attributes?.localizedMetadata?.[0]?.name || 'Cohort Name Placeholder';
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
        ${badgeImageUrl ? `<img src="${badgeImageUrl}" alt="${badgeName}" loading="lazy" />` : '<div class="badge-placeholder"></div>'}
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

  // Clear block and build structure
  block.innerHTML = '';

  const headerHTML = `
    <div class="badges-header">
      <h2>Premium Learning Badges</h2>
      <p class="badges-description">Visit the <a href="https://experienceleague.adobe.com/en/premium/my-achievements" target="_blank" rel="noopener noreferrer">Premium Learning portal</a> to see more.</p>
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

  // Show shimmer while checking eligibility
  renderShimmer(badgesContentEl);

  try {
    // Check if user is eligible for Premium Learning
    const isEligible = await isPLEligible();

    if (!isEligible) {
      block.classList.add('pl-badges-empty');
      badgesContentEl.remove();
      return;
    }

    // Get user profile to retrieve user ID
    const userProfile = await getUserProfile();
    const userId = userProfile?.userId;

    if (!userId) {
      // eslint-disable-next-line no-console
      console.error('User ID not found in profile');
      block.classList.add('pl-badges-empty');
      badgesContentEl.remove();
      return;
    }

    // Fetch user badges
    const badgesData = await fetchUserBadges(userId, config);

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

    // Render badge cards
    const badgesGrid = htmlToElement('<div class="badges-grid"></div>');

    badgesData.data.forEach((userBadge) => {
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
