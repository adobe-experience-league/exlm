/* eslint-disable no-use-before-define */
import { htmlToElement } from '../../scripts/scripts.js';
import { buildPLCard } from '../../scripts/browse-card/browse-cards-premium-learning.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { getPLAccessToken } from '../../scripts/utils/pl-auth-utils.js';
import { fetchPremiumLearningBookmarks } from '../../scripts/user-actions/bookmark.js';
import getEmitter from '../../scripts/events.js';
import PL_CONTENT_TYPES from '../../scripts/data-service/premium-learning/premium-learning-constants.js';
import BrowseCardsPLAdaptor from '../../scripts/browse-card/browse-cards-premium-learning-adaptor.js';

const bookmarksEventEmitter = getEmitter('pl-bookmarks');
const SHIMMER_COUNT = 4;
const BATCH_SIZE = 6;

/**
 * Renders bookmark cards in batches
 * @param {HTMLElement} block - The block element
 * @param {Array} cardModels - Array of card model data from adaptor
 */
async function renderCards(block, cardModels) {
  block.querySelector('.premium-learning-bookmarks-content')?.remove();

  // Use fixed count and type for shimmer
  const buildCardsShimmer = new BrowseCardShimmer(
    cardModels.length || SHIMMER_COUNT,
    PL_CONTENT_TYPES.COURSE.MAPPING_KEY,
  );
  buildCardsShimmer.addShimmer(block.firstElementChild);
  buildCardsShimmer.shimmerContainer.classList.add('premium-learning-bookmarks-content');

  const wrapper = block.querySelector('.premium-learning-bookmarks-content');

  async function processBatch(cardModelBatch) {
    const shimmerWrappers = wrapper.querySelectorAll('.browse-card-shimmer-wrapper');
    await Promise.all(
      cardModelBatch.map(async (cardModel, index) => {
        const cardDiv = shimmerWrappers[index];
        if (cardDiv) {
          cardDiv.textContent = '';
          cardDiv.classList.remove('browse-card-shimmer-wrapper-medium-card', 'browse-card-shimmer-wrapper');
          cardDiv.classList.add('premium-learning-bookmarks-card');
          await buildPLCard(cardDiv, cardModel);

          // Set bookmarked state immediately to prevent white icon flash
          const bookmarkBtn = cardDiv.querySelector('.bookmark[data-pl-bookmark="true"]');
          if (bookmarkBtn) {
            bookmarkBtn.dataset.bookmarked = 'true';
          }
        }
      }),
    );
  }

  buildCardsShimmer.shimmerContainer.classList.remove('browse-card-shimmer');

  async function processCardsInBatches(cardsData) {
    for (let i = 0; i < cardsData.length; i += BATCH_SIZE) {
      const batch = cardsData.slice(i, i + BATCH_SIZE);
      // eslint-disable-next-line no-await-in-loop
      await processBatch(batch);
    }
  }

  await processCardsInBatches(cardModels);
}

/**
 * Decorates the premium learning bookmarks block
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  const [headerWrapper] = block.children;
  const header = headerWrapper?.firstElementChild?.firstElementChild;
  const headerHTML = header?.outerHTML || '<h2>My Bookmarks</h2>';

  block.innerHTML = '';

  const content = htmlToElement(`
    <div>
        <div class="premium-learning-bookmarks-header">
            ${headerHTML}
        </div>
    </div>
  `);

  block.appendChild(content);

  // Check if user has PL access token
  if (!getPLAccessToken()) return;

  // Trigger shimmer immediately by calling renderCards with empty array
  renderCards(block, []).catch(() => {});

  // Fetch and render bookmarks
  fetchPremiumLearningBookmarks()
    .then(async (responseData) => {
      // Transform API response using adaptor
      const cardModels = await BrowseCardsPLAdaptor.mapResultsToCardsData(
        responseData?.data?.length
          ? { data: responseData.data, included: responseData.included ?? [] }
          : { data: [], included: [] },
      );

      if (cardModels.length === 0) {
        // Remove shimmer content if no bookmarks
        block.querySelector('.premium-learning-bookmarks-content')?.remove();
        block.classList.add('pl-bookmarks-empty');
        return;
      }

      // Store bookmarks in event emitter for potential updates
      bookmarksEventEmitter.set('bookmark_data', cardModels);

      // Listen for bookmark changes
      bookmarksEventEmitter.on('bookmark_changed', async () => {
        try {
          const updatedResponseData = await fetchPremiumLearningBookmarks();
          const updatedCardModels = await BrowseCardsPLAdaptor.mapResultsToCardsData(
            updatedResponseData?.data?.length
              ? { data: updatedResponseData.data, included: updatedResponseData.included ?? [] }
              : { data: [], included: [] },
          );
          const existingContent = block.querySelector('.premium-learning-bookmarks-content');
          if (updatedCardModels.length === 0) {
            if (existingContent) existingContent.remove();
            block.classList.add('pl-bookmarks-empty');
          } else {
            block.classList.remove('pl-bookmarks-empty');
            await renderCards(block, updatedCardModels);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error updating PL bookmarks after change:', error);
        }
      });

      // Render actual cards
      await renderCards(block, cardModels);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error loading PL bookmarks:', error);
      block.querySelector('.premium-learning-bookmarks-content')?.remove();
      block.classList.add('pl-bookmarks-empty');
    });
}
