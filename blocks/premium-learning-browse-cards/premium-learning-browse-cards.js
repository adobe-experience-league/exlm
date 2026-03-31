import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { createTag, fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

function showFallbackContentInUEMode(blockElement) {
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  contentDiv.textContent = 'This block will load the Premium learning content for Premium users only.';
  blockElement.appendChild(contentDiv);
}

export default async function decorate(block) {
  const [titleElement, descriptionElement, contentTypeElement, productElement] = [...block.children];

  const title = titleElement?.textContent?.trim();
  const description = descriptionElement?.innerHTML?.trim();
  let contentType = contentTypeElement?.textContent?.trim()?.toLowerCase();
  if (contentType?.includes(',')) {
    contentType = contentType
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean);
  }

  // Extract and process tags for product filtering
  const tags = productElement?.textContent?.trim();
  let products = [];
  if (tags) {
    const { extractCapability, removeProductDuplicates } = await import(
      '../../scripts/browse-card/browse-card-utils.js'
    );
    const extractedProducts = extractCapability(tags).products;
    if (extractedProducts.length > 0) {
      products = removeProductDuplicates(extractedProducts);
    }
  }

  const noOfResults = 4;

  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'premium-learning-browse-cards');

  const headerDiv = document.createElement('div');
  headerDiv.className = 'premium-learning-browse-cards-header';
  headerDiv.innerHTML = `
    ${title ? `<div class="premium-learning-browse-cards-title">${titleElement?.innerHTML || ''}</div>` : ''}
    ${description ? `<div class="premium-learning-browse-cards-description">${description}</div>` : ''}
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
    contentType,
    noOfResults,
    browseMode: true,
    ...(products?.length > 0 && { products }),
  };

  const buildCardsShimmer = new BrowseCardShimmer(noOfResults, contentType);
  buildCardsShimmer.addShimmer(block);

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent
    .then((data) => {
      buildCardsShimmer.removeShimmer();
      if (data?.length) {
        let sortedData = data;
        // Sort cohorts based on start label
        const isCohortContent = contentType === 'premium-learning-cohort';

        if (isCohortContent) {
          const withLabel = data
            .filter((item) => item.meta?.startLabel?.trim())
            .sort((a, b) => {
              const deadlineA = a.meta?.deadline;
              const deadlineB = b.meta?.deadline;
              if (deadlineA && deadlineB) {
                return new Date(deadlineA) - new Date(deadlineB);
              }
              return 0;
            });
          const withoutLabel = data.filter((item) => !item.meta?.startLabel?.trim());
          sortedData = [...withLabel, ...withoutLabel];
        }

        const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
        for (let i = 0; i < Math.min(noOfResults, sortedData.length); i += 1) {
          const cardData = sortedData[i];
          const cardDiv = document.createElement('div');
          buildCard(cardDiv, cardData);
          contentDiv.appendChild(cardDiv);
        }
        block.appendChild(contentDiv);
      } else {
        const noResultsText =
          placeholders.noResultsTextBrowse || 'We are sorry, no results found matching the criteria.';
        const noResultsDiv = htmlToElement(`<div class="browse-card-no-results">${noResultsText}</div>`);
        block.appendChild(noResultsDiv);
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
