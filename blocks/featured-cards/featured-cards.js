import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, fetchLanguagePlaceholders, getPathDetails } from '../../scripts/scripts.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import { roleOptions } from '../browse-filters/browse-filter-utils.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
// eslint-disable-next-line import/no-cycle
const ffetchModulePromise = import('../../scripts/ffetch.js');

export const toPascalCase = (name) => (name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : '');

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const DEFAULT_OPTIONS = Object.freeze({
  ROLE: 'Role',
  PRODUCT: 'Product',
});

const defaultRoleLabel = placeholders?.featuredCardRoleLabel || DEFAULT_OPTIONS.ROLE;
const defaultProductLabel = placeholders?.featuredCardProductLabel || DEFAULT_OPTIONS.PRODUCT;

const { lang } = getPathDetails();
const browseMoreLink = `/${lang}/browse`;

// Helper function thats returns a list of all Featured Card Products //
async function getFeaturedCardSolutions() {
  const ffetch = (await ffetchModulePromise).default;
  // Load the Featured Card Solution list
  const solutionList = await ffetch(`/featured-card-products.json`).all();
  // Gets Values from Column Solution in Featured Card Solution list
  const solutionValues = solutionList.map((solution) => solution.Solution);
  return solutionValues;
}

const handleSolutionsService = async () => {
  const solutions = await getFeaturedCardSolutions();

  if (!solutions) {
    throw new Error('An error occurred');
  }

  if (solutions?.length) {
    return solutions;
  }

  return [];
};

/* Function to update the browser's URL with the selected filter using query parameters */
const updateURLWithSelectedFilters = (filterType, filterValue) => {
  const currentURL = new URL(window.location);
  if (filterValue === DEFAULT_OPTIONS.ROLE || filterValue === DEFAULT_OPTIONS.PRODUCT) {
    currentURL.searchParams.delete(filterType);
  } else {
    currentURL.searchParams.set(filterType, encodeURIComponent(filterValue));
  }
  window.history.pushState({}, '', currentURL.toString());
};

/* Function to update the Query Parameters */
const updateParamValues = (filterValue) => {
  const currentURL = new URL(window.location);
  const queryParams = Object.fromEntries(currentURL.searchParams.entries());
  const filterType = queryParams[filterValue];
  if (filterType) {
    return decodeURIComponent(filterType.replace(/\+/g, ' '));
  }
  return [];
};

