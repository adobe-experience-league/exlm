import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { createTag, fetchLanguagePlaceholders, getConfig, htmlToElement } from '../../scripts/scripts.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import { getPLAccessToken } from '../../scripts/utils/pl-auth-utils.js';
import { getCookie } from '../../scripts/utils/cookie-utils.js';
import ResponsiveList from '../../scripts/responsive-list/responsive-list.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
const MAX_CARDS = 4;
const NO_OF_RESULTS = 10;
const DEFAULT_CONTENT_TYPES = ['premium-learning-course'];

// ─── DOM helpers ────────────────────────────────────────────────────────────

function buildBlockHeader(headingHTML, descriptionHTML) {
  const headerDiv = document.createElement('div');
  headerDiv.className = 'premium-learning-recommended-content-header';
  headerDiv.innerHTML = `
    <div class="premium-learning-recommended-content-title">
      ${headingHTML}
    </div>
    <div class="premium-learning-recommended-content-description">
      ${descriptionHTML}
    </div>
  `;
  return headerDiv;
}

function renderCards(contentDiv, cards) {
  const count = Math.min(MAX_CARDS, cards.length);
  for (let i = 0; i < count; i += 1) {
    const cardDiv = document.createElement('div');
    buildCard(cardDiv, cards[i]);
    contentDiv.appendChild(cardDiv);
  }
}

function renderNoResultsContent(block, placeholders) {
  const noResultsText = placeholders.noResultsTextBrowse || 'We are sorry, no results found matching the criteria.';
  const noResultsDiv = htmlToElement(`<div class="browse-card-no-results">${noResultsText}</div>`);
  block.appendChild(noResultsDiv);
}

function showFallbackContentInUEMode(blockElement) {
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  contentDiv.textContent = 'This block will load the Premium learning content for Premium users only.';
  blockElement.appendChild(contentDiv);
}

function renderTabs(block, tabsData, allCards, placeholders) {
  const tabsWrapper = createTag('div', { class: 'premium-learning-tabs-wrapper' });
  block.appendChild(tabsWrapper);

  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  block.appendChild(contentDiv);

  const items = Object.keys(tabsData).map((label) => ({ value: label, title: label }));

  const forYouLabel = Object.keys(tabsData)[0];
  // eslint-disable-next-line no-new
  new ResponsiveList({
    wrapper: tabsWrapper,
    items,
    defaultSelected: forYouLabel,
    onInitCallback: () => {
      renderCards(contentDiv, allCards);
    },
    onSelectCallback: (label) => {
      const existingNoResults = block.querySelector('.premium-learning-recommended-content-no-results');
      if (existingNoResults) existingNoResults.remove();
      contentDiv.innerHTML = '';
      const filtered = tabsData[label] ?? [];
      if (filtered.length) {
        contentDiv.style.display = '';
        renderCards(contentDiv, filtered);
      } else {
        contentDiv.style.display = 'none';
        renderNoResultsContent(block, placeholders);
      }
    },
  });
}

// ─── Data helpers ────────────────────────────────────────────────────────────

// Fetches the user's recommendation preferences (products/roles) from the PL API.
async function fetchRecommendationPreferences() {
  const token = getPLAccessToken();
  const userId = getCookie('alm_user_id');
  const apiBaseUrl = getConfig()?.plApiBaseUrl;
  const headers = { Authorization: `oauth ${token}`, Accept: 'application/vnd.api+json' };
  const res = await fetch(`${apiBaseUrl}/users/${userId}/recommendationPreferences`, { headers });
  if (!res.ok) throw new Error(`Preferences fetch failed: ${res.status}`);
  return res.json();
}

// Builds the tabs map: { 'For you': allCards, '<ProductName>': filteredCards, … }
function buildTabsData(allCards, products, forYouLabel) {
  const tabsData = { [forYouLabel]: allCards };
  products.forEach((p) => {
    const filtered = allCards.filter((card) => card.products?.some((prod) => prod.name === p.name));
    if (filtered.length) tabsData[p.name] = filtered;
  });
  return tabsData;
}

// ─── Block entry point ───────────────────────────────────────────────────────

/**
 * Decorate function for premium-learning-recommended-content block.
 * Displays personalized learning recommendations based on user preferences.
 * @param {HTMLElement} block - The block element to decorate.
 */
export default async function decorate(block) {
  const [headingElement, descriptionElement, contentTypeElement] = [...block.children];
  const contentTypeRaw = contentTypeElement?.textContent?.trim() || '';
  const contentType = contentTypeRaw ? contentTypeRaw.split(',').map((s) => s.trim()) : DEFAULT_CONTENT_TYPES;

  block.textContent = '';
  block.classList.add('browse-cards-block', 'premium-learning-recommended-content-block');
  block.appendChild(buildBlockHeader(headingElement?.innerHTML || '', descriptionElement?.innerHTML || ''));

  const [signedIn, placeholders] = await Promise.all([isSignedInUser(), fetchLanguagePlaceholders().catch(() => ({}))]);

  if (!signedIn) {
    if (UEAuthorMode) showFallbackContentInUEMode(block);
    else block.remove();
    return;
  }

  const shimmer = new BrowseCardShimmer(MAX_CARDS);
  shimmer.addShimmer(block);

  try {
    const prefsData = await fetchRecommendationPreferences();
    const products = prefsData.data?.attributes?.products ?? [];
    const roles = prefsData.data?.attributes?.roles ?? [];

    const allCards = await BrowseCardsDelegate.fetchCardData({
      contentType,
      recommendationMode: true,
      products,
      roles,
      noOfResults: NO_OF_RESULTS,
    });

    shimmer.removeShimmer();

    if (!allCards.length) {
      renderNoResultsContent(block, placeholders);
      return;
    }

    const forYouLabel = placeholders.premiumLearningTabForYou || 'For you';
    const tabsData = buildTabsData(allCards, products, forYouLabel);
    renderTabs(block, tabsData, allCards, placeholders);
  } catch (err) {
    shimmer.removeShimmer();
    /* eslint-disable-next-line no-console */
    console.error(err);
    if (UEAuthorMode) showFallbackContentInUEMode(block);
    else block.remove();
  }
}
