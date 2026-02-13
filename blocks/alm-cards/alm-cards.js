import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { createTag } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { COVEO_SEARCH_CUSTOM_EVENTS } from '../../scripts/search/search-utils.js';

const lang = document.querySelector('html').lang || 'en';
const isSearchPage = window.location.pathname === '/search.html' || window.location.pathname === `/${lang}/search`;

/**
 * Extracts selected values from facets, populates param object, and generates URL search parameters
 * @param {Object} param - The param object to populate
 * @param {Object} body - The body object containing facets and query
 * @param {string} [sort='relevance'] - Sort order for URL params
 * @returns {string} URL search parameters string (e.g., "sort=relevance&q=aem&product=Acrobat%2CServices")
 */
function transformCoveoFacetsToAlmSearch(param, body) {
  const sortMapping = {
    relevancy: 'relevance',
    'date descending': '-date',
    'date ascending': 'relevance',
  };

  const roleMapping = {
    admin: 'Administrator',
    developer: 'Developer',
    leader: 'Business Leader',
    user: 'Business User',
  };

  param.q = body.q ?? '';
  const facets = body?.facets || [];
  const urlParams = new URLSearchParams();

  let hasProductSelection = false;
  let hasRoleSelection = false;

  const coveoSort = body?.sortCriteria;
  const normalizedSort = coveoSort?.toLowerCase().trim();
  const almSort = sortMapping[normalizedSort] || 'relevance';

  param.sort = almSort;

  if (almSort) {
    urlParams.append('sort', almSort);
  }
  if (param.q) {
    urlParams.append('q', param.q);
  }

  facets.forEach((facet) => {
    const { facetId, field, currentValues } = facet;

    const selectedValues =
      currentValues?.filter((item) => item.state === 'selected')?.map((item) => item.value || item) || [];

    switch (facetId || field) {
      case 'el_product':
        if (selectedValues.length > 0) {
          param.products = selectedValues.length === 1 ? selectedValues[0] : selectedValues;
          param.solutions = param.products;
          urlParams.append('product', selectedValues.join(','));
          hasProductSelection = true;
        }
        break;

      case 'el_role':
        if (selectedValues.length > 0) {
          const mappedRoles = selectedValues.map((role) => {
            const normalizedRole = role?.toLowerCase().trim();
            return roleMapping[normalizedRole] || role;
          });
          param.roles = mappedRoles.length === 1 ? mappedRoles[0] : mappedRoles;
          urlParams.append('role', mappedRoles.join(','));
          hasRoleSelection = true;
        }
        break;

      case 'date':
      case 'el_contenttype':
        break;

      default:
        break;
    }
  });

  if (!hasProductSelection) {
    delete param.products;
    delete param.solutions;
  }
  if (!hasRoleSelection) {
    delete param.roles;
  }

  return urlParams.toString();
}

/**
 * Decorate function to process and log the mapped data for ALM cards.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block in authoring order
  const [headingElement, ctaElement, contentTypeElement] = [...block.children];

  let contentType = contentTypeElement?.textContent?.trim()?.toLowerCase() || 'alm-course';
  if (contentType === 'both') {
    contentType = ['alm-course', 'alm-cohort']; // Pass as array for both types
  }
  const noOfResults = 4;

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block', 'alm-cards-block');

  // Create header section with heading and CTA
  const headerDiv = document.createElement('div');
  headerDiv.className = 'alm-cards-block-header';
  headerDiv.innerHTML = `
    <div class="alm-cards-block-title">
      ${headingElement?.innerHTML || ''}
    </div>
    <div class="alm-cards-block-cta">
      ${decorateCustomButtons(ctaElement)}
    </div>
  `;
  block.appendChild(headerDiv);

  const param = {
    contentType, // Can be string ('alm-course' or 'alm-cohort') or array (['alm-course', 'alm-cohort'])
    noOfResults,
  };

  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(block);

  function fetchAndRenderCards(params) {
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
        }
      })
      .catch((err) => {
        buildCardsShimmer.removeShimmer();
        /* eslint-disable-next-line no-console */
        console.error(err);
      });
  }

  if (isSearchPage) {
    document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.PREPROCESS, (e) => {
      const { body, method = '' } = e.detail;
      if (method === 'search') {
        const urlString = transformCoveoFacetsToAlmSearch(param, body);
        param.searchMode = true;
        const contentWrapper = block.querySelector('.browse-cards-block-content');
        if (contentWrapper) {
          block.removeChild(contentWrapper);
        }
        buildCardsShimmer.addShimmer(block);
        fetchAndRenderCards(param);

        const ctaWrapper = block.querySelector('.alm-cards-block-cta');
        const anchor = ctaWrapper?.querySelector('a');
        if (anchor) {
          const href = anchor.getAttribute('href');
          const url = new URL(href);
          url.search = urlString;
          anchor.setAttribute('href', url.toString());
        }
      }
    });
  } else {
    fetchAndRenderCards(param);
  }
}
