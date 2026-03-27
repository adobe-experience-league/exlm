import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { createTag, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

function showFallbackContentInUEMode(blockElement) {
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  contentDiv.textContent = 'This block will load the Premium learning content for Premium users only.';
  blockElement.appendChild(contentDiv);
}

/**
 * Decorate function to process and display premium-learning browse cards.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block in authoring order
  const [titleElement, descriptionElement, contentTypeElement, productElement] = [...block.children];

  // Extract title and heading type
  const title = titleElement?.textContent?.trim();

  // Extract description
  const description = descriptionElement?.innerHTML?.trim();

  // contentType is string if single selection, made into an array if multiple selections
  let contentType = contentTypeElement?.textContent?.trim()?.toLowerCase();
  if (contentType && contentType.includes(',')) {
    contentType = contentType
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean);
  }

  // Extract and process tags for product filtering
  const tags = productElement?.textContent?.trim();

  const noOfResults = 10;

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'premium-learning-browse-block');

  // Create header section with title and description if provided
  if (title || description) {
    const headerDiv = document.createElement('div');
    headerDiv.className = 'premium-learning-browse-block-header';
    let headerHTML = '';

    if (title) {
      headerHTML += `
        <div class="premium-learning-browse-block-title">
          ${titleElement?.innerHTML || ''}
        </div>
      `;
    }

    if (description) {
      headerHTML += `
        <div class="premium-learning-browse-block-description">
          ${description}
        </div>
      `;
    }

    headerDiv.innerHTML = headerHTML;
    block.appendChild(headerDiv);
  }

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
    contentType, // Can be string ('premium-learning-course' or 'premium-learning-cohort') or array
    noOfResults,
  };

  // Add product filtering if tags are provided
  if (tags) {
    const { extractCapability, removeProductDuplicates } = await import(
      '../../scripts/browse-card/browse-card-utils.js'
    );
    const { products } = extractCapability(tags);
    if (products.length > 0) {
      param.product = removeProductDuplicates(products);
    }
  }

  const buildCardsShimmer = new BrowseCardShimmer(noOfResults, contentType);
  buildCardsShimmer.addShimmer(block);

  function renderNoResultsContent(blockElement) {
    const noResultsDescription =
      placeholders.premiumLearningBrowseNoResultsDescription ||
      'No Premium Learning content found. Please try adjusting your filters.';
    const noResultsHeader = placeholders.premiumLearningBrowseNoResultsHeader || 'No Premium Learning content found.';

    const markup = `
      <div class="premium-learning-browse-no-results">
        <div class="premium-learning-browse-no-results-header">${noResultsHeader}</div>
        <div class="premium-learning-browse-no-results-description">${noResultsDescription}</div>
      </div>
    `;
    const noResultsContent = createTag('div', {}, markup);
    blockElement.appendChild(noResultsContent);
  }

  function toggleNoResultsContent(blockElement, show) {
    if (show) {
      renderNoResultsContent(blockElement);
    } else {
      const noResultsContent = blockElement.querySelector('.premium-learning-browse-no-results');
      if (noResultsContent) {
        blockElement.removeChild(noResultsContent);
      }
    }
  }

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
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
