import PL_CONTENT_TYPES from '../../scripts/data-service/premium-learning/premium-learning-constants.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { createTag, fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { isPLEligible } from '../../scripts/utils/premium-learning-utils.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import ResponsiveList from '../../scripts/responsive-list/responsive-list.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
const FETCH_LIMIT = 4;

function parseAuthoredContent(block) {
  const [headingElement, descriptionElement, ctaElement, contentTypeElement] = [...block.children];

  let contentType = [];
  if (contentTypeElement) {
    const rawText = contentTypeElement.textContent?.trim() || '';
    contentType = rawText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return {
    headingMarkup: headingElement?.innerHTML || '',
    descriptionMarkup: descriptionElement?.innerHTML || '',
    ctaMarkup: ctaElement?.innerHTML ? decorateCustomButtons(ctaElement) : '',
    contentType,
  };
}

function showFallbackContentInUEMode(blockElement) {
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  contentDiv.textContent =
    'This block will load the Premium learning suggested content experience for signed-in Premium users.';
  blockElement.appendChild(contentDiv);
}

function getUniqueProductsInOrder(suggestedContentItems) {
  const uniqueProducts = [];
  const seen = new Set();

  suggestedContentItems.forEach((contentItem) => {
    (contentItem.product || []).forEach((productName) => {
      if (!seen.has(productName)) {
        seen.add(productName);
        uniqueProducts.push(productName);
      }
    });
  });

  return uniqueProducts;
}

function getTabDefinitions(suggestedContentItems, placeholders) {
  const uniqueProducts = getUniqueProductsInOrder(suggestedContentItems);
  const defaultTab = placeholders.premiumLearningTabForYou || 'For you';
  const defaultTabItems = suggestedContentItems.slice(0, FETCH_LIMIT);

  if (!defaultTabItems.length) {
    return [];
  }

  const tabs = [
    {
      id: defaultTab,
      label: defaultTab,
      items: defaultTabItems,
    },
  ];

  if (!uniqueProducts.length) {
    return tabs;
  }

  uniqueProducts.forEach((productName) => {
    const matchingItems = suggestedContentItems
      .filter((contentItem) => (contentItem.product || []).includes(productName))
      .slice(0, FETCH_LIMIT);

    if (matchingItems.length) {
      tabs.push({
        id: productName,
        label: productName,
        items: matchingItems,
      });
    }
  });

  return tabs;
}

function buildResponsiveListItems(tabs) {
  return tabs.map((tab) => ({
    value: tab.id,
    title: tab.label,
  }));
}

function buildEmptyStateMarkup(placeholders) {
  return `
    <div class="browse-card-no-results">
      ${placeholders.noResultsTextBrowse || 'We are sorry, no results found matching the criteria.'}
    </div>
  `;
}

function clearRenderedContent(container) {
  container
    .querySelectorAll('.premium-learning-suggested-content-panel, .browse-card-no-results')
    .forEach((element) => element.remove());
}

function createContentPanel() {
  const panel = createTag('div', { class: 'premium-learning-suggested-content-panel' });
  const contentDiv = createTag('div', {
    class: 'browse-cards-block-content premium-learning-suggested-content-content',
  });
  panel.appendChild(contentDiv);
  return { panel, contentDiv };
}

function renderEmptyState(container, placeholders) {
  clearRenderedContent(container);
  container.appendChild(htmlToElement(buildEmptyStateMarkup(placeholders)));
}

async function renderContentItems(suggestedContentItems, contentDiv) {
  contentDiv.innerHTML = '';
  const contentElements = await Promise.all(
    suggestedContentItems.map(async (contentData) => {
      const contentElement = document.createElement('div');
      await buildCard(contentElement, contentData);
      return contentElement;
    }),
  );
  contentElements.forEach((contentElement) => {
    contentDiv.appendChild(contentElement);
  });
}

function buildSuggestedContentLayout(block, headingMarkup, descriptionMarkup, ctaMarkup) {
  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'premium-learning-suggested-content');

  const headerDiv = document.createElement('div');
  headerDiv.className = 'premium-learning-suggested-content-header';
  headerDiv.innerHTML = `
    <div class="premium-learning-suggested-content-title">
      ${headingMarkup}
      ${
        descriptionMarkup
          ? `<div class="premium-learning-suggested-content-description">${descriptionMarkup}</div>`
          : ''
      }
    </div>
    ${ctaMarkup ? `<div class="premium-learning-content-block-cta">${ctaMarkup}</div>` : ''}
  `;
  block.appendChild(headerDiv);

  const tabHeader = createTag('div', {
    class: 'premium-learning-suggested-content-tab-header recommended-tab-headers',
  });
  block.appendChild(tabHeader);

  const contentContainer = createTag('div', { class: 'premium-learning-suggested-content-render-area' });
  block.appendChild(contentContainer);

  return { tabHeader, contentContainer };
}

