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
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import ResponsiveList from '../../scripts/responsive-list/responsive-list.js';
import { handleTargetEvent, checkTargetSupport, targetDataAdapter } from '../../scripts/target/target.js';

const DEFAULT_NUM_CARDS = 4;
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}
const countNumberAsArray = (n) => Array.from({ length: n }, (_, i) => n - i);
const { targetCriteriaIds } = getConfig();

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

const ALL_MY_OPTIONS_KEY = placeholders?.allMyProducts || 'All my products';
const ALL_ADOBE_OPTIONS_KEY = placeholders?.allAdobeProducts || 'All Adobe Products';

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  let targetSupport = checkTargetSupport();

  // Extracting elements from the block
  const htmlElementData = [...block.children].map((row) => row.firstElementChild);
  const [headingElement, descriptionElement, filterSectionElement, ...remainingElements] = htmlElementData;

  if (targetSupport) {
    headingElement.style.display = 'none';
    descriptionElement.style.display = 'none';
  }

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

  const reversedDomElements = remainingElements.reverse();
  const [firstEl, secondEl, targetCriteria, thirdEl, fourthEl, fifthEl, ...otherEl] = reversedDomElements;
  const targetCriteriaId = targetCriteria.textContent.trim();
  const profileData = (await defaultProfileClient.getMergedProfile()) || {};
  const {
    role: profileRoles = [],
    interests: profileInterests = [],
    solutionLevels: profileSolutionLevels = [],
  } = profileData;

  let defaultOptionsKey = [];

  if (profileInterests.length === 0) {
    defaultOptionsKey.push(ALL_ADOBE_OPTIONS_KEY);
  } else {
    defaultOptionsKey.push(ALL_MY_OPTIONS_KEY);
  }

  if (targetSupport && targetCriteriaId) {
    if (profileInterests.length > 0) {
      defaultOptionsKey = [];
      defaultOptionsKey.push(ALL_ADOBE_OPTIONS_KEY);
      defaultOptionsKey.push(ALL_MY_OPTIONS_KEY);
    }
  }

  if (targetSupport) {
    targetSupport = Object.values(targetCriteriaIds).indexOf(targetCriteriaId) > -1;
    handleTargetEvent(targetCriteriaId).then((data) => {
      if (data && data.meta) {
        headingElement.innerHTML = data.meta.heading;
        descriptionElement.innerHTML = data.meta.subheading;
      }
      headingElement.style.display = 'block';
      descriptionElement.style.display = 'block';
    });
  }
  const sortByContent = thirdEl?.innerText?.trim();
  const contentTypes = otherEl?.map((contentTypeEL) => contentTypeEL?.innerText?.trim()).reverse() || [];
  const contentTypeIsEmpty = contentTypes?.length === 0;
  const numberOfResults = contentTypeIsEmpty ? DEFAULT_NUM_CARDS : 1;

  const contentTypesFetchMap = contentTypeIsEmpty
    ? { '': DEFAULT_NUM_CARDS }
    : contentTypes.reduce((acc, curr) => {
        if (!acc[curr]) {
          acc[curr] = 1;
        } else {
          acc[curr] += 1;
        }
        return acc;
      }, {});

  const encodedSolutionsText = fifthEl.innerText?.trim() ?? '';

  const { products, versions, features } = extractCapability(encodedSolutionsText);

  const interestsDataArray = await interestDataPromise;

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

  filterOptions.unshift(...defaultOptionsKey);
  const [defaultFilterOption = ''] = filterOptions;
  const renderedCardTitles = [];

  const renderCardPlaceholders = (contentDiv) => {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-wrapper');
    contentDiv.appendChild(cardDiv);
    const cardPlaceholder = new BuildPlaceholder(1);
    cardPlaceholder.add(cardDiv);
    return {
      shimmer: cardPlaceholder,
      wrapper: cardDiv,
    };
  };

  const getCardsData = (payload) =>
    new Promise((resolve) => {
      BrowseCardsDelegate.fetchCardData(payload)
        .then((data) => {
          const [ct] = payload.contentType || [''];
          resolve({
            contentType: ct,
            data,
          });
        })
        .catch(() => {
          resolve({});
        });
    });

  const parseCardResponseData = (cardResponse, apiConfigObject) => {
    let data = [];
    if (targetSupport) {
      data = cardResponse.data;
      const { shimmers, params, optionType } = apiConfigObject;
      shimmers.forEach((shimmer) => {
        shimmer.remove();
      });
      if (params.context.interests.length && optionType.toLowerCase() !== defaultOptionsKey[0].toLowerCase()) {
        if (optionType.toLowerCase() === defaultOptionsKey[1].toLowerCase()) {
          data = data.filter((pageData) =>
            params.context.interests.some((ele) => pageData.product.toLowerCase().includes(ele.toLowerCase())),
          );
        } else {
          data = data.filter((pageData) => pageData.product.toLowerCase().includes(optionType.toLowerCase()));
        }
      }
      const cardData = [];
      let i = 0;
      while (cardData.length < 4 && i < data.length) {
        cardData.push(targetDataAdapter(data[i], placeholders));
        i += 1;
      }
      data = cardData;
    } else {
      const { data: cards = [], contentType: ctType } = cardResponse || {};
      const { shimmers: cardShimmers, payload: apiPayload, wrappers: cardWrappers } = apiConfigObject;
      const { noOfResults } = apiPayload;
      if (cards.length) {
        countNumberAsArray(noOfResults).forEach(() => {
          const model = cards.shift();
          if (model) {
            data.push(model);
          }
          const cardShimmer = cardShimmers.shift();
          if (cardShimmer) {
            cardShimmer.remove();
          }
        });
      } else {
        const payloadInfo = {
          ...apiPayload,
          contentType: null,
          noOfResults: 4,
        };
        data.push({
          cardPromise: getCardsData(payloadInfo),
          shimmers: cardShimmers,
          contentType: ctType,
          wrappers: cardWrappers,
          cardsToRenderCount: noOfResults,
        });
      }
    }
    return data;
  };

  const renderCardsBlock = (cardModels, payloadConfig, contentDiv) => {
    const promises = cardModels.map(
      (cardData, i) =>
        new Promise((resolve) => {
          const cardDiv = payloadConfig.wrappers[i];
          if (cardData?.cardPromise) {
            cardData.cardPromise.then((cardDataResponse) => {
              const { cardsToRenderCount } = cardData;
              const { data: delayedCardData = [] } = cardDataResponse;
              if (delayedCardData.length === 0) {
                cardData.shimmers.forEach((shim, index) => {
                  shim.remove();
                  cardData.wrappers[index].style.display = 'none';
                });
              } else {
                countNumberAsArray(cardsToRenderCount).forEach((_, index) => {
                  const shimmer = cardData.shimmers[index];
                  const wrapperDiv = cardData.wrappers[index];
                  if (shimmer) {
                    shimmer.remove();
                  }
                  wrapperDiv.innerHTML = '';
                  const [defaultCardModel] = delayedCardData;
                  const targetIndex = delayedCardData.findIndex(
                    (delayData) => !renderedCardTitles.includes(delayData.title),
                  );
                  let cardModel;
                  if (targetIndex !== -1) {
                    cardModel = delayedCardData[targetIndex];
                    delayedCardData.splice(targetIndex, 1);
                  } else {
                    cardModel = defaultCardModel;
                    delayedCardData.splice(0, 1);
                  }
                  renderedCardTitles.push(cardModel.title);
                  buildCard(contentDiv, wrapperDiv, cardModel);
                });
              }
              resolve(true);
            });
          } else {
            cardDiv.innerHTML = '';
            if (cardData?.title) {
              renderedCardTitles.push(cardData.title);
            }
            buildCard(contentDiv, cardDiv, cardData);
            resolve(true);
          }
        }),
    );
    contentDiv.style.display = 'flex';
    return promises;
  };

  const recommendedContentNoResults = () => {
    const recommendedContentNoResultsElement = block.querySelector('.browse-card-no-results');
    const noResultsText =
      placeholders?.recommendedContentNoResultsText ||
      `We couldn’t find specific matches, but here are the latest tutorials/articles that others are loving right now!`;
    recommendedContentNoResultsElement.innerHTML = noResultsText;
  };

  const fetchDataAndRenderBlock = async (optionType) => {
    const contentDiv = block.querySelector('.recommended-content-block-section');
    const lowercaseOptionType = optionType?.toLowerCase();
    contentDiv.dataset.selected = lowercaseOptionType;
    const showProfileOptions = defaultOptionsKey.some((key) => lowercaseOptionType === key.toLowerCase());
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
    contentDiv.style.display = '';
    const noResultsContent = block.querySelector('.browse-card-no-results');
    if (noResultsContent) {
      noResultsContent.remove();
    }
    let cardPromises = [];
    if (targetSupport) {
      const cardShimmers = [];
      const wrappers = [];
      countNumberAsArray(DEFAULT_NUM_CARDS).forEach(() => {
        const { shimmer, wrapper } = renderCardPlaceholders(contentDiv);
        cardShimmers.push(shimmer);
        wrappers.push(wrapper);
      });
      const payloadConfig = {
        targetSupport,
        shimmers: cardShimmers,
        wrappers,
        params,
        optionType,
      };
      cardPromises.push(
        new Promise((resolve) => {
          handleTargetEvent(targetCriteriaId)
            .then((resp) => {
              const cardModels = parseCardResponseData(resp, payloadConfig);
              if (cardModels?.length) {
                renderCardsBlock(cardModels, payloadConfig, contentDiv);
              }
              resolve({
                data: cardModels,
                payloadConfig,
              });
            })
            .catch(() => {
              resolve({ data: [] });
            });
        }),
      );
    } else {
      cardPromises = Object.keys(contentTypesFetchMap).map((contentType) => {
        const payload = {
          ...params,
        };
        if (contentType) {
          payload.contentType = [contentType];
        }
        if (contentTypesFetchMap[contentType]) {
          payload.noOfResults = contentTypesFetchMap[contentType];
        }
        const { noOfResults } = payload;
        const cardShimmers = [];
        const wrappers = [];
        countNumberAsArray(noOfResults).forEach(() => {
          const { shimmer, wrapper } = renderCardPlaceholders(contentDiv);
          cardShimmers.push(shimmer);
          wrappers.push(wrapper);
        });
        const [payloadContentType] = payload.contentType || [''];
        const payloadConfig = {
          payload,
          shimmers: cardShimmers,
          contentType: payloadContentType,
          wrappers,
        };
        return new Promise((resolve) => {
          getCardsData(payload).then(async (resp) => {
            const cardModels = parseCardResponseData(resp, payloadConfig);
            if (cardModels?.length) {
              const renderPromises = renderCardsBlock(cardModels, payloadConfig, contentDiv);
              await Promise.all(renderPromises);
            }
            resolve({
              data: cardModels,
              payloadConfig,
            });
          });
        });
      });
    }
    Promise.all(cardPromises)
      .then(() => {
        const cardsCount = contentDiv.querySelectorAll('.browse-card').length;
        if (cardsCount === 0) {
          buildNoResultsContent(contentDiv, true);
          recommendedContentNoResults(contentDiv);
          contentDiv.style.display = 'block';
          return;
        }

        const navSectionEl = block.querySelector('.recommended-content-nav-section');
        if (navSectionEl) {
          const classOp =
            contentDiv?.scrollWidth && contentDiv.scrollWidth <= contentDiv.offsetWidth ? 'add' : 'remove';
          navSectionEl.classList[classOp]('recommended-content-hidden');
        }
      })
      .catch((err) => {
        const cardsBlockCount = contentDiv.querySelectorAll('.browse-card').length;
        if (cardsBlockCount === 0) {
          buildNoResultsContent(contentDiv, true);
          recommendedContentNoResults(contentDiv);
          contentDiv.style.display = 'block';
        } else {
          // In the unlikely scenario that some card promises were successfully resolved, while some others failed. Try to show the rendered cards.
          Array.from(contentDiv.querySelectorAll('.shimmer-placeholder')).forEach((element) => {
            element.remove();
          });
        }
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

  /* TODO: Commenting it for further references, will up updating for the below code for navigation arrow changes */
  /*
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
  */

  /* Responsive List View */
  const listItems = filterOptions.map((item) => {
    const value = item ? convertToTitleCase(item) : '';
    return {
      value,
      title: value,
    };
  });

  const defaultOption = defaultFilterOption ? convertToTitleCase(defaultFilterOption) : null;

  // eslint-disable-next-line no-new
  new ResponsiveList({
    wrapper: blockHeader,
    items: listItems,
    defaultSelected: defaultOption,
    onInitCallback: () => {
      /* Reused the existing method */
      renderCardBlock(block);
      fetchDataAndRenderBlock(defaultOption);
    },
    onSelectCallback: (selectedItem) => {
      /* Reused the existing method */
      if (selectedItem) {
        fetchDataAndRenderBlock(selectedItem);
      }
    },
  });
}
