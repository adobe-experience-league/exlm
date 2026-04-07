import { createTag, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { getConfig } from '../../scripts/lib-franklin.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { fetchUserEnrollments } from '../../scripts/data-service/premium-learning-data-service.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

function showFallbackContentInUEMode(blockElement) {
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  contentDiv.textContent =
    'This block will load the Premium learning active content (enrolled cohorts) for Premium users only.';
  blockElement.appendChild(contentDiv);
}

/**
 * Decorate function to display premium-learning-active-content with enrolled cohorts.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block in authoring order
  const [headingElement, descriptionElement, ctaElement] = [...block.children];

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'premium-learning-active-content-block');

  // Create header section with heading, description and CTA
  const headerDiv = document.createElement('div');
  headerDiv.className = 'premium-learning-active-content-block-header';
  headerDiv.innerHTML = `
    <div class="premium-learning-active-content-block-title">
      ${headingElement?.innerHTML || ''}
      ${
        descriptionElement?.innerHTML
          ? `<div class="premium-learning-active-content-block-description">${descriptionElement.innerHTML}</div>`
          : ''
      }
    </div>
    <div class="premium-learning-active-content-block-cta">
      ${ctaElement?.innerHTML ? decorateCustomButtons(ctaElement) : ''}
    </div>
  `;
  block.appendChild(headerDiv);

  const placeholders = await fetchLanguagePlaceholders().catch(() => ({}));
  const config = getConfig();
  const noOfResults = 10;

  // Show shimmer while loading
  const buildCardsShimmer = new BrowseCardShimmer(4, 'premium-learning-cohort');
  buildCardsShimmer.addShimmer(block);

  try {
    // Fetch enrolled cohorts (learningProgram)
    const enrollmentData = await fetchUserEnrollments(config, 'learningProgram', noOfResults);

    buildCardsShimmer.removeShimmer();

    if (enrollmentData?.data?.length) {
      // Extract learning object IDs from enrollments
      const enrolledCohortIds = enrollmentData.data
        .map((enrollment) => enrollment.relationships?.learningObject?.data?.id)
        .filter(Boolean);

      if (enrolledCohortIds.length > 0) {
        // Fetch full card data for these cohorts using BrowseCardsDelegate
        const cardDataPromises = enrolledCohortIds.slice(0, 4).map(async (cohortId) => {
          // Fetch individual cohort data - you may need to adjust this based on your API
          const cohortData = await BrowseCardsDelegate.fetchCardData({
            contentType: 'premium-learning-cohort',
            noOfResults: 1,
            cohortId,
          });
          return cohortData?.[0];
        });

        const cardsData = (await Promise.all(cardDataPromises)).filter(Boolean);

        if (cardsData.length > 0) {
          const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
          for (let i = 0; i < cardsData.length; i += 1) {
            const cardData = cardsData[i];
            const cardDiv = document.createElement('div');
            await buildCard(cardDiv, cardData);
            contentDiv.appendChild(cardDiv);
          }
          block.appendChild(contentDiv);
        } else {
          // Show no results message
          const noResultsDiv = createTag('div', { class: 'premium-learning-active-content-no-results' });
          noResultsDiv.textContent =
            placeholders.premiumLearningActiveContentNoResults || 'No active enrolled content available at this time.';
          block.appendChild(noResultsDiv);
        }
      } else {
        // No enrolled cohorts
        const noResultsDiv = createTag('div', { class: 'premium-learning-active-content-no-results' });
        noResultsDiv.textContent =
          placeholders.premiumLearningActiveContentNoResults || 'No active enrolled content available at this time.';
        block.appendChild(noResultsDiv);
      }
    } else {
      // No enrollments found
      const noResultsDiv = createTag('div', { class: 'premium-learning-active-content-no-results' });
      noResultsDiv.textContent =
        placeholders.premiumLearningActiveContentNoResults || 'No active enrolled content available at this time.';
      block.appendChild(noResultsDiv);
    }
  } catch (err) {
    buildCardsShimmer.removeShimmer();
    if (!UEAuthorMode) {
      block.remove();
    } else {
      showFallbackContentInUEMode(block);
    }
    /* eslint-disable-next-line no-console */
    console.error('Error fetching active content:', err);
  }
}
