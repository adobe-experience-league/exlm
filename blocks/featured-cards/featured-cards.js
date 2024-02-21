import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, toPascalCase, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import { CONTENT_TYPES, ROLE_OPTIONS, COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import SolutionDataService from '../../scripts/data-service/solutions-data-service.js';
import { solutionsUrl } from '../../scripts/urls.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const DEFAULT_OPTIONS = Object.freeze({
  ROLE: 'Role',
  SOLUTION: 'Product',
});

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
      <div class="browse-card-dropdown">
        <p>${placeholders?.featuredCardDescription || 'Tell us about yourself'}</p>
        <select class="roles-dropdown"></select>
        <select class="solutions-dropdown"></select>
      </div>
    </div>
  `);

  block.appendChild(headerDiv);
  await decorateIcons(headerDiv);
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  const param = {
    contentType: contentType && contentType.split(','),
    role: [],
    product: [],
    q: keyword,
    sortCriteria,
    noOfResults,
  };

  const rolesDropdownData = block.querySelector('.roles-dropdown');
  const defaultRolesOption = document.createElement('option');
  defaultRolesOption.text = DEFAULT_OPTIONS.ROLE;
  rolesDropdownData.add(defaultRolesOption);

  Object.keys(ROLE_OPTIONS).forEach((roleData) => {
    if (Object.prototype.hasOwnProperty.call(ROLE_OPTIONS, roleData)) {
      const option = document.createElement('option');
      option.text = ROLE_OPTIONS[roleData];
      rolesDropdownData.add(option);
    }
  });

  const handleSolutionsService = async () => {
    const solutionsService = new SolutionDataService(solutionsUrl);
    const solutions = await solutionsService.fetchDataFromSource();

    if (!solutions) {
      throw new Error('An error occurred');
    }

    if (solutions?.length) {
      const solutionsDropdownData = block.querySelector('.solutions-dropdown');
      const defaultSolutionOption = document.createElement('option');
      defaultSolutionOption.text = DEFAULT_OPTIONS.SOLUTION;
      solutionsDropdownData.add(defaultSolutionOption);

      solutions.forEach((optionText) => {
        const option = document.createElement('option');
        option.text = optionText;
        solutionsDropdownData.add(option);
      });
    }

    return [];
  };

  handleSolutionsService();

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

  const buildCardsShimmer = new BuildPlaceholder();

  /* eslint-disable-next-line */
  const fetchDataAndRenderBlock = (param, contentType, block, contentDiv) => {
    buildCardsShimmer.add(block);
    headerDiv.after(block.querySelector('.shimmer-placeholder'));
    const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
    browseCardsContent
      .then((data) => {
        /* eslint-disable-next-line */
        data = filterResults(data, contentType);
        buildCardsShimmer.remove();

        if (data?.length) {
          for (let i = 0; i < Math.min(4, data.length); i += 1) {
            const cardData = data[i];
            const cardDiv = document.createElement('div');
            buildCard(contentDiv, cardDiv, cardData);
            contentDiv.appendChild(cardDiv);
          }
          decorateIcons(block);
        }
      })
      .catch((err) => {
        buildCardsShimmer.remove();
        /* eslint-disable-next-line no-console */
        console.error(err);
      });
  };
  /* eslint-disable-next-line */
  fetchDataAndRenderBlock(param, contentType, block, contentDiv);

  const linkDiv = htmlToElement(`
    <div class="browse-cards-block-view">${linkTextElement.innerHTML}</div>
  `);
  block.appendChild(contentDiv);
  block.appendChild(linkDiv);

  const rolesDropdown = block.querySelector('.roles-dropdown');

  rolesDropdown.addEventListener('change', function handleDropdownChange() {
    const roleValue = this.value === DEFAULT_OPTIONS.ROLE ? [] : [this.value];
    param.role = roleValue;

    [...contentDiv.children].forEach((cards) => {
      cards.remove();
    });

    /* eslint-disable-next-line */
    fetchDataAndRenderBlock(param, contentType, block, contentDiv);
  });

  const solutionsDropdown = block.querySelector('.solutions-dropdown');

  solutionsDropdown.addEventListener('change', function handleSolutionDropdownChange() {
    const solutionValue = this.value === DEFAULT_OPTIONS.SOLUTION ? [] : [this.value];
    param.product = solutionValue;

    [...contentDiv.children].forEach((cards) => {
      cards.remove();
    });

    /* eslint-disable-next-line */
    fetchDataAndRenderBlock(param, contentType, block, contentDiv);
  });

  /* Hide Tooltip while scrolling the cards layout */
  hideTooltipOnScroll(contentDiv);
}
