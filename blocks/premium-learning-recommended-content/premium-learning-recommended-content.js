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
  const noResultsHeader = placeholders.premiumLearningCardsRecsHeader || 'No Premium Learning recommended results.';
  const noResultsDescription =
    placeholders.premiumLearningCardsRecsDescription ||
    'Try searching for a specific product or role, or explore all Premium learning content.';
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

// Loads config.json present only in local dev environments (git-ignored).
async function loadLocalConfig() {
  try {
    const res = await fetch(new URL('./config.json', import.meta.url));
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

// Orchestrates the two-step API flow via PLDataService. Returns { prefsData, loData }.
async function fetchApiData(localConfig, learningType) {
  if (localConfig?.localDev === true) {
    return { prefsData: localConfig.api1, loData: localConfig.api2 };
  }

  // localDevAuth: use token/userId from config.json to make real API calls without a browser session
  const token = localConfig?.localDevAuth === true ? localConfig.token : getPLAccessToken();
  const userId = localConfig?.localDevAuth === true ? localConfig.userId : getCookie('alm_user_id');

  const service = new PLDataService({ learningType });
  return service.fetchRecommendedContent(userId, token);
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
  block.classList.add('browse-cards-block', 'premium-learning-recommended-content-block');
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
