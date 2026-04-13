/* eslint-disable no-use-before-define */
import { htmlToElement, getConfig, getPathDetails } from '../../scripts/scripts.js';
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
 * Check if a course/cohort is new (created within the last 90 days)
 * @param {Object} learningObject - The learning object
 * @returns {boolean} True if created within 90 days
 */
function isNewContent(learningObject) {
  const ONE_DAY_IN_SECONDS = 86400;
  const attrs = learningObject.attributes || {};

  const createdDate = attrs.dateCreated ? new Date(attrs.dateCreated) : null;

  if (!createdDate) return false;

  const now = Date.now();
  const days90 = 90 * ONE_DAY_IN_SECONDS * 1000;

  return now - createdDate.getTime() <= days90;
}

/**
 * Transforms PL API response into card model format
 * @param {Object} learningObject - Learning object from PL API
 * @returns {Object} Card model object
 */
function transformToCardModel(learningObject) {
  const { id, attributes, relationships } = learningObject;
  const { localizedMetadata = [], dateCreated, loFormat, duration, rating } = attributes;

  // Get localized metadata (title, description, etc.)
  const metadata = localizedMetadata[0] || {};
  const { name: title, description, overview } = metadata;

  // Determine content type based on loType
  const loType = attributes.loType?.toLowerCase();
  const contentType =
    loType === 'learningprogram' ? PL_CONTENT_TYPES.COHORT.MAPPING_KEY : PL_CONTENT_TYPES.COURSE.MAPPING_KEY;

  // Extract thumbnail URL from attributes or construct it
  let thumbnail = attributes.imageUrl || null;

  // If no direct imageUrl, try to construct from cardArt relationship or use loResource
  if (!thumbnail && relationships?.cardArt?.links?.self) {
    thumbnail = relationships.cardArt.links.self;
  } else if (!thumbnail) {
    // Fallback: construct standard thumbnail URL
    thumbnail = `${getConfig().plApiBaseUrl}/learningObjects/${id}/loResources/cardArt`;
  }

  // Build view link - format: /en/premium/course/14812898
  // Extract numeric ID from full ID (e.g., "course:14812898" -> "14812898")
  const numericId = id.includes(':') ? id.split(':')[1] : id;
  const { lang } = getPathDetails();
  const viewLink = `/${lang}/premium/${loType}/${numericId}`;
  const copyLink = `${window.location.origin}${viewLink}`;

  // Format duration for display
  const durationText = duration ? `${Math.round(duration / 60)} min` : '';

  // Get level from enrollmentOptions if available
  const level = attributes.level || '';

  // Check if content is new (created within 90 days)
  const isNew = isNewContent(learningObject);

  return {
    id,
    contentType,
    thumbnail,
    title,
    description: overview || description || '',
    viewLink,
    copyLink,
    bookmarked: true, // Mark as bookmarked since this is from bookmarks list
    meta: {
      duration: durationText,
      level,
      loFormat,
      rating: {
        average: rating?.averageRating || 0,
        count: rating?.ratingsCount || 0,
      },
      isNew,
      dateCreated,
    },
  };
}

/**
 * Renders bookmark cards in batches
 * @param {HTMLElement} block - The block element
 * @param {Array} bookmarks - Array of bookmark data
 */
async function renderCards(block, bookmarks) {
  block.querySelector('.premium-learning-bookmarks-content')?.remove();

  // Use fixed count and type for shimmer
  const buildCardsShimmer = new BrowseCardShimmer(
    bookmarks.length || SHIMMER_COUNT,
    PL_CONTENT_TYPES.COURSE.MAPPING_KEY,
  );
  buildCardsShimmer.addShimmer(block.firstElementChild);
  buildCardsShimmer.shimmerContainer.classList.add('premium-learning-bookmarks-content');

  const wrapper = block.querySelector('.premium-learning-bookmarks-content');

  async function processBatch(bookmarkBatch) {
    const shimmerWrappers = wrapper.querySelectorAll('.browse-card-shimmer-wrapper');
    await Promise.all(
      bookmarkBatch.map(async (bookmark, index) => {
        const cardDiv = shimmerWrappers[index];
        if (cardDiv) {
          const cardModel = transformToCardModel(bookmark);
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

  processBookmarksInBatches(bookmarks);
}

/**
 * Decorates the premium learning bookmarks block
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  const [headerWrapper, order] = block.children;
  const header = headerWrapper?.firstElementChild?.firstElementChild;
  const headerHTML = header?.outerHTML || '<h2>My Bookmarks</h2>';
  const orderText = order?.textContent || '';

  block.innerHTML = '';

  const content = htmlToElement(`
    <div>
        <div class="premium-learning-bookmarks-header">
            ${headerHTML}
            <div>${orderText}</div>
        </div>
    </div>
  `);

  block.appendChild(content);

  // Check if user has PL access token
  if (!getPLAccessToken()) return;

  // Trigger shimmer immediately by calling renderCards with empty array
  renderCards(block, []);

  // Fetch and render bookmarks
  fetchPremiumLearningBookmarks().then((bookmarks) => {
    if (bookmarks.length === 0) {
      block.classList.add('pl-bookmarks-empty');
      return;
    }

    // Store bookmarks in event emitter for potential updates
    bookmarksEventEmitter.set('bookmark_data', bookmarks);

    // Listen for bookmark changes
    bookmarksEventEmitter.on('bookmark_changed', async () => {
      const updatedBookmarks = await fetchPremiumLearningBookmarks();
      const existingContent = block.querySelector('.premium-learning-bookmarks-content');
      if (updatedBookmarks.length === 0) {
        if (existingContent) existingContent.remove();
        block.classList.add('pl-bookmarks-empty');
      } else {
        block.classList.remove('pl-bookmarks-empty');
        await renderCards(block, updatedBookmarks);
      }
    });

    // Render actual cards
    renderCards(block, bookmarks);
  });
}
