/* eslint-disable no-use-before-define */
import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { buildPLCard } from '../../scripts/browse-card/browse-cards-premium-learning.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { isPLEligible } from '../../scripts/utils/premium-learning-utils.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import { fetchPremiumLearningBookmarks } from '../../scripts/user-actions/bookmark.js';
import getEmitter from '../../scripts/events.js';
import PL_CONTENT_TYPES from '../../scripts/data-service/premium-learning/premium-learning-constants.js';
import BrowseCardsPLAdaptor from '../../scripts/browse-card/browse-cards-premium-learning-adaptor.js';

const bookmarksEventEmitter = getEmitter('pl-bookmarks');

const SHIMMER_COUNT = 4;
const BATCH_SIZE = 6;
const CARDS_PER_PAGE = 12;

// Pagination state
let allCardModels = [];
let currentPage = 1;

/**
 * Get pagination text
 * @param {number} totalPages - Total number of pages
 * @param {Object} placeHolders - Language placeholders object
 * @returns {string} Pagination text
 */
function getPaginationText(totalPages, placeHolders) {
  if (totalPages > 1) {
    return placeHolders?.filterPagesLabel
      ? placeHolders?.filterPagesLabel?.replace('{}', totalPages)
      : `of ${totalPages} pages`;
  }
  return placeHolders?.filterPageLabel
    ? placeHolders?.filterPageLabel?.replace('{}', totalPages)
    : `of ${totalPages} page`;
}

/**
 * Renders pagination controls
 * @param {HTMLElement} block - The block element
 * @param {Object} placeHolders - Language placeholders object
 */
function renderPagination(block, placeHolders) {
  const totalPages = Math.ceil(allCardModels.length / CARDS_PER_PAGE);

  // Remove existing pagination if any
  block.querySelector('.premium-learning-bookmarks-pagination')?.remove();

  if (totalPages <= 1) return;

  const paginationEl = htmlToElement(`
    <div class="premium-learning-bookmarks-pagination">
      <button class="nav-arrow" aria-label="previous page"></button>
      <input type="number" min="1" max="${totalPages}" class="bookmarks-pg-input" aria-label="Enter page number" value="${currentPage}">
      <span class="pagination-text">${getPaginationText(totalPages, placeHolders)}</span>
      <button class="nav-arrow right-nav-arrow" aria-label="next page"></button>
    </div>
  `);

  // Handle navigation buttons
  const [prevBtn, nextBtn] = paginationEl.querySelectorAll('.nav-arrow');

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderCurrentPage(block, placeHolders).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error rendering page:', err);
      });
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      renderCurrentPage(block, placeHolders).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error rendering page:', err);
      });
    }
  });

  // Handle page input
  const pageInput = paginationEl.querySelector('.bookmarks-pg-input');
  pageInput.addEventListener('change', (e) => {
    let newPage = parseInt(e.target.value, 10);
    if (Number.isNaN(newPage)) newPage = currentPage;
    if (newPage < 1) newPage = 1;
    if (newPage > totalPages) newPage = totalPages;

    currentPage = newPage;
    e.target.value = currentPage;
    renderCurrentPage(block, placeHolders).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error rendering page:', err);
    });
  });

  // Update button states
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
  prevBtn.classList.toggle('nav-arrow-hidden', currentPage === 1);
  nextBtn.classList.toggle('nav-arrow-hidden', currentPage === totalPages);

  block.appendChild(paginationEl);
}

/**
 * Renders current page of bookmark cards
 * @param {HTMLElement} block - The block element
 * @param {Object} placeHolders - Language placeholders object
 * @param {boolean} shouldScroll - Whether to scroll to block (default: true)
 */
async function renderCurrentPage(block, placeHolders, shouldScroll = true) {
  const startIdx = (currentPage - 1) * CARDS_PER_PAGE;
  const endIdx = startIdx + CARDS_PER_PAGE;
  const pageCardModels = allCardModels.slice(startIdx, endIdx);

  await renderCards(block, pageCardModels);
  renderPagination(block, placeHolders);

  // Only scroll on user-initiated navigation
  if (shouldScroll) {
    block.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Renders bookmark cards in batches with shimmer
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
  // Fetch placeholders for pagination text
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

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

  // Show shimmer immediately while eligibility resolves.
  renderCards(block, []).catch(() => {});

  // Non-blocking eligibility check — shimmer stays visible until resolved.
  // TODO: Remove isSignedInUser call and move signedIn check to isPLEligible function once cyclic dependency is resolved.
  isSignedInUser()
    .then((signedIn) => isPLEligible(signedIn))
    .then(async (isEligible) => {
      if (!isEligible) {
        block.querySelector('.premium-learning-bookmarks-content')?.remove();
        block.classList.add('pl-bookmarks-empty');
        return;
      }

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
            // Clear entire block if no bookmarks
            allCardModels = [];
            currentPage = 1;
            block.innerHTML = '';
            block.classList.add('pl-bookmarks-empty');
            return;
          }

          // Store all card models for pagination
          allCardModels = cardModels;
          currentPage = 1;

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

              if (updatedCardModels.length === 0) {
                // Clear entire block if no bookmarks
                allCardModels = [];
                currentPage = 1;
                block.innerHTML = '';
                block.classList.add('pl-bookmarks-empty');
              } else {
                block.classList.remove('pl-bookmarks-empty');
                allCardModels = updatedCardModels;
                currentPage = 1;
                await renderCurrentPage(block, placeholders, false);
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Error updating PL bookmarks after change:', error);
            }
          });

          // Render first page (no scroll on initial load)
          await renderCurrentPage(block, placeholders, false);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Error loading PL bookmarks:', error);
          block.querySelector('.premium-learning-bookmarks-content')?.remove();
          block.classList.add('pl-bookmarks-empty');
        });
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error resolving PL eligibility for bookmarks:', err);
      block.querySelector('.premium-learning-bookmarks-content')?.remove();
      block.classList.add('pl-bookmarks-empty');
    });
}
