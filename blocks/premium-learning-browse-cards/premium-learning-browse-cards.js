import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { createTag, fetchLanguagePlaceholders, htmlToElement, getv2TagLabels } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { isPLEligible } from '../../scripts/utils/premium-learning-utils.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

function showFallbackContentInUEMode(blockElement) {
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  contentDiv.textContent = 'This block will load the Premium learning content for Premium users only.';
  blockElement.appendChild(contentDiv);
}

export default async function decorate(block) {
  const [titleElement, descriptionElement, contentTypeElement, productElement, viewMoreElement] = [...block.children];
  const title = titleElement?.textContent?.trim();
  const description = descriptionElement?.innerHTML?.trim();
  const viewMoreAnchor = viewMoreElement?.querySelector('a');
  if (viewMoreAnchor) {
    viewMoreAnchor.className = `premium-learning-browse-cards-link${UEAuthorMode ? '' : ' hidden'}`;
  }

  let contentType = contentTypeElement?.textContent?.trim()?.toLowerCase();
  if (contentType?.includes(',')) {
    contentType = contentType
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean);
  }

  const noOfResults = 4;

  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'premium-learning-browse-cards');

  const headerTextDiv = document.createElement('div');
  headerTextDiv.className = 'premium-learning-browse-cards-header-text';
  headerTextDiv.innerHTML = `
    ${title ? `<div class="premium-learning-browse-cards-title">${titleElement?.innerHTML || ''}</div>` : ''}
    ${description ? `<div class="premium-learning-browse-cards-description">${description}</div>` : ''}
  `;

  if (viewMoreAnchor) {
    headerTextDiv.insertBefore(viewMoreAnchor, description ? headerTextDiv.lastElementChild : null);
  }

  const headerDiv = document.createElement('div');
  headerDiv.className = 'premium-learning-browse-cards-header';
  headerDiv.innerHTML = '<div class="premium-learning-browse-cards-header-content"></div>';
  headerDiv.firstElementChild.appendChild(headerTextDiv);
  block.appendChild(headerDiv);

  const buildCardsShimmer = new BrowseCardShimmer(noOfResults, contentType);
  buildCardsShimmer.addShimmer(block);

  // Extract and process tags for product filtering (after shimmer so delay doesn't affect UX)
  const tags = productElement?.textContent?.trim();
  let products = [];
  if (tags) {
    products = [
      ...new Set(
        getv2TagLabels(tags)
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
      ),
    ];
  }

  const param = {
    contentType,
    noOfResults: noOfResults + 1,
    browseMode: true,
    ...(products?.length > 0 && { products }),
  };

  const placeholders = await fetchLanguagePlaceholders().catch(() => ({}));

  // Non-blocking eligibility check — shimmer stays visible until resolved.
  // TODO: Remove isSignedInUser call and move signedIn check to isPLEligible function once cyclic dependency is resolved.
  isSignedInUser()
    .then((signedIn) => isPLEligible(signedIn))
    .then((isEligible) => {
      if (!isEligible) {
        buildCardsShimmer.removeShimmer();
        if (UEAuthorMode) showFallbackContentInUEMode(block);
        else block.remove();
        return;
      }

      BrowseCardsDelegate.fetchCardData(param)
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

            if (viewMoreAnchor) {
              viewMoreAnchor.classList.toggle('hidden', sortedData.length <= noOfResults);
            }
          } else {
            const noResultsText =
              placeholders.noResultsTextBrowse || 'We are sorry, no results found matching the criteria.';
            const noResultsDiv = htmlToElement(`<div class="browse-card-no-results">${noResultsText}</div>`);
            block.appendChild(noResultsDiv);
          }
        })
        .catch((err) => {
          buildCardsShimmer.removeShimmer();
          if (UEAuthorMode) showFallbackContentInUEMode(block);
          else block.remove();
          /* eslint-disable-next-line no-console */
          console.error('Error fetching PL browse card data:', err);
        });
    })
    .catch((err) => {
      buildCardsShimmer.removeShimmer();
      if (UEAuthorMode) showFallbackContentInUEMode(block);
      else block.remove();
      /* eslint-disable-next-line no-console */
      console.error('Error resolving PL eligibility for browse cards:', err);
    });
}
