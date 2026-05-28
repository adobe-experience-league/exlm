import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { createTag, fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { getMetadata } from '../../scripts/lib-franklin.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { COVEO_SEARCH_CUSTOM_EVENTS } from '../../scripts/search/search-utils.js';
import { isPLEligible } from '../../scripts/utils/premium-learning-utils.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';

const isSearchPage = getMetadata('theme')?.includes('search') || false;
const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

/**
 * Extracts selected values from facets, populates param object, and generates URL search parameters
 * @param {Object} param - The param object to populate
 * @param {Object} body - The body object containing facets and query
 * @returns {string} URL search parameters string (e.g., "q=aem")
 */
function transformCoveoFacetsToPlSearch(param, body) {
  param.q = body.q ?? '';
  const urlParams = new URLSearchParams();
  if (param.q) {
    urlParams.append('q', param.q);
  }
  return urlParams.toString();
}

const fragment = () => window.location.hash.slice(1);

const updateHash = (filterCondition, joinWith = '&') => {
  const currentHash = fragment();
  const updatedParts = currentHash.split('&').filter(filterCondition);
  window.location.hash = updatedParts.join(joinWith);
};

function showFallbackContentInUEMode(blockElement) {
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  contentDiv.textContent =
    'This block will load the Premium learning content on the search page for Premium users only.';
  blockElement.appendChild(contentDiv);
}

function handleEmptyPremiumLearningSection(section) {
  if (section && !UEAuthorMode && !section.querySelector('.block')) {
    section.remove();
  }
}

/**
 * Decorate function to process and log the mapped data for premium-learning cards.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  const premiumLearningSection = block.closest('.premium-learning-section');

  // Extracting elements from the block in authoring order
  const [headingElement, ctaElement, contentTypeElement] = [...block.children];

  // contentType is string if single selection,made into an array if multiple selections
  let contentType = contentTypeElement?.textContent?.trim()?.toLowerCase();
  if (contentType && contentType.includes(',')) {
    contentType = contentType
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean);
  }

  const FETCH_LIMIT = 10;
  const DISPLAY_LIMIT = 4;

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'premium-learning-search-block');
  if (!UEAuthorMode) {
    block.classList.add('premium-learning-search-hide-content');
  }

  // Create header section with heading and CTA
  const headerDiv = document.createElement('div');
  headerDiv.className = 'premium-learning-search-block-header';
  headerDiv.innerHTML = `
    <div class="premium-learning-search-block-title">
      ${headingElement?.innerHTML || ''}
    </div>
    <div class="premium-learning-search-header-cta-slot"></div>
  `;
  block.appendChild(headerDiv);
  const headerCtaSlot = headerDiv.querySelector('.premium-learning-search-header-cta-slot');
  const ctaWrapper = createTag('div', { class: 'premium-learning-search-block-cta' });
  ctaWrapper.innerHTML = decorateCustomButtons(ctaElement);
  headerCtaSlot.appendChild(ctaWrapper);
  const updateCTASearch = (searchString) => {
    const anchor = ctaWrapper.querySelector('a');
    const href = anchor?.getAttribute('href');

    if (href) {
      const url = new URL(href, document.baseURI);
      url.search = searchString;
      anchor.setAttribute('href', url.toString());
    }
  };

  const param = {
    contentType, // Can be string ('premium-learning-course' or 'premium-learning-cohort') or array (['premium-learning-course', 'premium-learning-cohort'])
    noOfResults: FETCH_LIMIT,
  };

  const buildCardsShimmer = new BrowseCardShimmer(DISPLAY_LIMIT, contentType);
  buildCardsShimmer.addShimmer(block);

  const placeholders = await fetchLanguagePlaceholders().catch(() => ({}));

  let lastSearchQuery = null;
  let fetchAndRenderCardsRef = null;
  let resolveEligibility;
  let attachedToAtomicSearch = false;
  let shimmerRemoveTimer = null;
  let premiumSearchWrapperRef = null;
  let premiumSearchResizeObserver = null;
  const PREMIUM_SEARCH_MAX_WIDTH = 1200;

  function shouldApplyAbsolutePremiumLayout(wrapper = premiumSearchWrapperRef) {
    const searchLayout = wrapper?.closest('atomic-search-layout');
    const hasVisibleNoResults = !!block.querySelector(
      '.premium-learning-search-no-results:not(.premium-learning-search-hide-content)',
    );
    return (
      !!searchLayout &&
      searchLayout.classList.contains('no-results') &&
      !!searchLayout.querySelector('.all-facets-hidden') &&
      !hasVisibleNoResults
    );
  }

  function syncPremiumSearchWrapperLayout(wrapper = premiumSearchWrapperRef) {
    if (!wrapper) return;
    if (!shouldApplyAbsolutePremiumLayout(wrapper)) {
      wrapper.style.removeProperty('--premium-learning-search-left');
      wrapper.style.setProperty('--atomic-search-premium-search-height', '0px');
      return;
    }

    const wrapperRect = wrapper.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const effectiveWidth = Math.min(viewportWidth, viewportWidth * 0.9, PREMIUM_SEARCH_MAX_WIDTH);
    const viewportCenteredLeft = (viewportWidth - effectiveWidth) / 2;
    const leftOffset = Math.round(viewportCenteredLeft - wrapperRect.left);
    wrapper.style.setProperty('--premium-learning-search-left', `${leftOffset}px`);
    wrapper.style.setProperty('--atomic-search-premium-search-height', `${Math.max(block.offsetHeight, 0)}px`);
  }

  function schedulePremiumSearchLayoutSync() {
    syncPremiumSearchWrapperLayout();
  }

  function observePremiumSearchLayout() {
    if (premiumSearchResizeObserver || !window.ResizeObserver) return;

    premiumSearchResizeObserver = new window.ResizeObserver(() => {
      schedulePremiumSearchLayoutSync();
    });
    premiumSearchResizeObserver.observe(block);
    if (premiumSearchWrapperRef) {
      premiumSearchResizeObserver.observe(premiumSearchWrapperRef);
    }
  }

  function disconnectPremiumSearchLayoutObservers() {
    premiumSearchResizeObserver?.disconnect();
    premiumSearchResizeObserver = null;
  }

  function clearPendingShimmerRemoval() {
    if (shimmerRemoveTimer) {
      clearTimeout(shimmerRemoveTimer);
      shimmerRemoveTimer = null;
    }
  }

  function attachToAtomicSearchWrapper(wrapperRoot) {
    if (attachedToAtomicSearch) return;

    const premiumSearchWrapper = wrapperRoot.querySelector('.atomic-search-premium-search-wrapper');
    if (premiumSearchWrapper) {
      block.classList.add('premium-learning-search-atomic-search');
      premiumSearchWrapper.appendChild(block);
      premiumSearchWrapperRef = premiumSearchWrapper;
      syncPremiumSearchWrapperLayout(premiumSearchWrapper);
      observePremiumSearchLayout();
      handleEmptyPremiumLearningSection(premiumLearningSection);
      attachedToAtomicSearch = true;
    }
  }

  const eligibilityPromise = new Promise((resolve) => {
    resolveEligibility = resolve;
  });

  if (isSearchPage && !UEAuthorMode) {
    document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.PREPROCESS, (e) => {
      eligibilityPromise
        .then((isEligible) => {
          if (!isEligible) {
            return;
          }

          const { body, method = '' } = e.detail;
          if (method === 'search' && body !== undefined) {
            const newQuery = (body?.q ?? '').trim();
            setTimeout(() => {
              attachToAtomicSearchWrapper(document);
            }, 0);

            if (lastSearchQuery === newQuery) {
              return;
            }
            lastSearchQuery = newQuery;

            const urlString = transformCoveoFacetsToPlSearch(param, body);
            param.searchMode = true;
            const contentWrapper = block.querySelector('.browse-cards-block-content');
            if (contentWrapper) {
              block.removeChild(contentWrapper);
            }
            buildCardsShimmer.addShimmer(block);

            fetchAndRenderCardsRef({ ...param, searchUrlString: urlString });
          }
        })
        .catch((err) => {
          /* eslint-disable-next-line no-console */
          console.error('Error processing PREPROCESS event:', err);
        });
    });

    document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.SEARCH_DOM_READY, (e) => {
      eligibilityPromise
        .then((isEligible) => {
          if (!isEligible) {
            return;
          }

          const searchBlockElement = e.detail?.block;
          if (searchBlockElement) {
            const delta = 30;
            searchBlockElement.classList.add('atomic-search-with-premium-search');
            searchBlockElement.style.setProperty(
              '--atomic-search-skeleton-margin-top',
              `${Math.max(block.offsetHeight - delta, 0)}px`,
            );
            schedulePremiumSearchLayoutSync();
          }
        })
        .catch((err) => {
          /* eslint-disable-next-line no-console */
          console.error('Error processing SEARCH_DOM_READY event:', err);
        });
    });
  }

  // Non-blocking eligibility check — shimmer stays visible until resolved.
  // TODO: Remove isSignedInUser call and move signedIn check to isPLEligible function once cyclic dependency is resolved.
  isSignedInUser()
    .then((signedIn) => {
      if (signedIn) {
        block.classList.remove('premium-learning-search-hide-content');
      }
      return isPLEligible(signedIn);
    })
    .then((isEligibleResult) => {
      if (!isEligibleResult) {
        resolveEligibility(false);
        clearPendingShimmerRemoval();
        disconnectPremiumSearchLayoutObservers();
        buildCardsShimmer.removeShimmer();
        if (UEAuthorMode) {
          showFallbackContentInUEMode(block);
        } else {
          block.remove();
          handleEmptyPremiumLearningSection(premiumLearningSection);
        }
        return;
      }

      function renderNoResultsContent(blockElement, searchText = '') {
        const searchTextExists = searchText?.trim()?.length > 0;
        const noSearchDescription =
          placeholders.premiumLearningCardsNoSearchDescription ||
          'Try searching for a specific product or role, or explore all Premium learning content.';
        const searchDescription =
          placeholders.premiumLearningCardsSearchDescription ||
          'Try a different keyword, or explore all Premium Learning content.';
        const noSearchHeader = placeholders.premiumLearningCardsNoSearchHeader || 'No Premium Learning search results.';
        const searchHeader =
          placeholders.premiumLearningCardsSearchHeader || 'No Premium Learning search results for "{}".';
        const headerNoResultText = searchTextExists ? searchHeader.replace('{}', searchText) : noSearchHeader;
        const descriptionNoResultText = searchTextExists ? searchDescription : noSearchDescription;
        const clearSearchText = placeholders.premiumLearningCardsClearSearchText || 'Clear search';

        let root = blockElement.querySelector('.premium-learning-search-no-results');
        if (!root) {
          const markup = `
          <div class="premium-learning-search-no-results">
            <div class="premium-learning-search-no-results-header"></div>
            <div class="premium-learning-search-no-results-description"></div>
            <div class="premium-learning-search-no-results-cta-slot"></div>
            <div class="premium-learning-search-clear-search"></div>
          </div>
        `;
          root = htmlToElement(markup);
          root.addEventListener('click', (e) => {
            if (e.target.closest('.premium-learning-search-clear-search')) {
              updateHash((key) => !key.includes('q='), '&');
            }
          });
          blockElement.appendChild(root);
        }

        const headerEl = root.querySelector('.premium-learning-search-no-results-header');
        const descEl = root.querySelector('.premium-learning-search-no-results-description');
        const noResultsCtaSlot = root.querySelector('.premium-learning-search-no-results-cta-slot');
        const clearEl = root.querySelector('.premium-learning-search-clear-search');
        if (headerEl) headerEl.textContent = headerNoResultText;
        if (descEl) descEl.textContent = descriptionNoResultText;
        if (clearEl) {
          clearEl.textContent = clearSearchText;
          if (searchTextExists) {
            clearEl.classList.remove('premium-learning-search-hide-content');
          } else {
            clearEl.classList.add('premium-learning-search-hide-content');
          }
        }
        if (noResultsCtaSlot) {
          noResultsCtaSlot.appendChild(ctaWrapper);
        }
        root.classList.remove('premium-learning-search-hide-content');
      }

      function toggleNoResultsContent(blockElement, show) {
        if (show) {
          renderNoResultsContent(blockElement, param.q);
          headerDiv.classList.add('premium-learning-search-hide-content');
          schedulePremiumSearchLayoutSync();
        } else {
          headerCtaSlot.appendChild(ctaWrapper);
          const noResultsRoot = blockElement.querySelector('.premium-learning-search-no-results');
          if (noResultsRoot) {
            noResultsRoot.classList.add('premium-learning-search-hide-content');
          }
          headerDiv.classList.remove('premium-learning-search-hide-content');
          schedulePremiumSearchLayoutSync();
        }
      }

      function fetchAndRenderCards(params) {
        clearPendingShimmerRemoval();
        toggleNoResultsContent(block, false);
        const browseCardsContent = BrowseCardsDelegate.fetchCardData(params);
        browseCardsContent
          .then((data) => {
            if (data?.length) {
              const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
              for (let i = 0; i < Math.min(DISPLAY_LIMIT, data.length); i += 1) {
                const cardData = data[i];
                const cardDiv = document.createElement('div');
                buildCard(cardDiv, cardData);
                contentDiv.appendChild(cardDiv);
              }
              block.appendChild(contentDiv);
              if (params.searchUrlString) {
                updateCTASearch(params.searchUrlString);
              }
              shimmerRemoveTimer = setTimeout(() => {
                shimmerRemoveTimer = null;
                buildCardsShimmer.removeShimmer();
                schedulePremiumSearchLayoutSync();
              }, 100);
            } else {
              buildCardsShimmer.removeShimmer();
              toggleNoResultsContent(block, true);
              syncPremiumSearchWrapperLayout();
              updateCTASearch('');
            }
          })
          .catch((err) => {
            clearPendingShimmerRemoval();
            disconnectPremiumSearchLayoutObservers();
            buildCardsShimmer.removeShimmer();
            if (UEAuthorMode) {
              showFallbackContentInUEMode(block);
            } else {
              block.remove();
              handleEmptyPremiumLearningSection(premiumLearningSection);
            }
            /* eslint-disable-next-line no-console */
            console.error(err);
          });
      }

      if (isSearchPage && !UEAuthorMode) {
        resolveEligibility(isEligibleResult);
        fetchAndRenderCardsRef = fetchAndRenderCards;
      } else {
        fetchAndRenderCards(param);
      }
    })
    .catch((err) => {
      resolveEligibility(false);
      clearPendingShimmerRemoval();
      disconnectPremiumSearchLayoutObservers();
      buildCardsShimmer.removeShimmer();
      if (UEAuthorMode) {
        showFallbackContentInUEMode(block);
      } else {
        block.remove();
        handleEmptyPremiumLearningSection(premiumLearningSection);
      }
      /* eslint-disable-next-line no-console */
      console.error('Error resolving PL eligibility for search:', err);
    });
}
