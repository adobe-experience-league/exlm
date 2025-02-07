import { createTag, fetchLanguagePlaceholders, getConfig, htmlToElement } from '../../scripts/scripts.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import {
  convertToTitleCase,
  extractCapability,
  removeProductDuplicates,
} from '../../scripts/browse-card/browse-card-utils.js';
import { defaultProfileClient } from '../../scripts/auth/profile.js';
import getEmitter from '../../scripts/events.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import ResponsivePillList from '../../scripts/responsive-pill-list/responsive-pill-list.js';
import defaultAdobeTargetClient from '../../scripts/adobe-target/adobe-target.js';
import BrowseCardsTargetDataAdapter from '../../scripts/browse-card/browse-cards-target-data-adapter.js';
import isFeatureEnabled from '../../scripts/utils/feature-flag-utils.js';
import setTargetDataAsBlockAttribute from '../../scripts/utils/analytics-utils.js';

const targetEventEmitter = getEmitter('loadTargetBlocks');
const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
const DEFAULT_NUM_CARDS = 5;
let seeMoreFlag = false;
const seeMoreConfig = {
  minWidth: 1024,
  noOfRows: 2,
  prefetchCards: false,
};

let placeholders = {};

const countNumberAsArray = (n) => Array.from({ length: n }, (_, i) => n - i);

/**
 * Generates HTML for loading shimmer animation with customizable sizes and an optional CSS class
 *
 * @param {Array} shimmerSizes - An array of arrays, where each inner array contains width (percentage) and height (pixels)
 *                                 for individual shimmer divs.
 *
 * @returns {string} - A string of HTML containing the shimmer divs with inline styles for width and height.
 *
 */

function generateLoadingShimmer(shimmerSizes = [[100, 30]]) {
  return shimmerSizes
    .map(
      ([width, height]) =>
        `<div class="loading-shimmer" style="--placeholder-width: ${width}%; --placeholder-height: ${height}px"></div>`,
    )
    .join('');
}

function ensureDataSaveConfigExists(dataConfiguration, lowercaseOptionType, ctType) {
  if (!dataConfiguration.savedCardsResponse[lowercaseOptionType]) {
    dataConfiguration.savedCardsResponse[lowercaseOptionType] = {};
  }
  if (!dataConfiguration.savedCardsResponse[lowercaseOptionType][ctType]) {
    dataConfiguration.savedCardsResponse[lowercaseOptionType][ctType] = {
      models: [],
    };
  }
}

function getSavedCardsCount(dataConfiguration, optionType) {
  return Object.values(dataConfiguration.savedCardsResponse[optionType] || {}).reduce(
    (acc, curr) => acc + curr.models.length,
    0,
  );
}

function restoreSavedCardsModelState(dataConfiguration, optionType) {
  const savedCardResponseModel = dataConfiguration.savedCardsResponse[optionType] || {};
  const contentTypes = Object.keys(savedCardResponseModel);
  contentTypes.forEach((contentType) => {
    const savedCardResponse = dataConfiguration.savedCardsResponse[optionType][contentType];
    const cardModels = savedCardResponse.models || [];
    cardModels.forEach((cardModel) => {
      delete cardModel.markedForReplacement;
    });
  });
}

function getSavedCardModel(dataConfiguration, optionType) {
  const savedCardContentTypes = Object.keys(dataConfiguration.savedCardsResponse[optionType] || {});
  return savedCardContentTypes.reduce((acc, curr) => {
    if (acc) {
      return acc;
    }
    const savedCardResponse = dataConfiguration.savedCardsResponse[optionType][curr];
    const cardModels = savedCardResponse.models || [];
    const model = cardModels.find((modelInfo) => modelInfo.markedForReplacement !== true);
    if (model) {
      model.markedForReplacement = true;
    }
    return model || acc;
  }, null);
}

