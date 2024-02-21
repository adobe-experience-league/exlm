import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, toPascalCase, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import { CONTENT_TYPES, COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import SolutionDataService from '../../scripts/data-service/solutions-data-service.js';
import { solutionsUrl } from '../../scripts/urls.js';

import { roleOptions } from '../browse-filters/browse-filter-utils.js';

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

const handleSolutionsService = async (solutionDropdown) => {
  const solutionsService = new SolutionDataService(solutionsUrl);
  const solutions = await solutionsService.fetchDataFromSource();

  if (!solutions) {
    throw new Error('An error occurred');
  }

  if (solutions?.length) {
    solutions.forEach((item, index) => {
      const id = 2;
      const dropdownitem = htmlToElement(
        ` <div class="custom-checkbox">
            <input type="checkbox" id="option${id}${index + 1}" value="${item}" data-label="${item}">
            <label for="option${id}${index + 1}">
                <span class="title">${item}</span>
                <span class="icon icon-checked"></span>
            </label>
          </div>`,
      );
      solutionDropdown.appendChild(dropdownitem);
    });
  }
  await decorateIcons(solutionDropdown);
};

function createFormElements(formEl) {
  formEl.addEventListener('submit', (event) => event.preventDefault());

  const roleDropdown = formEl.querySelector('.roles-dropdown');
  const roleDropdownButton = formEl.querySelector('.roles-dropdown > button');
  const roleDropdownContent = formEl.querySelector('.roles-dropdown > .filter-dropdown-content');

  roleOptions.items.forEach((item, index) => {
    const id = 1;
    const dropdownitem = htmlToElement(
      ` <div class="custom-checkbox">
          <input type="checkbox" id="option${id}${index + 1}" value="${item.value}" data-label="${item.title}">
          <label for="option${id}${index + 1}">
            <span class="title">${item.title}</span>
            <span class="description">${item.description}</span>
            <span class="icon icon-checked"></span>
          </label>
        </div>`,
    );
    roleDropdownContent.appendChild(dropdownitem);
  });

  const solutionDropdown = formEl.querySelector('.solutions-dropdown');
  const solutionDropdownButton = formEl.querySelector('.solutions-dropdown > button');
  const solutionDropdownContent = formEl.querySelector('.solutions-dropdown > .filter-dropdown-content');
  handleSolutionsService(solutionDropdownContent);

  const toggleRolesDropdown = () => {
    if (solutionDropdown.classList.contains('open')) {
      solutionDropdown.classList.remove('open');
      solutionDropdownContent.style.display = 'none';
    }

    if (roleDropdown.classList.contains('open')) {
      roleDropdown.classList.remove('open');
      roleDropdownContent.style.display = 'none';
    } else {
      roleDropdown.classList.add('open');
      roleDropdownContent.style.display = 'block';
    }
  };

  const toggleSolutionDropdown = () => {
    if (roleDropdown.classList.contains('open')) {
      roleDropdown.classList.remove('open');
      roleDropdownContent.style.display = 'none';
    }

    if (solutionDropdown.classList.contains('open')) {
      solutionDropdown.classList.remove('open');
      solutionDropdownContent.style.display = 'none';
    } else {
      solutionDropdown.classList.add('open');
      solutionDropdownContent.style.display = 'block';
    }
  };

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.roles-dropdown') && !event.target.closest('.solutions-dropdown')) {
      roleDropdown.classList.remove('open');
      roleDropdownContent.style.display = 'none';
      solutionDropdown.classList.remove('open');
      solutionDropdownContent.style.display = 'none';
    }

    if (event.target.closest('.roles-dropdown > button')) {
      toggleRolesDropdown();
    }
    if (event.target.closest('.solutions-dropdown > button')) {
      toggleSolutionDropdown();
    }

    if (event.target.closest('.custom-checkbox') && event.target.closest('.roles-dropdown')) {
      if (event.target.value) {
        roleDropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]').forEach((checkbox) => {
          if (event.target.value !== checkbox.value) checkbox.checked = false;
        });
        if (event.target.value === roleDropdown.dataset.selected) {
          roleDropdown.dataset.selected = DEFAULT_OPTIONS.ROLE;
          roleDropdownButton.children[0].textContent = DEFAULT_OPTIONS.ROLE;
        } else {
          roleDropdown.dataset.selected = event.target.value;
          roleDropdownButton.children[0].textContent = event.target.dataset.label;
        }
        toggleRolesDropdown();
      }
    }

    if (event.target.closest('.custom-checkbox') && event.target.closest('.solutions-dropdown')) {
      if (event.target.value) {
        solutionDropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]').forEach((checkbox) => {
          if (event.target.value !== checkbox.value) checkbox.checked = false;
        });
        if (event.target.value === solutionDropdown.dataset.selected) {
          solutionDropdown.dataset.selected = DEFAULT_OPTIONS.SOLUTION;
        } else {
          solutionDropdown.dataset.selected = event.target.value;
        }
        solutionDropdownButton.children[0].textContent = solutionDropdown.dataset.selected;
        toggleSolutionDropdown();
      }
    }
  });
}

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
        <div class="roles-dropdown" data-filter-type="role">
          	<button>
          		<span>${DEFAULT_OPTIONS.ROLE}</span>
          		<span class="icon icon-chevron"></span>
          	</button>
            <div class="filter-dropdown-content"></div>
        </div>
        <div class="solutions-dropdown" data-filter-type="product">
            <button>
              <span>${DEFAULT_OPTIONS.SOLUTION}</span>
              <span class="icon icon-chevron"></span>
            </button>
            <div class="filter-dropdown-content"></div>
        </div>
      </form>
    </div>
  `);

  block.appendChild(headerDiv);
  createFormElements(headerDiv.querySelector('.browse-card-dropdown'));
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

  /* eslint-disable-next-line */
  const fetchDataAndRenderBlock = (param, contentType, block, contentDiv) => {
    const buildCardsShimmer = new BuildPlaceholder();
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
    const roleValue = this.dataset.selected === DEFAULT_OPTIONS.ROLE ? [] : [this.dataset.selected];
    param.role = roleValue;

    [...contentDiv.children].forEach((cards) => {
      cards.remove();
    });

    /* eslint-disable-next-line */
    fetchDataAndRenderBlock(param, contentType, block, contentDiv);
  });

  const solutionsDropdown = block.querySelector('.solutions-dropdown');

  solutionsDropdown.addEventListener('change', function handleSolutionDropdownChange() {
    const solutionValue = this.dataset.selected === DEFAULT_OPTIONS.SOLUTION ? [] : [this.dataset.selected];
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
