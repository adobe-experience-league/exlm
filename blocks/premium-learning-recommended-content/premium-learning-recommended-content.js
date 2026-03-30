import PLDataService from '../../scripts/data-service/premium-learning-data-service.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import BrowseCardsPLAdaptor from '../../scripts/browse-card/browse-cards-premium-learning-adaptor.js';
import { createTag, fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import { getPLAccessToken } from '../../scripts/utils/pl-auth-utils.js';
import { getCookie } from '../../scripts/utils/cookie-utils.js';
import ResponsiveList from '../../scripts/responsive-list/responsive-list.js';
import { showFallbackContentInUEMode } from '../premium-learning-search/premium-learning-search.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
const MAX_CARDS = 4;
const RECOMMENDED_CATALOG_IDS = ['208425']; /* TODO: fetch from config */
const RECOMMENDED_LEARNER_STATES = ['notenrolled'];
const RECOMMENDED_IGNORE_ENHANCED_LP = false;

// ─── DOM helpers ────────────────────────────────────────────────────────────

/* TODO: Re-usability */
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
  const noResultsHeader = placeholders.premiumLearningRecommendedContentNoResultsHeader || 'No Premium Learning recommended results.';
  const noResultsDescription = placeholders.premiumLearningRecommendedContentNoResultsDescription
    || 'Try searching for a specific product or role, or explore all Premium learning content.';
  const markup = `
    <div class="premium-learning-recommended-content-no-results">
      <div class="premium-learning-recommended-content-no-results-header">${noResultsHeader}</div>
      <div class="premium-learning-recommended-content-no-results-description">${noResultsDescription}</div>
    </div>
  `;
  block.appendChild(htmlToElement(markup));
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

function buildRecommendedContentPayload(contentType, products, roles) {
  return {
    'filter.recommendationProducts': products.map((p) => ({ name: p.name })),
    'filter.recommendationRoles': roles.map((r) => ({ name: r.name, levels: r.levels ?? [] })),
    'filter.loTypes': PLDataService.determineLearningObjectTypes(contentType),
    'filter.ignoreEnhancedLP': RECOMMENDED_IGNORE_ENHANCED_LP,
    'filter.learnerState': RECOMMENDED_LEARNER_STATES,
    'filter.catalogIds': RECOMMENDED_CATALOG_IDS,
  };
}

// Orchestrates the two-step API flow via PLDataService. Returns { prefsData, loData }.
async function fetchApiData(contentType) {
  const token = getPLAccessToken();
  const userId = getCookie('alm_user_id');

  const prefsData = await PLDataService.fetchRecommendationPreferences(userId, token);
  const products = prefsData.data?.attributes?.products ?? [];
  const roles = prefsData.data?.attributes?.roles ?? [];
  const payload = buildRecommendedContentPayload(contentType, products, roles);
  const loData = await PLDataService.fetchRecommendedLearningObjects(token, payload);
  return { prefsData, loData };
}

// Builds the tabs map: { All: allCards, '<ProductName>': filteredCards, … }
function buildTabsData(allCards, loData, products, forYouLabel) {
  const tabsData = { [forYouLabel]: allCards };
  products.forEach((p) => {
    const filtered = (loData.data ?? []).reduce((acc, item, i) => {
      if (item.attributes?.products?.some((prod) => prod.name === p.name)) acc.push(allCards[i]);
      return acc;
    }, []);
    tabsData[p.name] = filtered;
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
  const contentType = contentTypeRaw ? contentTypeRaw.split(',').map((s) => s.trim()) : [];

  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'premium-learning-recommended-content-block');
  block.appendChild(buildBlockHeader(headingElement?.innerHTML || '', descriptionElement?.innerHTML || ''));

  const [signedIn, placeholders] = await Promise.all([
    isSignedInUser(),
    fetchLanguagePlaceholders().catch(() => ({})),
  ]);

  if (!signedIn) {
    if (UEAuthorMode) showFallbackContentInUEMode(block);
    else block.remove();
    return;
  }

  const shimmer = new BrowseCardShimmer(MAX_CARDS);
  shimmer.addShimmer(block);

  try {
    const { prefsData, loData } = await fetchApiData(contentType);
    const products = prefsData.data?.attributes?.products ?? [];

    shimmer.removeShimmer();

    const safeLoData = { ...loData, data: loData?.data ?? [], included: loData?.included ?? [] };
    const allCards = await BrowseCardsPLAdaptor.mapResultsToCardsData(safeLoData);

    if (!allCards.length) {
      renderNoResultsContent(block, placeholders);
      return;
    }

    const forYouLabel = placeholders.premiumLearningTabForYou || 'For you';
    const tabsData = buildTabsData(allCards, loData, products, forYouLabel);
    renderTabs(block, tabsData, allCards, placeholders);
  } catch (err) {
    shimmer.removeShimmer();
    /* eslint-disable-next-line no-console */
    console.error(err);
    if (UEAuthorMode) showFallbackContentInUEMode(block);
    else block.remove();
  }
}
