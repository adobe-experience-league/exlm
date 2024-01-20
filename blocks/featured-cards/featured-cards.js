import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { CONTENT_TYPES, ROLE_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import SolutionDataService from '../../scripts/data-service/solutions-data-service.js';
import { solutionsUrl } from '../../scripts/urls.js';

const DEFAULT_OPTIONS = Object.freeze({
  ROLE: 'Role',
  SOLUTION: 'Product',
});
/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const descriptionElement = block.querySelector('div:nth-child(2) > div');
  const contentType = block.querySelector('div:nth-child(3) > div')?.textContent?.trim()?.toLowerCase();
  const linkTextElement = block.querySelector('div:nth-child(4) > div');
  const noOfResults = 16;

  block.innerHTML = '';
  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
        <h2>${headingElement?.textContent.trim()}</h2>
      </div>
      <div class="browse-card-description-text">
        <p>${descriptionElement?.textContent.trim()}</p>
      </div>
      <div class="browse-card-dropdown">
        <p>Tell us about yourself</p>
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

  const filterResults = (data, contentTypesToFilter) => {
    const filteredResults = [];
    const resultsByContentType = {};

    for (let i = 0; i < data.length; i += 1) {
      const item = data[i];
      const contentTypesArray = item.contentType.split(',');

      for (let j = 0; j < contentTypesArray.length; j += 1) {
        const type = contentTypesArray[j].trim();
        if (!resultsByContentType[type]) {
          resultsByContentType[type] = [];
        }
        resultsByContentType[type].push(item);
      }
    }

    const contentTypes = contentTypesToFilter.split(',').map((type) => {
      const trimmedType = type.trim().toUpperCase();
      return CONTENT_TYPES[trimmedType].LABEL;
    });

    for (let i = 0; i < Math.min(4, data.length); i += 1) {
      contentTypes.forEach((contentTypeValue) => {
        const resultsForType = resultsByContentType[contentTypeValue] || [];

        if (contentTypes.length === 1) {
          filteredResults.push(...resultsForType.slice(i, i + 1));
        } else if (contentTypes.length === 2) {
          const resultsToAdd = Math.min(2, resultsForType.length);
          filteredResults.push(...resultsForType.slice(i, i + resultsToAdd));
          filteredResults.push(...resultsForType.slice(i, i + 2 - resultsToAdd));
        } else {
          contentTypes.forEach((type) => {
            const resultsToAdd = Math.min(2, (resultsByContentType[type] || []).length);
            if (resultsByContentType[type]) {
              const resultsSlice = resultsByContentType[type].slice(i, i + resultsToAdd);
              filteredResults.push(...resultsSlice);
            }
          });
        }
      });
    }

    return filteredResults;
  };
  const buildCardsShimmer = new BuildPlaceholder();

  /* eslint-disable-next-line */
  const fetchDataAndRenderBlock = (param, contentType, block, contentDiv) => {
    buildCardsShimmer.add(block);
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
            buildCard(cardDiv, cardData);
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
    <div class="browse-cards-block-view">${linkTextElement?.innerHTML}</div>
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
}
