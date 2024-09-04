import TabbedCard from '../../scripts/tabbed-card/tabbed-card.js';
import { createTag, fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import {
  convertToTitleCase,
  extractCapability,
  removeProductDuplicates,
} from '../../scripts/browse-card/browse-card-utils.js';
import { defaultProfileClient } from '../../scripts/auth/profile.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const ALL_MY_OPTIONS_KEY = 'All my products';

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const htmlElementData = [...block.children].map((row) => row.firstElementChild);
  const [headingElement, descriptionElement, filterSectionElement, ...remainingElements] = htmlElementData;

  // Clearing the block's content and adding CSS class
  block.innerHTML = '';
  headingElement.classList.add('recommended-content-header');
  descriptionElement.classList.add('recommended-content-description');
  filterSectionElement.classList.add('recommended-content-filter-heading');
  const blockHeader = createTag('div', { class: 'recommended-content-block-header' });
  block.appendChild(headingElement);
  block.appendChild(descriptionElement);
  block.appendChild(filterSectionElement);
  block.appendChild(blockHeader);

  const { contentTypeOptions, sections: itemsEl } = remainingElements.reduce(
    (acc, curr) => {
      const { contentTypeOptions: optionsEl, sections, readSolutions } = acc;
      if (curr.innerHTML.includes('exl:')) {
        acc.readSolutions = true;
        sections.push(curr);
      } else if (readSolutions) {
        sections.push(curr);
      } else {
        optionsEl.push(curr);
      }
      return acc;
    },
    {
      contentTypeOptions: [],
      sections: [],
      readSolutions: false,
    },
  );
  const contentTypes = Array.from(new Set(contentTypeOptions.map((el) => el.innerText)));

  const [encodedSolutionsText, configuredRoles = '', configuredIndustries = '', sortByContent] = itemsEl.map(
    (el) => el.innerText?.trim() || '',
  );
  const { products, versions, features } = extractCapability(encodedSolutionsText);

  const profileData = (await defaultProfileClient.getMergedProfile()) || {};

  const {
    role: profileRoles = [],
    interests: profileInterests = [],
    industryInterests: profileIndustries = [],
  } = profileData;
  const filterOptions = [...profileInterests];
  const profileInterestIsEmpty = profileIndustries.length === 0;
  const sortKey = profileInterestIsEmpty ? 'MOST_POPULAR' : sortByContent?.toUpperCase();
  const sortCriteria = COVEO_SORT_OPTIONS[sortKey ?? 'RELEVANCE'];
  const role = configuredRoles?.includes('profile_context') ? profileRoles : configuredRoles.split(',').filter(Boolean);
  const industryList = configuredIndustries?.includes('profile_context')
    ? profileIndustries
    : configuredIndustries.split(',').filter(Boolean);

  filterOptions.unshift(ALL_MY_OPTIONS_KEY);

  const renderDropdown = filterOptions?.length > 4;
  const numberOfResults = 1;
  const [defaultFilterOption = ''] = filterOptions;

  const buildCardsShimmer = new BuildPlaceholder(contentTypes.length);

  const fetchDataAndRenderBlock = (optionType) => {
    const contentDiv = block.querySelector('.recommended-content-block-section');
    const currentActiveOption = contentDiv.dataset.selected;
    const lowercaseOptionType = optionType?.toLowerCase();
    if (currentActiveOption && lowercaseOptionType === currentActiveOption.toLowerCase()) {
      return;
    }
    contentDiv.dataset.selected = lowercaseOptionType;
    const showProfileOptions = lowercaseOptionType === ALL_MY_OPTIONS_KEY.toLowerCase();
    const interest = filterOptions.find((opt) => opt.toLowerCase() === lowercaseOptionType);
    const params = {
      contentType: ['!Community|User', '!troubleshooting'],
      product: products.length && !showProfileOptions ? removeProductDuplicates(products) : null,
      feature: features.length && !showProfileOptions ? [...new Set(features)] : null,
      version: versions.length && !showProfileOptions ? [...new Set(versions)] : null,
      role: role?.length && !showProfileOptions ? role : null,
      sortCriteria,
      noOfResults: numberOfResults,
      industry: industryList?.length && !showProfileOptions ? industryList : null,
      context: showProfileOptions
        ? { role: profileRoles, interests: profileInterests, industryInterests: profileIndustries }
        : { interests: [interest] },
    };

    contentDiv.innerHTML = '';
    buildCardsShimmer.add(contentDiv);
    contentDiv.style.display = '';
    const noResultsContent = block.querySelector('.browse-card-no-results');
    if (noResultsContent) {
      noResultsContent.remove();
    }
    const cardPromises = contentTypes.map((contentType) =>
      BrowseCardsDelegate.fetchCardData({
        ...params,
        contentType: [contentType],
      }),
    );
    Promise.all(cardPromises)
      .then((cardDataValues) => {
        // Hide shimmer placeholders
        const data = cardDataValues?.flat() || [];
        buildCardsShimmer.remove();
        if (data?.length) {
          // Render cards
          for (let i = 0; i < data.length; i += 1) {
            const cardData = data[i];
            const cardDiv = document.createElement('div');
            buildCard(contentDiv, cardDiv, cardData);
            contentDiv.appendChild(cardDiv);
          }
          // Append content div to shimmer card parent and decorate icons
          block.appendChild(contentDiv);
          contentDiv.style.display = 'flex';
        } else {
          buildCardsShimmer.remove();
          buildNoResultsContent(block, true);
          contentDiv.style.display = 'none';
        }

        const navSectionEl = block.querySelector('.recommended-content-nav-section');
        if (navSectionEl) {
          const classOp =
            contentDiv?.scrollWidth && contentDiv.scrollWidth <= contentDiv.offsetWidth ? 'add' : 'remove';
          navSectionEl.classList[classOp]('recommended-content-hidden');
        }
      })
      .catch((err) => {
        // Hide shimmer placeholders on error
        buildCardsShimmer.remove();
        buildNoResultsContent(block, true);
        contentDiv.style.display = 'none';
        /* eslint-disable-next-line no-console */
        console.error(err);
      });
  };

  const renderCardBlock = (parentDiv) => {
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('browse-cards-block-content', 'recommended-content-block-section');
    parentDiv.appendChild(contentDiv);
  };

  const setNavigationElementStatus = () => {
    const prevNav = block.querySelector('.prev-nav');
    const nextNav = block.querySelector('.next-nav');
    const scrollBarSection = block.querySelector('.recommended-content-block-section');
    const { scrollLeft } = scrollBarSection;
    const delta = 10;
    const scrollRightMax = scrollBarSection.scrollWidth - delta;
    if (scrollLeft === 0) {
      prevNav.classList.add('disabled');
    } else {
      prevNav.classList.remove('disabled');
    }
    if (scrollBarSection.offsetWidth && scrollLeft + scrollBarSection.offsetWidth >= scrollRightMax) {
      nextNav.classList.add('disabled');
    } else {
      nextNav.classList.remove('disabled');
    }
  };

  const handleScroll = (next) => {
    const loadNext = next === true;
    const blockContent = block.querySelector('.recommended-content-block-section');
    const elementWidth = blockContent?.firstElementChild?.offsetWidth || 0;
    if (!elementWidth) {
      return;
    }
    const currentScrollLeft = Math.ceil(blockContent.scrollLeft);
    const gapValue = parseInt(getComputedStyle(blockContent).gap, 10);
    const scrollOffsetValue = gapValue + elementWidth;

    const offsetDelta =
      currentScrollLeft % scrollOffsetValue > 0.6 * scrollOffsetValue ? 0 : currentScrollLeft % scrollOffsetValue;

    const targetScrollLeft = currentScrollLeft - offsetDelta + (loadNext ? scrollOffsetValue : -scrollOffsetValue);
    blockContent.scrollLeft = targetScrollLeft;
    setNavigationElementStatus();
  };

  const renderNavigationArrows = () => {
    const navigationElements = htmlToElement(`
                <div class="recommended-content-nav-section">
                    <button class="prev-nav">
                        <span class="icon icon-chevron"></span>
                    </button>
                    <button class="next-nav">
                        <span class="icon icon-chevron"></span>
                    </button
                </div>
            `);
    const prevButton = navigationElements.querySelector('.prev-nav');
    const nextButton = navigationElements.querySelector('.next-nav');
    prevButton.addEventListener('click', () => {
      handleScroll(false);
    });
    nextButton.addEventListener('click', () => {
      handleScroll(true);
    });
    const scrollBarSection = block.querySelector('.recommended-content-block-section');
    scrollBarSection.addEventListener('scrollend', setNavigationElementStatus);
    blockHeader.appendChild(navigationElements);
    setNavigationElementStatus();
  };

  if (renderDropdown) {
    const dropdownOptions = filterOptions.map((opt) => {
      const value = convertToTitleCase(opt);
      return {
        value,
        title: value,
        id: opt,
      };
    });
    const initialDropdownValue = convertToTitleCase(defaultFilterOption || `${placeholders?.select || 'Select'}`);
    const filterDropdown = new Dropdown(blockHeader, initialDropdownValue, dropdownOptions);
    renderCardBlock(block);
    filterDropdown.handleOnChange((selectedOptionValue) => {
      const option = dropdownOptions.find((opt) => opt.value === selectedOptionValue);
      if (option?.id) {
        fetchDataAndRenderBlock(option.id);
      }
    });
    fetchDataAndRenderBlock(initialDropdownValue);
    filterDropdown.updateDropdownValue(initialDropdownValue);
    renderNavigationArrows();
  } else {
    const onTabReady = () => {
      renderCardBlock(block);
      renderNavigationArrows();
    };
    // eslint-disable-next-line no-new
    new TabbedCard({
      parentFormElement: blockHeader,
      defaultValue: defaultFilterOption,
      optionsArray: filterOptions,
      placeholders,
      showViewAll: false,
      fetchDataAndRenderBlock,
      onTabFormReady: onTabReady,
    });
  }
}
