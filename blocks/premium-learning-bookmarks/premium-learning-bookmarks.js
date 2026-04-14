/* eslint-disable no-use-before-define */
import { htmlToElement } from '../../scripts/scripts.js';
import { buildPLCard } from '../../scripts/browse-card/browse-cards-premium-learning.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { getPLAccessToken } from '../../scripts/utils/pl-auth-utils.js';
import { fetchPremiumLearningBookmarks } from '../../scripts/user-actions/bookmark.js';
import getEmitter from '../../scripts/events.js';
import PL_CONTENT_TYPES from '../../scripts/data-service/premium-learning/premium-learning-constants.js';

const bookmarksEventEmitter = getEmitter('pl-bookmarks');
const SHIMMER_COUNT = 4;
const BATCH_SIZE = 6;

/**
 * Renders bookmark cards in batches
 * @param {HTMLElement} block - The block element
 * @param {Object} response - Response object with data and included arrays
 */
async function renderCards(block, response) {
  block.querySelector('.premium-learning-bookmarks-content')?.remove();

  const { data: bookmarks = [], included = [] } = response;

  // Use fixed count and type for shimmer
  const buildCardsShimmer = new BrowseCardShimmer(
    bookmarks.length || SHIMMER_COUNT,
    PL_CONTENT_TYPES.COURSE.MAPPING_KEY,
  );
  buildCardsShimmer.addShimmer(block.firstElementChild);
  buildCardsShimmer.shimmerContainer.classList.add('premium-learning-bookmarks-content');

  const wrapper = block.querySelector('.premium-learning-bookmarks-content');

  // Map to card data using the adaptor
  const { default: BrowseCardsPLAdaptor } = await import(
    '../../scripts/browse-card/browse-cards-premium-learning-adaptor.js'
  );
  const cardsData = await BrowseCardsPLAdaptor.mapResultsToCardsData({
    data: bookmarks,
    included,
  });

  async function processBatch(bookmarkBatch) {
    const shimmerWrappers = wrapper.querySelectorAll('.browse-card-shimmer-wrapper');
    await Promise.all(
      bookmarkBatch.map(async (bookmark, index) => {
        const cardDiv = shimmerWrappers[index];
        if (cardDiv) {
          // Mark as bookmarked since this is from bookmarks list
          const cardModel = { ...bookmark, bookmarked: true };

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

  async function processBookmarksInBatches(bookmarksData) {
    for (let i = 0; i < bookmarksData.length; i += BATCH_SIZE) {
      const batch = bookmarksData.slice(i, i + BATCH_SIZE);
      // eslint-disable-next-line no-await-in-loop
      await processBatch(batch);
    }
  }

  processBookmarksInBatches(cardsData).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Error rendering bookmark cards:', err);
  });
}

let onBookmarkChanged = null;

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

  // Trigger shimmer immediately by calling renderCards with empty response
  renderCards(block, { data: [], included: [] });

  // Fetch and render bookmarks
  fetchPremiumLearningBookmarks()
    .then((response) => {
      const { data: bookmarks = [] } = response;

      if (bookmarks.length === 0) {
        // Remove shimmer content when there are no bookmarks
        block.querySelector('.premium-learning-bookmarks-content')?.remove();
        block.classList.add('pl-bookmarks-empty');
        return;
      }

      // Store bookmarks in event emitter for potential updates
      bookmarksEventEmitter.set('bookmark_data', response);

      // Listen for bookmark changes
      onBookmarkChanged = async () => {
        const updatedBookmarks = await fetchPremiumLearningBookmarks();
        const existingContent = block.querySelector('.premium-learning-bookmarks-content');
        if (!updatedBookmarks?.data || updatedBookmarks.data.length === 0) {
          if (existingContent) existingContent.remove();
          block.classList.add('pl-bookmarks-empty');
        } else {
          block.classList.remove('pl-bookmarks-empty');
          await renderCards(block, updatedBookmarks);
        }
      };
      bookmarksEventEmitter.on('bookmark_changed', onBookmarkChanged);

      // Render actual cards
      renderCards(block, response);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error loading PL bookmarks:', err);
    });
}
