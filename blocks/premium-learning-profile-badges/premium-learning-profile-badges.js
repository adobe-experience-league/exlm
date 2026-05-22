import { htmlToElement, getConfig, fetchLanguagePlaceholders, createTag } from '../../scripts/scripts.js';
import { getCookie } from '../../scripts/utils/cookie-utils.js';
import { fetchUserBadges } from '../../scripts/data-service/premium-learning-data-service.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { isPLEligible } from '../../scripts/utils/premium-learning-utils.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
const MAX_BADGES = 9;

/**
 * Removes the wrapping section (see decorateBlock in lib-franklin.js — adds `{block}-container` on the section).
 * Same pattern as course-awards when there is nothing to show.
 * @param {HTMLElement} block
 */
function removePremiumLearningProfileBadgesSection(block) {
  const section = block.closest('.section.premium-learning-profile-badges-container');
  if (section) {
    section.remove();
  } else {
    block.remove();
  }
}

function showFallbackContentInUEMode(blockElement) {
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  contentDiv.textContent = 'This block will load the Premium learning profile badges for Premium users only.';
  blockElement.appendChild(contentDiv);
}

/**
 * Renders a single badge card
 * @param {Object} badge - Badge details from included
 * @param {Object} learningObject - Learning object details from included
 * @returns {HTMLElement} Badge card element
 */
function renderBadgeCard(badge, learningObject, placeholders = {}) {
  const badgeName = badge?.attributes?.name || '';
  const badgeImageUrl = badge?.attributes?.imageUrl || '';
  const loName = learningObject?.attributes?.localizedMetadata?.[0]?.name || '';
  const loType = learningObject?.attributes?.loType || '';
  const tags = learningObject?.attributes?.tags || [];

  const onDemandLabel = placeholders.premiumLearningOnDemand || 'On Demand';
  const instructorLedLabel = placeholders.premiumLearningInstructorLed || 'Instructor-Led Training';
  const cohortCompletionLabel = placeholders.premiumLearningCohortCompletion || 'Cohort Completion';

  let subtitle = cohortCompletionLabel;
  if (loType === 'course') {
    const hasLiveSession = tags.some((tag) => tag === 'Live Session');
    if (hasLiveSession) {
      subtitle = instructorLedLabel;
    } else {
      subtitle = onDemandLabel;
    }
  } else if (loType === 'learningProgram') {
    subtitle = cohortCompletionLabel;
  }

  const card = document.createElement('div');
  card.className = 'badge-card';

  const imageWrapper = document.createElement('div');
  imageWrapper.className = `badge-image${!badgeImageUrl ? ' no-badge-image' : ''}`;

  if (badgeImageUrl) {
    const img = document.createElement('img');
    img.src = badgeImageUrl;
    img.alt = badgeName;
    img.loading = 'lazy';
    imageWrapper.appendChild(img);
  }

  const info = document.createElement('div');
  info.className = 'badge-info';

  const cohortName = document.createElement('p');
  cohortName.className = 'badge-cohort-name';
  cohortName.textContent = loName;

  const sub = document.createElement('p');
  sub.className = 'badge-subtitle';
  sub.textContent = subtitle;

  info.append(cohortName, sub);
  card.append(imageWrapper, info);
  return card;
}

/**
 * Decorates the premium learning profile badges block
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  const config = getConfig();

  // Clear block
  block.innerHTML = '';

  const contentContainer = htmlToElement(`
    <div>
      <div class="badges-content"></div>
    </div>
  `);

  block.appendChild(contentContainer);

  const badgesContentEl = block.querySelector('.badges-content');

  // Show shimmer while loading
  const shimmer = new BrowseCardShimmer(MAX_BADGES);
  shimmer.addShimmer(badgesContentEl);

  const placeholders = await fetchLanguagePlaceholders().catch(() => ({}));

  // Non-blocking eligibility check — shimmer stays visible until resolved.
  // TODO: Remove isSignedInUser call and move signedIn check to isPLEligible function once cyclic dependency is resolved.
  isSignedInUser()
    .then((signedIn) => isPLEligible(signedIn))
    .then(async (isEligible) => {
      if (!isEligible) {
        shimmer.removeShimmer();
        if (UEAuthorMode) showFallbackContentInUEMode(block);
        else removePremiumLearningProfileBadgesSection(block);
        return;
      }

      try {
        const userId = getCookie('alm_user_id');

        if (!userId) {
          shimmer.removeShimmer();
          if (UEAuthorMode) showFallbackContentInUEMode(block);
          else removePremiumLearningProfileBadgesSection(block);
          return;
        }

        const badgesData = await fetchUserBadges(userId, config, MAX_BADGES);

        if (!badgesData || !badgesData.data || badgesData.data.length === 0) {
          shimmer.removeShimmer();
          if (UEAuthorMode) showFallbackContentInUEMode(block);
          else removePremiumLearningProfileBadgesSection(block);
          return;
        }

        const includedMap = {};
        if (badgesData.included) {
          badgesData.included.forEach((item) => {
            includedMap[`${item.type}:${item.id}`] = item;
          });
        }

        const completedBadges = badgesData.data.filter((userBadge) => userBadge?.attributes?.dateAchieved);

        if (completedBadges.length === 0) {
          shimmer.removeShimmer();
          if (UEAuthorMode) showFallbackContentInUEMode(block);
          else removePremiumLearningProfileBadgesSection(block);
          return;
        }

        const badgesGrid = htmlToElement('<div class="badges-grid"></div>');

        completedBadges.forEach((userBadge) => {
          const badgeId = userBadge.relationships?.badge?.data?.id;
          const modelId = userBadge.relationships?.model?.data?.id;

          const badge = badgeId ? includedMap[`badge:${badgeId}`] : null;
          const learningObject = modelId ? includedMap[`learningObject:${modelId}`] : null;

          if (badge) {
            const badgeCard = renderBadgeCard(badge, learningObject, placeholders);
            badgesGrid.appendChild(badgeCard);
          }
        });

        shimmer.removeShimmer();
        if (badgesGrid.childElementCount === 0) {
          if (UEAuthorMode) showFallbackContentInUEMode(block);
          else removePremiumLearningProfileBadgesSection(block);
          return;
        }
        badgesContentEl.innerHTML = '';
        badgesContentEl.appendChild(badgesGrid);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading premium learning badges:', error);
        shimmer.removeShimmer();
        if (UEAuthorMode) showFallbackContentInUEMode(block);
        else removePremiumLearningProfileBadgesSection(block);
      }
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error resolving PL eligibility for badges:', err);
      shimmer.removeShimmer();
      if (UEAuthorMode) showFallbackContentInUEMode(block);
      else removePremiumLearningProfileBadgesSection(block);
    });
}