function createSeeMoreButton(block, contentDiv, fetchDataAndRenderBlock) {
  if (!block.querySelector('.recommendation-marquee-see-more-btn')) {
    const btnContainer = document.createElement('div');
    const btn = document.createElement('button');
    btn.innerHTML = placeholders?.recommendedContentSeeMoreButtonText || 'See more Recommendations';
    btnContainer.classList.add('recommendation-marquee-see-more-btn');
    btnContainer.appendChild(btn);
    contentDiv.insertAdjacentElement('afterend', btnContainer);

    btn.addEventListener('click', () => {
      seeMoreFlag = true;
      const contentDivs = block.querySelectorAll('.recommendation-marquee-block-section');
      const currentRow = parseInt(block.dataset.browseCardRows, 10);
      const maxRows = parseInt(block.dataset.maxRows, 10);
      const newRow = currentRow ? currentRow + 1 : 2;
      block.dataset.browseCardRows = newRow;
      const { allRowsLoaded } = block.dataset;

      function hideSeeMoreRows() {
        seeMoreFlag = false;
        contentDivs.forEach((div, index) => {
          if (index > 0) {
            div.classList.add('fade-out');
            div.classList.remove('fade-in');
            const handleTransitionEnd = () => {
              div.style.display = 'none';
              div.removeEventListener('animationend', handleTransitionEnd);
            };
            div.addEventListener('animationend', handleTransitionEnd);
          }
        });
        btn.innerHTML = placeholders?.recommendedContentSeeMoreButtonText || 'See more Recommendations';
        block.dataset.browseCardRows = 1;
        setTimeout(() => {
          block.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }

      function showNewRow() {
        contentDivs.forEach((div, index) => {
          div.style.display = 'flex';

          if (index > newRow - 1) {
            div.style.display = 'none';
            div.classList.remove('fade-in');
            div.classList.add('fade-out');
          } else {
            div.classList.add('fade-in');
            div.classList.remove('fade-out');
          }
        });
      }

      if (allRowsLoaded === 'true' && newRow > seeMoreConfig.noOfRows) {
        hideSeeMoreRows();
      } else if (allRowsLoaded === 'true' && maxRows) {
        if (newRow > maxRows) {
          hideSeeMoreRows();
        } else {
          if (newRow === maxRows) {
            btn.innerHTML = placeholders?.recommendedContentSeeLessButtonText || 'See Less Recommendations';
          }
          showNewRow();
        }
      } else if (allRowsLoaded === 'true') {
        if (newRow === seeMoreConfig.noOfRows) {
          btn.innerHTML = placeholders?.recommendedContentSeeLessButtonText || 'See Less Recommendations';
        }
        showNewRow();
      } else {
        if (newRow === seeMoreConfig.noOfRows) {
          block.dataset.allRowsLoaded = true;
          btn.innerHTML = placeholders?.recommendedContentSeeLessButtonText || 'See Less Recommendations';
        }
        seeMoreConfig.prefetchCards = false;
        const optionType = block.querySelector('.browse-cards-block-content').dataset.selected;
        fetchDataAndRenderBlock(optionType, { renderCards: true, createRow: true, clearSeeMoreRows: false });
      }
    });
  }
}

/**
 * Update the copy from the target
 * @param {Object} data
 * @param {HTMLElement} heading
 * @param {HTMLElement} subheading
 * @returns {void}
 */
export function updateCopyFromTarget(data, heading, subheading, taglineCta, taglineText) {
  if (isFeatureEnabled('recMarqueeTargetHeading')) {
    if (data?.meta?.heading && heading) {
      if (heading.firstElementChild && !heading.firstElementChild.className.includes('loading-shimmer')) {
        heading.firstElementChild.innerHTML = data.meta.heading;
      } else {
        heading.innerHTML = data.meta.heading;
      }
    } else {
      heading?.remove();
    }
    if (data?.meta?.subheading && subheading) subheading.innerHTML = data.meta.subheading;
    else subheading?.remove();
  } else {
    heading?.remove();
    subheading?.remove();
  }
  if (
    taglineCta &&
    data?.meta['tagline-cta-text'] &&
    data?.meta['tagline-cta-url'] &&
    data.meta['tagline-cta-text'].trim() !== '' &&
    data.meta['tagline-cta-url'].trim() !== ''
  ) {
    taglineCta.innerHTML = `
        <a href="${data.meta['tagline-cta-url']}" title="${data.meta['tagline-cta-text']}">
          ${data.meta['tagline-cta-text']}
        </a>
      `;
  } else {
    taglineCta?.remove();
  }
  if (taglineText && data?.meta['tagline-text'] && data?.meta['tagline-text'].trim() !== '') {
    taglineText.innerHTML = data.meta['tagline-text'];
  } else {
    taglineText?.remove();
  }
  if (!document.contains(taglineCta) && !document.contains(taglineText)) {
    const taglineParentBlock = document.querySelector('.recommendation-marquee-result-text');
    if (taglineParentBlock) {
      taglineParentBlock?.remove();
    }
  }
}

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

const prepareExclusionQuery = (cardIdsToExclude) => {
  // eslint-disable-next-line no-useless-escape
  const query = cardIdsToExclude.map((id) => `(@el_id NOT \"${id}\")`).join(' AND ');
  return cardIdsToExclude.length <= 1 ? query : `(${query})`;
};

async function findEmptyFilters(targetCriteriaId, profileInterests = []) {
  const removeFilters = [];
  const resp = await defaultAdobeTargetClient.getTargetData(targetCriteriaId);
  if (resp?.data) {
    const { data } = resp;
    profileInterests.forEach((interest) => {
      let includesProfileInterest = false;
      for (let i = 0; i < data?.length ? data.length : 0; i += 1) {
        if (data[i].product.split(',').includes(interest)) {
          includesProfileInterest = true;
          break;
        }
      }
      if (!includesProfileInterest) removeFilters.push(interest);
    });
  }
  return removeFilters;
}

const interestDataPromise = fetchInterestData();

const renderCardPlaceholders = (contentDiv, renderCardsFlag = true) => {
  const cardDiv = document.createElement('div');
  cardDiv.classList.add('card-wrapper');
  if (renderCardsFlag) {
    contentDiv.appendChild(cardDiv);
  }
  const shimmerInstance = new BrowseCardShimmer(1);
  shimmerInstance.addShimmer(cardDiv);

  return {
    shimmer: shimmerInstance,
    wrapper: cardDiv,
  };
};

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const ALL_ADOBE_OPTIONS_KEY = placeholders?.allAdobeProducts || 'All Adobe Products';

  // Extracting elements from the block
  const htmlElementData = [...block.children].map((row) => row.firstElementChild);

  const [coveoToggle, linkEl, resultTextEl, sortEl, roleEl, solutionEl, filterProductByOptionEl, ...restOfEl] =
    htmlElementData.reverse();

  const showOnlyCoveo = coveoToggle?.textContent?.toLowerCase() === 'true';
  if (showOnlyCoveo) {
    block.classList.add('coveo-only');
  }

  const [headingElement, descriptionElement, ...contentTypesEl] = restOfEl.reverse();
  const headingElementNode = htmlToElement(headingElement.innerHTML);
  const recommendedContentShimmer = `
  <div class="recommendation-marquee-header">${generateLoadingShimmer([[50, 14]])}</div>
  <div class="recommendation-marquee-description">${generateLoadingShimmer([[50, 10]])}</div>
`;
  // Clearing the block's content and adding CSS class
  block.innerHTML = '';

  //   filterSectionElement.classList.add('recommendation-marquee-filter-heading');
  const blockHeader = createTag('div', { class: 'recommendation-marquee-block-header' });
  blockHeader.innerHTML = generateLoadingShimmer([[80, 30]]);
  block.insertAdjacentHTML('afterbegin', recommendedContentShimmer);
  //   block.appendChild(filterSectionElement);
  block.appendChild(blockHeader);

  const headerContainer = block.querySelector('.recommendation-marquee-header');
  const descriptionContainer = block.querySelector('.recommendation-marquee-description');

  const targetCriteriaId = block.dataset.targetScope;
  const profileDataPromise = defaultProfileClient.getMergedProfile();

  const tempWrapper = htmlToElement(`
      <div class="recommendation-marquee-temp-wrapper">
        <div class="browse-cards-block-content recommendation-marquee-block-section recommendation-marquee-shimmer-wrapper"></div>
      </div>
    `);
  const tempContentSection = tempWrapper.querySelector('.recommendation-marquee-block-section');
  countNumberAsArray(DEFAULT_NUM_CARDS).forEach(() => {
    const { shimmer: shimmerInstance, wrapper } = renderCardPlaceholders(tempWrapper);
    shimmerInstance.addShimmer(wrapper);
    tempContentSection.appendChild(wrapper);
  });

  block.appendChild(tempWrapper);

  const defaultOptionsKey = [];
  let contentTypesFetchMap = {};
  const cardIdsToExclude = [];
  const allMyProductsCardModels = [];
  const dataConfiguration = {
    savedCardsResponse: {},
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

  const renderCardsBlock = (cardModels, payloadConfig, contentDiv) => {
    const { renderCards = true, lowercaseOptionType, targetSupport } = payloadConfig;
    const cardModelsToRender = cardModels
      .filter((model, index) => {
        if (!seeMoreConfig.prefetchCards || !model || targetSupport) {
          return model;
        }
        const { payload, contentType } = payloadConfig;
        const { noOfResults } = payload;
        const renderCount = noOfResults / 2;
        if (index + 1 > renderCount) {
          ensureDataSaveConfigExists(dataConfiguration, lowercaseOptionType, contentType);
          dataConfiguration.savedCardsResponse[lowercaseOptionType][contentType].models.push(model);
          return null;
        }
        return model;
      })
      .filter(Boolean);
    const promises = cardModelsToRender.map(
      (cardData, i) =>
        new Promise((resolve) => {
          const cardDiv = payloadConfig.wrappers[i];
          const alreadyRenderedCardIds = dataConfiguration[lowercaseOptionType]?.renderedCardIds || [];
          if (cardData?.cardPromise) {
            cardData.cardPromise.then((cardDataResponse) => {
              const { cardsToRenderCount } = cardData;
              const { data: delayedCardData = [] } = cardDataResponse;
              const cardModelsList = [];
              if (delayedCardData.length === 0) {
                if (renderCards) {
                  cardData.shimmers?.forEach((shimmerInstance, index) => {
                    shimmerInstance.removeShimmer();
                    cardData.wrappers[index].style.display = 'none';
                  });
                }
              } else {
                countNumberAsArray(cardsToRenderCount).forEach((_, index) => {
                  const shimmer = cardData.shimmers[index];
                  const wrapperDiv = cardData.wrappers[index];
                  if (renderCards) {
                    if (shimmer) {
                      shimmer.removeShimmer();
                    }
                    wrapperDiv.innerHTML = '';
                  }
                  const [defaultCardModel] = delayedCardData;
                  const targetIndex = delayedCardData.findIndex((delayData) =>
                    delayData.id ? !alreadyRenderedCardIds.includes(delayData.id) : false,
                  );
                  let cardModel;
                  if (targetIndex !== -1) {
                    cardModel = delayedCardData[targetIndex];
                    delayedCardData.splice(targetIndex, 1);
                  } else {
                    cardModel = defaultCardModel;
                    delayedCardData.splice(0, 1);
                  }
                  if (renderCards) {
                    if (cardModel && cardModel.id) {
                      dataConfiguration[lowercaseOptionType].renderedCardIds.push(cardModel.id);
                      cardModel.truncateDescription = false;
                    }
                    buildCard(contentDiv, wrapperDiv, cardModel);
                  }
                  cardModelsList.push(cardModel);
                });
              }
              resolve(cardModelsList);
            });
          } else {
            if (seeMoreConfig.prefetchCards && cardData.cardPromise === null) {
              resolve([cardData]);
              return;
            }
            if (renderCards) {
              cardDiv.innerHTML = '';
              if (cardData.id) {
                cardData.truncateDescription = false;
                dataConfiguration[lowercaseOptionType].renderedCardIds.push(cardData.id);
              }
              buildCard(contentDiv, cardDiv, cardData);
            }
            resolve([cardData]);
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
    const btn = block.querySelector('.recommendation-marquee-see-more-btn');
    if (btn) {
      btn.classList.add('hide');
    }
  };

  const renderCardBlock = (parentDiv) => {
    if (block.contains(tempWrapper)) {
      block.removeChild(tempWrapper);
    }
    const contentDiv = document.createElement('div');
    contentDiv.classList.add(
      'browse-cards-block-content',
      'recommendation-marquee-block-section',
      'recommendation-marquee-wrap',
    );
    parentDiv.appendChild(contentDiv);
    resultTextEl.classList.add('recommendation-marquee-discover-resource');
    linkEl.classList.add('recommendation-marquee-result-link');
    if (linkEl.innerHTML || resultTextEl.innerHTML) {
      const seeMoreEl = document.createElement('div');
      seeMoreEl.classList.add('recommendation-marquee-result-text');
      seeMoreEl.appendChild(resultTextEl);
      seeMoreEl.appendChild(linkEl);
      parentDiv.appendChild(seeMoreEl);
    }
  };

  const getListOfFilterOptions = async (targetSupport, profileInterests, targetCriteriaScopeId) => {
    const sortedProfileInterests = profileInterests.sort();
    let filterOptions = [...new Set(sortedProfileInterests)];
    filterOptions.unshift(...defaultOptionsKey);
    if (targetSupport) {
      const emptyFilters = await findEmptyFilters(targetCriteriaScopeId, profileInterests);
      filterOptions = filterOptions.filter((ele) => !emptyFilters.includes(ele));
    }
    return filterOptions;
  };

  const resetContentDiv = (contentDiv) => {
    contentDiv.innerHTML = '';
    contentDiv.style.display = '';
    const noResultsContent = block.querySelector('.browse-card-no-results');
    if (noResultsContent) {
      noResultsContent.remove();
    }
  };

  async function renderBlock({ targetSupport, targetCriteriaScopeId }) {
    Promise.all([profileDataPromise, interestDataPromise]).then(async (promiseResponses) => {
      const [profileData, interestsDataArray] = promiseResponses;
      const {
        role: profileRoles = [],
        interests: profileInterests = [],
        solutionLevels: profileSolutionLevels = [],
      } = profileData || {};

      if (profileInterests.length === 0) {
        // filterSectionElement.style.display = 'none';
        blockHeader.style.display = 'none';
      } else if (profileInterests.length === 1) {
        // filterSectionElement.style.display = 'none';
        blockHeader.style.display = 'block';
      } else {
        blockHeader.style.display = 'block';
      }
      if (defaultOptionsKey.length === 0) {
        defaultOptionsKey.push(ALL_ADOBE_OPTIONS_KEY);
      }
      const coveoFlowDetection = !(targetSupport && targetCriteriaScopeId);
      if (headingElementNode) {
        headerContainer.innerHTML = '';
        headerContainer.appendChild(headingElementNode);
      }
      if (coveoFlowDetection) {
        headerContainer.innerHTML = headingElement.innerHTML;
        descriptionContainer.innerHTML = descriptionElement.innerHTML;
        block.style.display = 'block';
      }

      const sortByContent = sortEl?.innerText?.trim();

      const encodedSolutionsText = solutionEl.innerText?.trim() ?? '';
      const { products, versions, features } = extractCapability(encodedSolutionsText);
      const sortedProfileInterests = profileInterests.sort();
      const experienceLevels = sortedProfileInterests.map((interestName) => {
        const interest = (interestsDataArray || []).find((int) => int.Name === interestName);
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
      const filterProductByOption = filterProductByOptionEl?.innerText?.trim() ?? '';
      const role = roleEl?.innerText?.trim()?.includes('profile_context')
        ? profileRoles
        : roleEl?.innerText?.trim().split(',').filter(Boolean);

      const filterOptions = await getListOfFilterOptions(targetSupport, profileInterests, targetCriteriaScopeId);
      const [defaultFilterOption = ''] = filterOptions;
      const containsAllAdobeProductsTab = filterOptions.includes(ALL_ADOBE_OPTIONS_KEY);

      async function parseCardResponseData(cardResponse, apiConfigObject) {
        let data = [];
        if (targetSupport) {
          data = cardResponse?.data ?? [];
          const { shimmers, params, optionType } = apiConfigObject;
          shimmers.forEach((shimmer) => {
            shimmer.removeShimmer();
          });
          if (optionType.toLowerCase() !== defaultOptionsKey[0].toLowerCase()) {
            if (defaultOptionsKey.length > 1 && optionType.toLowerCase() === defaultOptionsKey[1].toLowerCase()) {
              if (cardResponse?.allMyProducts) {
                data = cardResponse.allMyProducts;
              } else {
                data = data.filter((pageData) =>
                  params.context.interests.some((ele) => pageData.product.toLowerCase().includes(ele.toLowerCase())),
                );
                cardResponse.allMyProducts = Array.from(data).sort(() => Math.random() - 0.5);
              }
            } else {
              data = data.filter((pageData) => pageData.product.toLowerCase().includes(optionType.toLowerCase()));
            }
          }
          if (optionType.toLowerCase() === defaultOptionsKey[0].toLowerCase()) {
            if (cardResponse?.allAdobeProducts) {
              data = cardResponse.allAdobeProducts;
            } else {
              cardResponse.allAdobeProducts = Array.from(data).sort(() => Math.random() - 0.5);
              data = cardResponse.allAdobeProducts;
            }
          }
          const cardWithThumbnail = data.find((res) => res.thumbnail !== '');
          if (cardWithThumbnail) {
            data = data.filter((item) => item !== cardWithThumbnail);
            data.unshift(cardWithThumbnail);
          }
          const numberOfExistingCards = block.querySelectorAll('.card-wrapper a');
          const isWideScreen = window.innerWidth > 1432;
          const defaultCardCount = isWideScreen ? 3 : 2;
          const index = numberOfExistingCards.length ? numberOfExistingCards.length : 0;
          if (!data[index + (seeMoreFlag ? defaultCardCount : DEFAULT_NUM_CARDS)] && !block.dataset.browseCardRows) {
            const btn = block.querySelector('.recommendation-marquee-see-more-btn');
            if (btn) {
              btn.classList.add('hide');
            }
          }
          if (!data[index + (seeMoreFlag ? defaultCardCount : DEFAULT_NUM_CARDS)] && block.dataset.browseCardRows) {
            const btn = block.querySelector('.recommendation-marquee-see-more-btn > button');
            if (btn) {
              btn.innerHTML = placeholders?.recommendedContentSeeLessButtonText || 'See Less Recommendations';
            }
            block.dataset.allRowsLoaded = true;
            block.dataset.maxRows = block.dataset.browseCardRows;
          }
          data = await BrowseCardsTargetDataAdapter.mapResultsToCardsData(
            data.slice(index, index + (seeMoreFlag ? defaultCardCount : DEFAULT_NUM_CARDS)),
          );
        } else {
          const { data: cards = [], contentType: ctType } = cardResponse || {};
          const {
            shimmers: cardShimmers,
            payload: apiPayload,
            wrappers: cardWrappers,
            contentDiv,
            lowercaseOptionType,
          } = apiConfigObject;
          const { noOfResults } = apiPayload;
          if (cards.length) {
            countNumberAsArray(noOfResults).forEach(() => {
              const model = cards.shift();
              if (model) {
                data.push(model);
              }
              const cardShimmer = cardShimmers.shift();
              if (cardShimmer) {
                cardShimmer.removeShimmer();
              }
            });
          } else {
            const cardsHaveBeenSaved = getSavedCardsCount(dataConfiguration, lowercaseOptionType) > 0;
            if (seeMoreConfig.prefetchCards) {
              ensureDataSaveConfigExists(dataConfiguration, lowercaseOptionType, ctType);
              dataConfiguration.savedCardsResponse[lowercaseOptionType][ctType].models = [];
            } else if (cardsHaveBeenSaved) {
              // delete the shimmer and wrapper as this instance of saved card was already rendered in first row.
              // seeMoreConfig.prefetchCards will be false for the second row.
              cardWrappers.forEach((wrapper, index) => {
                wrapper.remove();
                cardShimmers[index].removeShimmer();
              });
            }
            // Remove contentType and make new call.
            const payloadInfo = {
              ...apiPayload,
              contentType: null,
              noOfResults: DEFAULT_NUM_CARDS,
            };
            data.push({
              cardPromise: seeMoreConfig.prefetchCards || cardsHaveBeenSaved ? null : getCardsData(payloadInfo),
              shimmers: cardShimmers,
              contentType: ctType,
              wrappers: cardWrappers,
              cardsToRenderCount: noOfResults,
              replaceCard: seeMoreConfig.prefetchCards,
              contentDiv,
            });
          }
        }
        return data;
      }

      const fetchDataAndRenderBlock = async (
        optionType,
        args = { renderCards: true, createRow: false, clearAllRows: false, clearSeeMoreRows: true },
      ) => {
        const btn = block.querySelector('.recommendation-marquee-see-more-btn');
        if (btn) {
          btn.classList.remove('hide');
        }
        let contentTypes = contentTypesEl?.map((contentTypeEL) => contentTypeEL?.innerText?.trim()) || [];
        contentTypes = contentTypes.slice(0, DEFAULT_NUM_CARDS);
        const contentTypeIsEmpty = contentTypes?.length === 0;
        let noOfRows = parseInt(block.dataset.browseCardRows, 10);
        if (!noOfRows) noOfRows = 1;
        let numberOfResults;
        if (seeMoreFlag) {
          numberOfResults = window.innerWidth > 1432 ? 3 : 2;
        } else {
          numberOfResults = contentTypeIsEmpty ? DEFAULT_NUM_CARDS * noOfRows : 1 * noOfRows;
        }
        let firstResult = 0;

        contentTypesFetchMap = contentTypeIsEmpty
          ? { '': DEFAULT_NUM_CARDS }
          : contentTypes.reduce((acc, curr) => {
              if (!acc[curr]) {
                acc[curr] = 1;
              } else {
                acc[curr] += 1;
              }
              return acc;
            }, {});

        let contentDiv = block.querySelector('.recommendation-marquee-block-section');

        if (args.clearAllRows) {
          // Remove the existing cards container
          block.removeAttribute('data-all-rows-loaded');
          block.removeAttribute('data-browse-card-rows');
          block.removeAttribute('data-max-rows');
          block.querySelectorAll('.recommendation-marquee-block-section').forEach((div) => {
            div.remove();
          });
        }

        if (args.clearSeeMoreRows) {
          block.removeAttribute('data-all-rows-loaded');
          block.removeAttribute('data-browse-card-rows');
          block.removeAttribute('data-max-rows');
          const contentDivs = block.querySelectorAll('.recommendation-marquee-block-section');
          contentDivs.forEach((div, index) => {
            if (index > 0) {
              div.remove();
            }
          });
          block.removeAttribute('data-browse-card-rows');
        }

        if (args.createRow) {
          const newContentDiv = document.createElement('div');
          newContentDiv.classList.add('browse-cards-block-content', 'recommendation-marquee-block-section', 'fade-in');
          const contentDivs = block.querySelectorAll('.recommendation-marquee-block-section');
          if (contentDivs.length) {
            contentDivs[contentDivs.length - 1].insertAdjacentElement('afterEnd', newContentDiv);
          } else {
            block
              .querySelector('.recommendation-marquee-block-header')
              ?.insertAdjacentElement('afterEnd', newContentDiv);
          }
          contentDiv = newContentDiv;
          if (seeMoreFlag) {
            firstResult = DEFAULT_NUM_CARDS + (contentDivs.length - 1) * (window.innerWidth > 1432 ? 3 : 2);
          } else {
            firstResult = contentDivs.length * DEFAULT_NUM_CARDS;
          }
        } else {
          Object.keys(contentTypesFetchMap).forEach((key) => {
            const count = contentTypesFetchMap[key];
            contentTypesFetchMap[key] = count * 2;
          });
          seeMoreConfig.prefetchCards = true;
        }
        const lowercaseOptionType = optionType?.toLowerCase();
        const saveCardResponse =
          [ALL_ADOBE_OPTIONS_KEY.toLowerCase()].includes(lowercaseOptionType) && cardIdsToExclude.length === 0;
        if (!dataConfiguration[lowercaseOptionType]) {
          dataConfiguration[lowercaseOptionType] = {};
        }
        dataConfiguration[lowercaseOptionType].renderedCardIds = [];
        contentDiv.dataset.selected = lowercaseOptionType;
        let analyticsProductName = '';
        if ([ALL_ADOBE_OPTIONS_KEY.toLowerCase()].includes(lowercaseOptionType)) {
          analyticsProductName = 'all adobe products';
        } else {
          analyticsProductName = lowercaseOptionType;
        }
        contentDiv.setAttribute('data-analytics-filter-id', analyticsProductName);
        const showDefaultOptions = defaultOptionsKey.some((key) => lowercaseOptionType === key.toLowerCase());
        const interest = filterOptions.find((opt) => opt.toLowerCase() === lowercaseOptionType);
        const expLevelIndex = sortedProfileInterests.findIndex((s) => s === interest);
        const expLevel = experienceLevels[expLevelIndex] ?? 'Beginner';
        let clonedProducts = structuredClone(removeProductDuplicates(products));
        if (!showDefaultOptions && !clonedProducts.find((c) => c.toLowerCase() === lowercaseOptionType)) {
          clonedProducts.push(interest);
        }
        if (showDefaultOptions) {
          switch (filterProductByOption) {
            case 'profile_context':
              clonedProducts = [...new Set(sortedProfileInterests)];
              features.length = 0;
              versions.length = 0;
              break;
            case 'specific_products':
              clonedProducts = products?.length ? [...products] : [];
              break;
            default:
              clonedProducts = [];
              features.length = 0;
              versions.length = 0;
              break;
          }
        }

        const params = {
          firstResult,
          contentType: null,
          product: clonedProducts,
          feature: showDefaultOptions && features.length ? [...new Set(features)] : null,
          version: showDefaultOptions && versions.length ? [...new Set(versions)] : null,
          role: role?.length ? role : profileRoles,
          sortCriteria,
          noOfResults: numberOfResults,
          aq: !showDefaultOptions && cardIdsToExclude.length ? prepareExclusionQuery(cardIdsToExclude) : undefined,
          context: showDefaultOptions ? {} : { interests: [interest], experience: [expLevel], role: profileRoles },
        };

        if (args.renderCards) {
          resetContentDiv(contentDiv);
        }

        const prepareTargetBlockCardPromise = () => {
          const targetPromises = [];
          const cardShimmers = [];
          const wrappers = [];
          countNumberAsArray(DEFAULT_NUM_CARDS).forEach(() => {
            const { shimmer, wrapper } = renderCardPlaceholders(contentDiv, args.renderCards);
            cardShimmers.push(shimmer);
            wrappers.push(wrapper);
          });
          const payloadConfig = {
            targetSupport: true,
            shimmers: cardShimmers,
            renderCards: args.renderCards,
            wrappers,
            params,
            optionType,
            lowercaseOptionType,
          };
          targetPromises.push(
            new Promise((resolve) => {
              defaultAdobeTargetClient
                .getTargetData(targetCriteriaScopeId)
                .then(async (resp) => {
                  if (!resp) {
                    if (!UEAuthorMode) {
                      const section = block.closest('.section');
                      block.parentElement.remove();
                      if (section?.children?.length === 0) section.remove();
                    }
                  }
                  if (resp?.data) {
                    updateCopyFromTarget(resp, headerContainer, descriptionContainer, linkEl, resultTextEl);
                    block.style.display = 'block';
                    setTargetDataAsBlockAttribute(block, resp);
                  }
                  const cardModels = await parseCardResponseData(resp, payloadConfig);
                  let renderedCardModels = [];
                  if (cardModels?.length) {
                    const targetCardRenderPromises = renderCardsBlock(cardModels, payloadConfig, contentDiv);
                    renderedCardModels = await Promise.all(targetCardRenderPromises);
                  }
                  resolve({
                    data: cardModels,
                    payloadConfig,
                    renderedCardModels,
                  });
                })
                .catch(() => {
                  resolve({ data: [], renderedCardModels: [] });
                });
            }),
          );
          return targetPromises;
        };
        const prepareV2CardPromise = () => {
          if (seeMoreFlag) {
            // This block gets executed when we click on see more button.
            const payload = {
              ...params,
              contentType: [''],
            };
            const cardShimmers = [];
            const wrappers = [];
            const { noOfResults } = payload;
            const savedModels = [];
            const savedContentTypes = Object.keys(dataConfiguration.savedCardsResponse[lowercaseOptionType] || {});
            const allSavedCardModels = savedContentTypes.reduce((acc, curr) => {
              const models = dataConfiguration.savedCardsResponse[lowercaseOptionType][curr].models || [];
              models.forEach((model) => {
                if (model.markedForReplacement !== true) {
                  acc.push(model);
                }
              });
              return acc;
            }, []);

            countNumberAsArray(noOfResults).forEach((_, i) => {
              const { shimmer, wrapper } = renderCardPlaceholders(contentDiv, args.renderCards);
              cardShimmers.push(shimmer);
              wrappers.push(wrapper);
              const model = allSavedCardModels[i];
              if (model) {
                savedModels.push(model);
              }
            });
            const payloadConfig = {
              payload,
              shimmers: cardShimmers,
              contentType: '',
              wrappers,
              renderCards: args.renderCards,
              lowercaseOptionType,
            };

            return [
              new Promise((resolve) => {
                let promise;
                if (savedModels?.length) {
                  promise = Promise.resolve({
                    contentType: '',
                    data: savedModels,
                  });
                } else {
                  promise = getCardsData(payload);
                }
                promise.then(async (resp) => {
                  const cardModels = await parseCardResponseData(resp, payloadConfig);
                  let renderedCardModels = [];
                  if (cardModels?.length) {
                    const renderPromises = renderCardsBlock(cardModels, payloadConfig, contentDiv);
                    renderedCardModels = await Promise.all(renderPromises);
                  }
                  resolve({
                    data: cardModels,
                    payloadConfig,
                    renderedCardModels,
                  });
                });
              }),
            ];
          }

          return Object.keys(contentTypesFetchMap).map((contentType) => {
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
            const shimmersCount = seeMoreConfig.prefetchCards ? noOfResults / 2 : noOfResults;
            const cardShimmers = [];
            const wrappers = [];
            countNumberAsArray(shimmersCount).forEach(() => {
              const { shimmer, wrapper } = renderCardPlaceholders(contentDiv, args.renderCards);
              cardShimmers.push(shimmer);
              wrappers.push(wrapper);
            });
            const [payloadContentType] = payload.contentType || [''];
            const payloadConfig = {
              payload,
              shimmers: cardShimmers,
              contentType: payloadContentType,
              wrappers,
              renderCards: args.renderCards,
              lowercaseOptionType,
              contentDiv,
            };
            return new Promise((resolve) => {
              const savedCardModels = dataConfiguration.savedCardsResponse[lowercaseOptionType]?.[
                payloadContentType
              ]?.models?.filter((model) => model.markedForReplacement !== true);
              let promise;
              if (Array.isArray(savedCardModels)) {
                promise = Promise.resolve({
                  contentType,
                  data: savedCardModels,
                });
              } else {
                promise = getCardsData(payload);
              }
              promise.then(async (resp) => {
                const cardModels = await parseCardResponseData(resp, payloadConfig);
                let renderedCardModels = [];
                if (cardModels?.length) {
                  const renderPromises = renderCardsBlock(cardModels, payloadConfig, contentDiv);
                  renderedCardModels = await Promise.all(renderPromises);
                }
                resolve({
                  data: cardModels,
                  payloadConfig,
                  renderedCardModels,
                });
              });
            });
          });
        };

        const cardPromises = targetSupport ? prepareTargetBlockCardPromise() : prepareV2CardPromise();

        block
          .querySelector('.recommendation-marquee-block-section')
          ?.setAttribute('data-analytics-rec-source', targetSupport ? 'target' : 'coveo');

        Promise.all(cardPromises)
          .then(async (finalPromiseResponse) => {
            const dontRenderCards = finalPromiseResponse.some((data) => data?.payloadConfig?.renderCards === false);
            const cardsToBeReplaced = seeMoreConfig.prefetchCards
              ? finalPromiseResponse.filter((response) =>
                  response.data.some((cardData) => cardData.replaceCard === true),
                )
              : [];
            if (cardsToBeReplaced.length) {
              const cardReplacementPromises = [];
              cardsToBeReplaced.forEach((responseInfo) => {
                const { data = [] } = responseInfo;

                data.forEach(({ shimmers, wrappers, contentDiv: contentWrapper }) => {
                  wrappers.forEach((wrapper, index) => {
                    const model = getSavedCardModel(dataConfiguration, lowercaseOptionType);
                    shimmers[index].removeShimmer();
                    if (model) {
                      cardReplacementPromises.push(buildCard(contentWrapper, wrapper, model));
                    }
                  });
                });
              });
              await Promise.all(cardReplacementPromises);
            }
            if (saveCardResponse) {
              const renderedModels = finalPromiseResponse.reduce((acc, curr) => {
                curr.renderedCardModels?.flat()?.forEach((d) => acc.push(d));
                return acc;
              }, allMyProductsCardModels);

              renderedModels.forEach((model) => {
                if (model?.id) {
                  cardIdsToExclude.push(model.id);
                }
              });
            }
            if (dontRenderCards) {
              return;
            }
            const cardsCount = contentDiv.querySelectorAll('.browse-card').length;
            if (cardsCount !== 0) {
              createSeeMoreButton(block, contentDiv, fetchDataAndRenderBlock);
            }
            if (cardsCount === 0) {
              Array.from(contentDiv.querySelectorAll('.browse-card-shimmer')).forEach((shimmerEl) => {
                shimmerEl.remove();
              });
              buildNoResultsContent(contentDiv, false);
              buildNoResultsContent(contentDiv, true);
              recommendedContentNoResults(contentDiv);

              if (!targetSupport) {
                const savedCardsCount = seeMoreConfig.prefetchCards
                  ? getSavedCardsCount(dataConfiguration, lowercaseOptionType)
                  : 1;
                const seeMoreBtn = block.querySelector('.recommended-content-see-more-btn');
                if (!block.dataset.browseCardRows || savedCardsCount === 0) {
                  if (seeMoreBtn) {
                    seeMoreBtn.classList.add('hide');
                  }
                }

                if (block.dataset.browseCardRows) {
                  if (seeMoreBtn) {
                    seeMoreBtn.firstElementChild.innerHTML =
                      placeholders?.recommendedContentSeeLessButtonText || 'See Less Recommendations';
                  }
                  block.dataset.allRowsLoaded = true;
                  block.dataset.maxRows = block.dataset.browseCardRows;
                }
              }

              return;
            }
            const noResultsContent = block.querySelector('.browse-card-no-results');
            if (noResultsContent) {
              noResultsContent.remove();
            }

            const navSectionEl = block.querySelector('.recommended-content-nav-section');
            if (navSectionEl) {
              const classOp =
                contentDiv?.scrollWidth && contentDiv.scrollWidth <= contentDiv.offsetWidth ? 'add' : 'remove';
              navSectionEl.classList[classOp]('recommended-content-hidden');
            }

            if (!targetSupport) {
              if (contentDiv.querySelectorAll('.browse-card').length < DEFAULT_NUM_CARDS) {
                if (!block.dataset.browseCardRows) {
                  if (btn) {
                    btn?.classList.add('hide');
                  }
                }

                if (block.dataset.browseCardRows) {
                  if (btn) {
                    btn.firstElementChild.innerHTML =
                      placeholders?.recommendedContentSeeLessButtonText || 'See Less Recommendations';
                  }
                  block.dataset.allRowsLoaded = true;
                  block.dataset.maxRows = block.dataset.browseCardRows;
                }
              } else if (btn) {
                btn.classList.remove('hide');
              }
            }
          })
          .catch((err) => {
            const cardsBlockCount = contentDiv.querySelectorAll('.browse-card').length;
            if (cardsBlockCount === 0) {
              buildNoResultsContent(contentDiv, true);
              recommendedContentNoResults(contentDiv);
            } else {
              // In the unlikely scenario that some card promises were successfully resolved, while some others failed. Try to show the rendered cards.
              Array.from(contentDiv.querySelectorAll('.browse-card-shimmer')).forEach((element) => {
                element.remove();
              });
            }
            /* eslint-disable-next-line no-console */
            console.error(err);
          });
      };

      /* Responsive List View */
      const listItems = filterOptions.map((item) => {
        const value = item ? convertToTitleCase(item) : '';
        return {
          value,
          title: value,
        };
      });

      const defaultOption = defaultFilterOption ? convertToTitleCase(defaultFilterOption) : null;

      function renderButtonPlaceholder() {
        seeMoreFlag = false;
        const btn = block.querySelector('.recommendation-marquee-see-more-btn > button');
        if (btn) {
          btn.innerHTML = placeholders?.recommendedContentSeeMoreButtonText || 'See more Recommendations';
        }
      }

      // eslint-disable-next-line no-new
      new ResponsivePillList({
        wrapper: blockHeader,
        items: listItems,
        defaultSelected: defaultOption,
        onInitCallback: () => {
          /* Reused the existing method */
          renderButtonPlaceholder();
          renderCardBlock(block);
          fetchDataAndRenderBlock(defaultOption);
          if (containsAllAdobeProductsTab && defaultOption !== ALL_ADOBE_OPTIONS_KEY) {
            setTimeout(() => {
              fetchDataAndRenderBlock(ALL_ADOBE_OPTIONS_KEY, { renderCards: false }); // pre-fetch all my tab cards to avoid duplicates in indvidual tab. Timeout helps with 429 status code of v2 calls.
            }, 500);
          }
        },
        onSelectCallback: (selectedItem) => {
          /* Reused the existing method */
          if (selectedItem) {
            renderButtonPlaceholder();
            seeMoreConfig.prefetchCards = true;
            restoreSavedCardsModelState(dataConfiguration, selectedItem.toLowerCase());
            fetchDataAndRenderBlock(selectedItem, { renderCards: true, createRow: false, clearSeeMoreRows: true });
          }
        },
      });
    });
  }

  targetEventEmitter.on('dataChange', async (data) => {
    const blockId = block.id;
    const { blockId: targetBlockId, scope } = data.value;
    if (targetBlockId === blockId && !showOnlyCoveo) {
      renderBlock({ targetSupport: true, targetCriteriaScopeId: scope });
    }
  });

  function handleTargetSupportAndRender(targetScopeId = '') {
    defaultAdobeTargetClient.checkTargetSupport().then(async (targetSupport) => {
      if (!targetSupport) {
        renderBlock({ targetSupport: false, targetCriteriaScopeId: '' });
      } else if (targetScopeId) {
        renderBlock({ targetSupport, targetCriteriaScopeId: targetScopeId });
      }
    });
  }

  if (showOnlyCoveo) {
    renderBlock({ targetSupport: false, targetCriteriaScopeId: '' });
  } else {
    handleTargetSupportAndRender(targetCriteriaId);
  }
}