function fetchSuggestedContentCards(contentType) {
  return BrowseCardsDelegate.fetchCardData({
    contentType: contentType?.length ? contentType : PL_CONTENT_TYPES.COHORT.MAPPING_KEY,
    noOfResults: FETCH_LIMIT,
    suggestedContent: true,
  });
}

function initializeResponsiveTabs({ tabHeader, listItems, defaultTab, tabsById, contentDiv }) {
  return new ResponsiveList({
    wrapper: tabHeader,
    items: listItems,
    defaultSelected: defaultTab.id,
    onInitCallback: async () => {
      try {
        await renderContentItems(defaultTab.items, contentDiv);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    },
    onSelectCallback: async (selectedItem) => {
      try {
        const selectedTab = tabsById[selectedItem];
        if (!selectedTab) return;
        await renderContentItems(selectedTab.items, contentDiv);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    },
  });
}

export default async function decorate(block) {
  const { headingMarkup, descriptionMarkup, ctaMarkup, contentType } = parseAuthoredContent(block);

  const { tabHeader, contentContainer } = buildSuggestedContentLayout(
    block,
    headingMarkup,
    descriptionMarkup,
    ctaMarkup,
  );

  const shimmer = new BrowseCardShimmer(FETCH_LIMIT, PL_CONTENT_TYPES.COHORT.MAPPING_KEY);
  shimmer.addShimmer(contentContainer);

  const placeholders = await fetchLanguagePlaceholders().catch(() => ({}));

  // Non-blocking eligibility check — shimmer stays visible until resolved.
  // TODO: Remove isSignedInUser call and move signedIn check to isPLEligible function once cyclic dependency is resolved.
  isSignedInUser()
    .then((signedIn) => isPLEligible(signedIn))
    .then(async (isEligible) => {
      if (!isEligible) {
        shimmer.removeShimmer();
        if (UEAuthorMode) showFallbackContentInUEMode(block);
        else block.remove();
        return;
      }

      try {
        const suggestedContentItems = await fetchSuggestedContentCards(contentType);
        shimmer.removeShimmer();

        if (!suggestedContentItems?.length) {
          renderEmptyState(contentContainer, placeholders);
          return;
        }

        const tabs = getTabDefinitions(suggestedContentItems, placeholders);

        if (!tabs.length) {
          renderEmptyState(contentContainer, placeholders);
          return;
        }

        clearRenderedContent(contentContainer);
        const { panel, contentDiv } = createContentPanel();
        const tabsById = Object.fromEntries(tabs.map((tab) => [tab.id, tab]));
        const defaultTab = tabs[0];
        const listItems = buildResponsiveListItems(tabs);

        tabHeader.textContent = '';
        contentContainer.appendChild(panel);

        initializeResponsiveTabs({
          tabHeader,
          listItems,
          defaultTab,
          tabsById,
          contentDiv,
        });
      } catch (err) {
        shimmer.removeShimmer();
        if (!UEAuthorMode) {
          renderEmptyState(contentContainer, placeholders);
        } else {
          showFallbackContentInUEMode(block);
        }
        // eslint-disable-next-line no-console
        console.error('Error fetching PL suggested content:', err);
      }
    })
    .catch((err) => {
      shimmer.removeShimmer();
      if (UEAuthorMode) showFallbackContentInUEMode(block);
      else block.remove();
      // eslint-disable-next-line no-console
      console.error('Error resolving PL eligibility for suggested content:', err);
    });
}
