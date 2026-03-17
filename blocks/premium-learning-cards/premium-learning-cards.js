import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { createTag, fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { getMetadata } from '../../scripts/lib-franklin.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { COVEO_SEARCH_CUSTOM_EVENTS } from '../../scripts/search/search-utils.js';
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

/**
 * Decorate function to process and log the mapped data for premium-learning cards.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
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

  const noOfResults = 4;

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'premium-learning-cards-block');

  // Create header section with heading and CTA
  const headerDiv = document.createElement('div');
  headerDiv.className = 'premium-learning-cards-block-header';
  headerDiv.innerHTML = `
    <div class="premium-learning-cards-block-title">
      ${headingElement?.innerHTML || ''}
    </div>
    <div class="premium-learning-cards-block-cta">
      ${decorateCustomButtons(ctaElement)}
    </div>
  `;
  block.appendChild(headerDiv);

  const [signInUser, placeholders] = await Promise.all([
    isSignedInUser(),
    fetchLanguagePlaceholders().catch(() => ({})),
  ]);

  if (!signInUser) {
    if (UEAuthorMode) {
      showFallbackContentInUEMode(block);
    } else {
      block.remove();
    }
    return;
  }

  const param = {
    contentType, // Can be string ('premium-learning-course' or 'premium-learning-cohort') or array (['premium-learning-course', 'premium-learning-cohort'])
    noOfResults,
  };

  const buildCardsShimmer = new BrowseCardShimmer(noOfResults, contentType);
  buildCardsShimmer.addShimmer(block);

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
      placeholders.premiumLearningCardsSearchHeader || 'No Premium Learning search results for “{}”.';
    const headerNoResultText = searchTextExists ? searchHeader.replace('{}', searchText) : noSearchHeader;
    const descriptionNoResultText = searchTextExists ? searchDescription : noSearchDescription;
    const clearSearchText = placeholders.premiumLearningCardsClearSearchText || 'Clear search';
    const markup = `
      <div class="premium-learning-cards-no-results">
        <div class="premium-learning-cards-no-results-header">${headerNoResultText}</div>
        <div class="premium-learning-cards-no-results-description">${descriptionNoResultText}</div>
        <div class="premium-learning-cards-block-cta">
          ${decorateCustomButtons(ctaElement)}
        </div>
        ${searchTextExists ? `<div class="premium-learning-cards-clear-search">${clearSearchText}</div>` : ''}
      </div>
    `;
    const noResultsContent = htmlToElement(markup);
    const clearBtn = noResultsContent.querySelector('.premium-learning-cards-clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        updateHash((key) => !key.includes('q='), '&');
      });
    }
    blockElement.appendChild(noResultsContent);
  }

  function toggleNoResultsContent(blockElement, show) {
    if (show) {
      renderNoResultsContent(blockElement, param.q);
      headerDiv.classList.add('premium-learning-cards-hide-content');
    } else {
      const noResultsContent = blockElement.querySelector('.premium-learning-cards-no-results');
      if (noResultsContent) {
        blockElement.removeChild(noResultsContent);
      }
      headerDiv.classList.remove('premium-learning-cards-hide-content');
    }
  }

  function fetchAndRenderCards(params) {
    toggleNoResultsContent(block, false);
    const browseCardsContent = BrowseCardsDelegate.fetchCardData(params);
    browseCardsContent
      .then((data) => {
        buildCardsShimmer.removeShimmer();
        if (data?.length) {
          const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
          for (let i = 0; i < Math.min(noOfResults, data.length); i += 1) {
            const cardData = data[i];
            const cardDiv = document.createElement('div');
            buildCard(cardDiv, cardData);
            contentDiv.appendChild(cardDiv);
          }
          block.appendChild(contentDiv);
        } else {
          toggleNoResultsContent(block, true);
        }
      })
      .catch((err) => {
        buildCardsShimmer.removeShimmer();
        if (!UEAuthorMode) {
          block.remove();
        } else {
          showFallbackContentInUEMode(block);
        }
        /* eslint-disable-next-line no-console */
        console.error(err);
      });
  }

  if (isSearchPage && !UEAuthorMode) {
    let lastSearchQuery = null;
    document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.PREPROCESS, (e) => {
      const { body, method = '' } = e.detail;
      if (method === 'search') {
        const newQuery = (body?.q ?? '').trim();
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
        fetchAndRenderCards(param);

        const ctaWrapper = block.querySelector('.premium-learning-cards-block-cta');
        const anchor = ctaWrapper?.querySelector('a');
        if (anchor) {
          const href = anchor.getAttribute('href');
          const url = new URL(href);
          url.search = urlString;
          anchor.setAttribute('href', url.toString());
        }
      }
    });
    document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.SEARCH_DOM_READY, (e) => {
      const searchInterfaceElement = e.detail?.searchInterface;
      if (searchInterfaceElement) {
        const searchBlockElement = e.detail?.block;
        if (searchBlockElement) {
          const delta = 30;
          searchBlockElement.classList.add('atomic-search-with-premium-search');
          searchBlockElement.style.setProperty(
            '--atomic-search-skeleton-margin-top',
            `${block.offsetHeight - delta}px`,
          );
        }
        block.classList.add('premium-learning-cards-atomic-search');
        const premiumSearchWrapper = searchInterfaceElement.querySelector('.atomic-search-premium-search-wrapper');
        if (premiumSearchWrapper) {
          premiumSearchWrapper.appendChild(block);
        }
      }
    });
  } else {
    fetchAndRenderCards(param);
  }
}