/* Function to add/update parameters of Feature Card Browse More link */
const updateBrowseMoreWithSelectedFilters = async (block, filterType, filterValue) => {
  const browseFilterType = `f-el_${filterType}`;
  const browseMore = block.querySelector('.browse-cards-block-view');
  let queryParams;
  if (browseMore) {
    if (!browseMore.querySelector('a')) {
      const aTag = document.createElement('a');
      aTag.href = browseMoreLink;
      browseMore.appendChild(aTag);
    }
    const aTag = browseMore.querySelector('a');
    if (aTag) {
      let objParams = {};
      if (aTag.href.indexOf('#') > 0) {
        queryParams = aTag.href.substr(aTag.href.indexOf('#') + 1);
        objParams = Object.assign(
          ...queryParams
            .split('&')
            .map((s) => s.split('='))
            .map(([k, v]) => ({ [k]: v })),
        );
        Object.assign(objParams, { [browseFilterType]: encodeURIComponent(filterValue) });
      } else {
        Object.assign(objParams, { [browseFilterType]: encodeURIComponent(filterValue) });
      }

      if (filterValue === DEFAULT_OPTIONS.ROLE || filterValue === DEFAULT_OPTIONS.PRODUCT) {
        delete objParams[browseFilterType];
      }
      const params = new URLSearchParams(objParams);
      const finalHref = `${browseMoreLink}#${decodeURIComponent(params.toString())}`;
      aTag.href = finalHref;
    }
  }
};

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const [headingElement, descriptionElement, confContentType, linkTextElement, ...configs] = [...block.children].map(
    (row) => row.firstElementChild,
  );
  const [keyword, sortBy] = configs.map((cell) => cell.textContent.trim());
  const contentType = confContentType.textContent.trim().toLowerCase();
  const sortCriteria = COVEO_SORT_OPTIONS[sortBy];
  const noOfResults = 16;

  headingElement.firstElementChild?.classList.add('h2');

  block.innerHTML = '';
  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
        ${headingElement.innerHTML}
      </div>
      <div class="browse-card-description-text">
        ${descriptionElement.innerHTML}
      </div>
      <form class="browse-card-dropdown">
        <label>${placeholders?.featuredCardDescription || 'Tell us about yourself'}</label>
      </form>
    </div>
  `);

  block.appendChild(headerDiv);

  const solutions = await handleSolutionsService();
  const solutionsList = [];
  solutions.forEach((solution) => {
    solutionsList.push({
      title: solution,
    });
  });

  const roleDropdown = new Dropdown(block.querySelector('.browse-card-dropdown'), defaultRoleLabel, roleOptions.items);
  const productDropdown = new Dropdown(
    block.querySelector('.browse-card-dropdown'),
    defaultProductLabel,
    solutionsList,
  );

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  /* update Query Param from selected Dropdown */
  const roleQueryParamValue = updateParamValues(DEFAULT_OPTIONS.ROLE.toLowerCase());
  const productQueryParamValue = updateParamValues(DEFAULT_OPTIONS.PRODUCT.toLowerCase());

  const param = {
    contentType: contentType && contentType.split(','),
    role: [],
    product: [],
    q: keyword,
    sortCriteria,
    noOfResults,
  };

  const linkDiv = htmlToElement(
    linkTextElement.textContent.length > 0
      ? `<div class='browse-cards-block-view'><a href='${browseMoreLink}' title='${linkTextElement.textContent}'>${linkTextElement.textContent}</a></div>`
      : '',
  );
  block.appendChild(contentDiv);
  if (linkDiv) {
    block.appendChild(linkDiv);
  }

  if (roleQueryParamValue.length > 0 && roleQueryParamValue[0] !== DEFAULT_OPTIONS.ROLE) {
    param.role = [roleQueryParamValue];
    roleDropdown.updateDropdownValue(roleQueryParamValue);
    updateBrowseMoreWithSelectedFilters(block, DEFAULT_OPTIONS.ROLE.toLowerCase(), roleQueryParamValue);
  }

  if (productQueryParamValue.length > 0 && productQueryParamValue[0] !== DEFAULT_OPTIONS.PRODUCT) {
    param.product = [productQueryParamValue];
    productDropdown.updateDropdownValue(productQueryParamValue);
    updateBrowseMoreWithSelectedFilters(block, DEFAULT_OPTIONS.PRODUCT.toLowerCase(), productQueryParamValue);
  }

  // Function to filter and organize results based on content types
  const filterResults = (data, contentTypesToFilter) => {
    // Array to store the filtered results
    const filteredResultsSet = new Set();
    // Object to track results based on content types
    const resultsByContentType = {};

    for (let i = 0; i < data.length; i += 1) {
      const item = data[i];
      // Extract content types from the item
      const contentTypesArray = item.contentType.split(',');

      // Check if the item has already been added for any other content type
      const isItemAdded = contentTypesArray.some(() =>
        Object.values(resultsByContentType)
          .flat()
          .some((existingItem) => existingItem === item),
      );
      // If the item hasn't been added, add it to the resultsByContentType object
      if (!isItemAdded) {
        for (let j = 0; j < contentTypesArray.length; j += 1) {
          const type = contentTypesArray[j].trim();
          if (!resultsByContentType[type]) {
            resultsByContentType[type] = [];
          }
          resultsByContentType[type].push(item);
        }
      }
    }

    // Extract and normalize content types from the input string
    const contentTypes = contentTypesToFilter
      .split(',')
      .map((type) => {
        const trimmedType = type.trim().toUpperCase();
        return toPascalCase(CONTENT_TYPES[trimmedType]?.MAPPING_KEY);
      })
      .filter(Boolean);

    for (let i = 0; i < Math.min(4, data.length); i += 1) {
      if (contentTypes.length === 1) {
        // If there is only one content type, add the corresponding results to filteredResults
        filteredResultsSet.add(...(resultsByContentType[contentTypes[0]] || []).slice(i, i + 1));
      } else {
        // If there are more than 1 content types, distribute the results between them
        let addedResults = 0;
        // Add the results to filteredResultsSet in Round Robin Format to ensure result set is distributed
        for (let j = 0; j < Math.min(4, data.length) && addedResults <= 4; j += 1) {
          /* eslint-disable-next-line */
          contentTypes.forEach((type) => {
            const resultsForType = resultsByContentType[type] || [];
            const result = resultsForType[addedResults % resultsForType.length];
            if (result) {
              filteredResultsSet.add(result);
              addedResults += 1;
            }
          });
        }
      }
    }

    // Only keep the first 4 elements (if they exist)
    const results = Array.from(filteredResultsSet);
    const filteredResult = results.slice(0, 4);
    // Sort the Filtered Results array by content type
    filteredResult.sort((a, b) => a.contentType.localeCompare(b.contentType));
    return filteredResult;
  };

  /* Toggle Card Content and View Info Display for Featured Card Block */
  const toggleCardInfo = (show) => {
    if (show) {
      block.classList.add('featured-card-hidden-features');
    } else {
      block.classList.remove('featured-card-hidden-features');
    }
  };

  /* eslint-disable-next-line */
  const fetchDataAndRenderBlock = (param, contentType, block, contentDiv) => {
    const buildCardsShimmer = new BrowseCardShimmer()
    buildCardsShimmer.addShimmer(block);
    headerDiv.after(block.querySelector('.browse-card-shimmer'));

    /* Remove No Results Content and Show Card Content Info if they were hidden earlier */
    buildNoResultsContent(block, false);
    toggleCardInfo(false);

    const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
    browseCardsContent
      .then((data) => {
        /* eslint-disable-next-line */
        data = filterResults(data, contentType);
        buildCardsShimmer.removeShimmer();

        if (data?.length) {
          for (let i = 0; i < Math.min(4, data.length); i += 1) {
            const cardData = data[i];
            const cardDiv = document.createElement('div');
            buildCard(contentDiv, cardDiv, cardData);
            contentDiv.appendChild(cardDiv);
          }
        } else {
          /* Add No Results Content and Remove Card Content View Info and Shimmer */
          buildCardsShimmer.removeShimmer();
          buildNoResultsContent(block, true);
          toggleCardInfo(true);
        }
      })
      .catch((err) => {
        // Hide shimmer placeholders on error
        buildCardsShimmer.removeShimmer();
        /* Add No Results Content and Remove Card Content View Info and Shimmer */
        buildNoResultsContent(block, true);
        toggleCardInfo(true);
        /* eslint-disable-next-line no-console */
        console.error(err);
      });
  };
  /* eslint-disable-next-line */
  fetchDataAndRenderBlock(param, contentType, block, contentDiv);

  function fetchNewCards() {
    [...contentDiv.children].forEach((cards) => {
      cards.remove();
    });

    /* eslint-disable-next-line */
    fetchDataAndRenderBlock(param, contentType, block, contentDiv);
  }

  roleDropdown.handleOnChange((value) => {
    const roleValue = value === defaultRoleLabel ? [] : [value];
    param.role = roleValue;
    /* Update the URL Query Param with Selected Role Value */
    updateURLWithSelectedFilters(DEFAULT_OPTIONS.ROLE.toLowerCase(), value);
    updateBrowseMoreWithSelectedFilters(block, DEFAULT_OPTIONS.ROLE.toLowerCase(), value);
    fetchNewCards();
  });

  productDropdown.handleOnChange((value) => {
    const productValue = value === defaultProductLabel ? [] : [value];
    param.product = productValue;
    /* Update the URL Query Param with Selected Product Value */
    updateURLWithSelectedFilters(DEFAULT_OPTIONS.PRODUCT.toLowerCase(), value);
    updateBrowseMoreWithSelectedFilters(block, DEFAULT_OPTIONS.PRODUCT.toLowerCase(), value);
    fetchNewCards();
  });

  /* Hide Tooltip while scrolling the cards layout */
  hideTooltipOnScroll(contentDiv);
}
