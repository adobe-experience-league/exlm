import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import BrowseCardsPLAdaptor from '../../scripts/browse-card/browse-cards-premium-learning-adaptor.js';
import { createTag, fetchLanguagePlaceholders, htmlToElement, getConfig } from '../../scripts/scripts.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import { getPLAccessToken } from '../../scripts/utils/pl-auth-utils.js';
import { getCookie } from '../../scripts/utils/cookie-utils.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
const MAX_CARDS = 4;

function showFallbackContentInUEMode(blockElement) {
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  contentDiv.textContent = 'This block will load personalized recommended learning content for signed-in users only.';
  blockElement.appendChild(contentDiv);
}

function renderCards(contentDiv, cards) {
  const count = Math.min(MAX_CARDS, cards.length);
  for (let i = 0; i < count; i += 1) {
    const cardDiv = document.createElement('div');
    buildCard(cardDiv, cards[i]);
    contentDiv.appendChild(cardDiv);
  }
}

/**
 * Decorate function for premium-learning-recommended-content block.
 * Displays personalized learning recommendations based on user preferences.
 * @param {HTMLElement} block - The block element to decorate.
 */
export default async function decorate(block) {
  const [headingElement, descriptionElement] = [...block.children];

  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'premium-learning-cards-block', 'premium-learning-recommended-content-block');

  const headerDiv = document.createElement('div');
  headerDiv.className = 'premium-learning-cards-block-header';
  headerDiv.innerHTML = `
    <div class="premium-learning-cards-block-title">
      ${headingElement?.innerHTML || ''}
    </div>
    <div class="premium-learning-recommended-content-description">
      ${descriptionElement?.innerHTML || ''}
    </div>
  `;
  block.appendChild(headerDiv);

  // Load local dev config (config.json is git-ignored; only present in local dev environments)
  let localConfig = null;
  try {
    const configRes = await fetch(new URL('./config.json', import.meta.url));
    if (configRes.ok) localConfig = await configRes.json();
  } catch { /* not available in non-local environments */ }

  const isLocalDev = localConfig?.localDev === true;

  const [signedIn, placeholders] = await Promise.all([
    isLocalDev ? Promise.resolve(true) : isSignedInUser(),
    fetchLanguagePlaceholders().catch(() => ({})),
  ]);

  if (!signedIn) {
    if (UEAuthorMode) {
      showFallbackContentInUEMode(block);
    } else {
      block.remove();
    }
    return;
  }

  const shimmer = new BrowseCardShimmer(MAX_CARDS);
  shimmer.addShimmer(block);

  function renderNoResultsContent() {
    const noResultsHeader = placeholders.premiumLearningCardsNoSearchHeader || 'No Premium Learning search results.';
    const noResultsDescription =
      placeholders.premiumLearningCardsNoSearchDescription ||
      'Try searching for a specific product or role, or explore all Premium learning content.';
    const markup = `
      <div class="premium-learning-cards-no-results">
        <div class="premium-learning-cards-no-results-header">${noResultsHeader}</div>
        <div class="premium-learning-cards-no-results-description">${noResultsDescription}</div>
      </div>
    `;
    block.appendChild(htmlToElement(markup));
  }

  try {
    let prefsData;
    let loData;

    if (isLocalDev) {
      // Use mock API responses from config.json for local development
      prefsData = localConfig.api1;
      loData = localConfig.api2;
    } else {
      const { plApiBaseUrl } = getConfig();
      const token = getPLAccessToken();
      const userId = getCookie('alm_user_id');
      const headers = {
        Authorization: `oauth ${token}`,
        Accept: 'application/vnd.api+json',
      };

      // Step 1: fetch recommendation preferences
      const prefsRes = await fetch(`${plApiBaseUrl}/users/${userId}/recommendationPreferences`, { headers });
      if (!prefsRes.ok) throw new Error(`Preferences fetch failed: ${prefsRes.status}`);
      prefsData = await prefsRes.json();

      const products = prefsData.data?.attributes?.products ?? [];
      const roles = prefsData.data?.attributes?.roles ?? [];

      // Step 2: fetch learning objects using preferences as filters
      const loParams = new URLSearchParams();
      loParams.append('page[limit]', '10');
      loParams.append('sort', '-recommendationScore');
      loParams.append('enforcedFields[learningObject]', 'products,roles,extensionOverrides,effectivenessData');
      loParams.append('include', 'instances.loResources.resources');
      products.forEach((p) => loParams.append('filter.recommendationProductIds', p.id));
      roles.forEach((r) => loParams.append('filter.recommendationRoleIds', r.id));

      const loRes = await fetch(`${plApiBaseUrl}/learningObjects/query?${loParams}`, { headers });
      if (!loRes.ok) throw new Error(`Learning objects fetch failed: ${loRes.status}`);
      loData = await loRes.json();
    }

    const products = prefsData.data?.attributes?.products ?? [];

    shimmer.removeShimmer();

    const allCards = await BrowseCardsPLAdaptor.mapResultsToCardsData(loData);

    if (!allCards.length) {
      renderNoResultsContent();
      return;
    }

    // Build tabsData: { 'All': allCards, '<ProductName>': filteredCards, ... }
    // Filter by matching against raw loData.data since adapted cards don't carry a products array
    const tabsData = { All: allCards };
    products.forEach((p) => {
      const filtered = (loData.data ?? []).reduce((acc, item, i) => {
        if (item.attributes?.products?.some((prod) => prod.name === p.name)) acc.push(allCards[i]);
        return acc;
      }, []);
      tabsData[p.name] = filtered;
    });

    // Render tab list (mirrors aria-selected pattern from tabs.js)
    const tabList = createTag('div', { class: 'tab-list', role: 'tablist' });
    Object.keys(tabsData).forEach((label, i) => {
      const btn = createTag('button', {
        class: 'tab-title',
        role: 'tab',
        'aria-selected': i === 0 ? 'true' : 'false',
        'aria-label': label,
      });
      btn.textContent = label;
      tabList.appendChild(btn);
    });
    block.appendChild(tabList);

    // Render initial cards content div (All tab active by default)
    const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
    block.appendChild(contentDiv);
    renderCards(contentDiv, allCards);

    // Tab click handler — no API calls, filter from in-memory tabsData
    tabList.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[role="tab"]');
      if (!tabBtn) return;

      tabList.querySelectorAll('[aria-selected="true"]').forEach((t) => t.setAttribute('aria-selected', 'false'));
      tabBtn.setAttribute('aria-selected', 'true');

      const label = tabBtn.textContent;
      const filtered = tabsData[label] ?? [];

      const existingNoResults = block.querySelector('.premium-learning-cards-no-results');
      if (existingNoResults) existingNoResults.remove();

      contentDiv.innerHTML = '';

      if (filtered.length) {
        renderCards(contentDiv, filtered);
      } else {
        renderNoResultsContent();
      }
    });
  } catch (err) {
    shimmer.removeShimmer();
    /* eslint-disable-next-line no-console */
    console.error(err);
    if (UEAuthorMode) {
      showFallbackContentInUEMode(block);
    } else {
      block.remove();
    }
  }
}
