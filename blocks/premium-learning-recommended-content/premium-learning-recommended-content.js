import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import BrowseCardsPLAdaptor from '../../scripts/browse-card/browse-cards-premium-learning-adaptor.js';
import { createTag, fetchLanguagePlaceholders, htmlToElement, getConfig } from '../../scripts/scripts.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import { getPLAccessToken } from '../../scripts/utils/pl-auth-utils.js';
import { getCookie } from '../../scripts/utils/cookie-utils.js';
import ResponsiveList from '../../scripts/responsive-list/responsive-list.js';
import { showFallbackContentInUEMode } from '../premium-learning-search/premium-learning-search.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
const MAX_CARDS = 4;
const RECOMMENDED_CATALOG_IDS = ['208422'];
const RECOMMENDED_LEARNER_STATES = ['notenrolled'];
const IGNORE_ENHANCED_LP = false;

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

/* TODO: Re-usability and Placeholder naming */
function renderNoResultsContent(block, placeholders) {
  const noResultsHeader = placeholders.premiumLearningCardsRecsHeader || 'No Premium Learning recommended results.';
  const noResultsDescription =
    placeholders.premiumLearningCardsRecsDescription ||
    'Try searching for a specific product or role, or explore all Premium learning content.';
  const markup = `
    <div class="premium-learning-search-no-results">
      <div class="premium-learning-search-no-results-header">${noResultsHeader}</div>
      <div class="premium-learning-search-no-results-description">${noResultsDescription}</div>
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
      const existingNoResults = block.querySelector('.premium-learning-search-no-results');
      if (existingNoResults) existingNoResults.remove();
      contentDiv.innerHTML = '';
      const filtered = tabsData[label] ?? [];
      if (filtered.length) {
        renderCards(contentDiv, filtered);
      } else {
        renderNoResultsContent(block, placeholders);
      }
    },
  });
}

// ─── Data helpers ────────────────────────────────────────────────────────────

// Maps the authored learningType value to the filter.loTypes array for API 2.
function getLoTypes(learningType) {
  if (learningType === 'course') return ['course'];
  if (learningType === 'learningProgram') return ['learningProgram'];
  return ['course', 'learningProgram']; // 'both' default
}

// Loads config.json present only in local dev environments (git-ignored).
async function loadLocalConfig() {
  try {
    const res = await fetch(new URL('./config.json', import.meta.url));
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

// Step 1: GET /users/{userId}/recommendationPreferences
async function fetchRecommendationPreferences(plApiBaseUrl, userId, headers) {
  const res = await fetch(`${plApiBaseUrl}/users/${userId}/recommendationPreferences`, { headers });
  if (!res.ok) throw new Error(`Preferences fetch failed: ${res.status}`);
  return res.json();
}

// Builds the JSON body for the Step 2 POST request.
function buildLearningObjectsPayload(products, roles, learningType) {
  return {
    'filter.recommendationProducts': products.map((p) => ({ name: p.name })),
    'filter.recommendationRoles': roles.map((r) => ({ name: r.name, levels: r.levels ?? [] })),
    'filter.loTypes': getLoTypes(learningType),
    'filter.ignoreEnhancedLP': IGNORE_ENHANCED_LP,
    'filter.learnerState': RECOMMENDED_LEARNER_STATES,
    'filter.catalogIds': RECOMMENDED_CATALOG_IDS
  };
}

// Step 2: POST /learningObjects/query with dynamic payload.
async function fetchLearningObjects(plApiBaseUrl, payload, headers) {
  const queryParams = new URLSearchParams({
    'page[limit]': '10',
    sort: '-recommendationScore',
    'enforcedFields[learningObject]': 'products,roles,extensionOverrides,effectivenessData',
    include: 'instances.loResources.resources',
  });
  const res = await fetch(`${plApiBaseUrl}/learningObjects/query?${queryParams}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/vnd.api+json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Learning objects fetch failed: ${res.status}`);
  return res.json();
}

// Orchestrates the two-step API flow. Returns { prefsData, loData }.
async function fetchApiData(localConfig, learningType) {
  if (localConfig?.localDev === true) {
    return { prefsData: localConfig.api1, loData: localConfig.api2 };
  }

  const { plApiBaseUrl } = getConfig();
  // localDevAuth: use token/userId from config.json to make real API calls without a browser session
  const token = localConfig?.localDevAuth === true ? localConfig.token : getPLAccessToken();
  const userId = localConfig?.localDevAuth === true ? localConfig.userId : getCookie('alm_user_id');
  const headers = {
    Authorization: `oauth ${token}`,
    Accept: 'application/vnd.api+json',
  };

  const prefsData = await fetchRecommendationPreferences(plApiBaseUrl, userId, headers);
  const products = prefsData.data?.attributes?.products ?? [];
  const roles = prefsData.data?.attributes?.roles ?? [];
  const payload = buildLearningObjectsPayload(products, roles, learningType);
  const loData = await fetchLearningObjects(plApiBaseUrl, payload, headers);

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
  const [headingElement, descriptionElement, learningTypeElement] = [...block.children];
  const learningType = learningTypeElement?.textContent?.trim() || 'both';

  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'premium-learning-search-block', 'premium-learning-recommended-content-block');
  block.appendChild(buildBlockHeader(headingElement?.innerHTML || '', descriptionElement?.innerHTML || ''));

  const localConfig = await loadLocalConfig();
  const isLocalDev = localConfig?.localDev === true;
  const isLocalDevAuth = localConfig?.localDevAuth === true;

  const [signedIn, placeholders] = await Promise.all([
    isLocalDev || isLocalDevAuth ? Promise.resolve(true) : isSignedInUser(),
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
    const { prefsData, loData } = await fetchApiData(localConfig, learningType);
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
