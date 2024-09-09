import TabbedCardList from '../../scripts/tabbed-card-list/tabbed-card-list.js';
import { createTag, fetchLanguagePlaceholders, htmlToElement, getConfig } from '../../scripts/scripts.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import {
  convertToTitleCase,
  extractCapability,
  removeProductDuplicates,
} from '../../scripts/browse-card/browse-card-utils.js';
import { defaultProfileClient } from '../../scripts/auth/profile.js';
import Dropdown, { DROPDOWN_VARIANTS } from '../../scripts/dropdown/dropdown.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';

async function fetchInterestData() {
  try {
    let data;
    const { interestsUrl } = getConfig();
    const response = await fetch(interestsUrl, {
      method: 'GET',
    });
    if (response.ok) {
      data = await response.json();
    }
    return data?.data || [];
  } catch (error) {
    /* eslint-disable no-console */
    console.error('Error fetching data', error);
    return [];
  }
}

const interestDataPromise = fetchInterestData();
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const ALL_MY_OPTIONS_KEY = placeholders?.allMyProducts || 'All my products';

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

  const isDesktop = window.matchMedia('(min-width:900px)').matches;
  const reversedDomElements = remainingElements.reverse();
  const [firstEl, secondEl, thirdEl, fourthEl, fifthEl, ...otherEl] = reversedDomElements;
  const sortByContent = thirdEl?.innerText?.trim();
  const contentTypes = otherEl?.map((contentTypeEL) => contentTypeEL?.innerText?.trim()).reverse();
  const contentTypeIsEmpty = contentTypes?.length === 0;
  const encodedSolutionsText = fifthEl.innerText?.trim() ?? '';

  const { products, versions, features } = extractCapability(encodedSolutionsText);

  const profileData = (await defaultProfileClient.getMergedProfile()) || {};
  const interestsDataArray = await interestDataPromise;

  const {
    role: profileRoles = [],
    interests: profileInterests = [],
    solutionLevels: profileSolutionLevels = [],
  } = profileData;
  const sortedProfileInterests = profileInterests.sort();
  const filterOptions = [...new Set(sortedProfileInterests)];
  const experienceLevels = sortedProfileInterests.map((interestName) => {
    const interest = interestsDataArray.find((int) => int.Name === interestName);
    let expLevel = 'Beginner';
    if (interest) {
      const solution = profileSolutionLevels.find((sol) => sol.includes(interest.id)) || '';
      const [, level] = solution.split(':');
      if (level) {
        expLevel = level;
      }
    }
    return expLevel;
  });

  const sortCriteria = COVEO_SORT_OPTIONS[sortByContent?.toUpperCase() ?? 'MOST_POPULAR'];
  const role = fourthEl?.innerText?.trim()?.includes('profile_context')
    ? profileRoles
    : fourthEl?.innerText?.trim().split(',').filter(Boolean);

  filterOptions.unshift(ALL_MY_OPTIONS_KEY);

  const renderDropdown = isDesktop ? filterOptions?.length > 4 : true;
  const numberOfResults = contentTypeIsEmpty ? 4 : 1;
  const [defaultFilterOption = ''] = filterOptions;

  const buildCardsShimmer = new BuildPlaceholder(contentTypeIsEmpty ? numberOfResults : contentTypes.length);

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
    const expLevelIndex = sortedProfileInterests.findIndex((s) => s === interest);
    const expLevel = experienceLevels[expLevelIndex] ?? 'Beginner';
    let clonedProducts = structuredClone(removeProductDuplicates(products));
    if (!showProfileOptions && !clonedProducts.find((c) => c.toLowerCase() === lowercaseOptionType)) {
      clonedProducts.push(interest);
    }

    if (showProfileOptions) {
      // show everything for default tab
      clonedProducts = [...new Set([...products, ...sortedProfileInterests])];
    }
    console.log({ sortedProfileInterests, clonedProducts, products });
    const params = {
      contentType: null,
      product: clonedProducts,
      feature: features.length ? [...new Set(features)] : null,
      version: versions.length ? [...new Set(versions)] : null,
      role: role?.length ? role : profileRoles,
      sortCriteria,
      noOfResults: numberOfResults,
      context: showProfileOptions
        ? { role: profileRoles, interests: sortedProfileInterests, experience: experienceLevels }
        : { interests: [interest], experience: [expLevel], role: profileRoles },
    };

    contentDiv.innerHTML = '';
    buildCardsShimmer.add(contentDiv);
    contentDiv.style.display = '';
    const noResultsContent = block.querySelector('.browse-card-no-results');
    if (noResultsContent) {
      noResultsContent.remove();
    }
    const cardPromises = contentTypeIsEmpty
      ? [BrowseCardsDelegate.fetchCardData(params)]
      : contentTypes.map((contentType) => {
          const payload = {
            ...params,
          };
          if (contentType) {
            payload.contentType = [contentType];
          }
          return BrowseCardsDelegate.fetchCardData(payload);
        });
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
          contentDiv.style.display = 'flex';
        } else {
          buildCardsShimmer.remove();
          buildNoResultsContent(contentDiv, true);
          contentDiv.style.display = 'block';
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
        buildNoResultsContent(contentDiv, true);
        contentDiv.style.display = 'block';
        /* eslint-disable-next-line no-console */
        console.error(err);
      });
  };

  const renderCardBlock = (parentDiv) => {
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('browse-cards-block-content', 'recommended-content-block-section');
    parentDiv.appendChild(contentDiv);
    secondEl.classList.add('recommended-content-discover-resource');
    firstEl.classList.add('recommended-content-result-link');
    if (firstEl.innerHTML || secondEl.innerHTML) {
      const seeMoreEl = htmlToElement(`<div class="recommended-content-result-text">
        ${secondEl.outerHTML}
        ${firstEl.outerHTML}
        </div>`);
      parentDiv.appendChild(seeMoreEl);
    }
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
    const uniqueId = parseInt(Math.random() * 10 ** 8, 10);
    const filterDropdown = new Dropdown(
      blockHeader,
      initialDropdownValue,
      dropdownOptions,
      DROPDOWN_VARIANTS.DEFAULT,
      uniqueId,
    );
    renderCardBlock(block);
    filterDropdown.handleOnChange((selectedOptionValue) => {
      const option = dropdownOptions.find((opt) => opt.value === selectedOptionValue);
      if (option?.id) {
        fetchDataAndRenderBlock(option.id);
      }
    });
    fetchDataAndRenderBlock(initialDropdownValue);
    filterDropdown.updateDropdownValue(initialDropdownValue);
    if (!isDesktop) {
      renderNavigationArrows();
    }
  } else {
    const onTabReady = () => {
      renderCardBlock(block);
      if (!isDesktop) {
        renderNavigationArrows();
      }
    };
    // eslint-disable-next-line no-new
    new TabbedCardList({
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
