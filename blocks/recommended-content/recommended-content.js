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
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import ResponsiveList from '../../scripts/responsive-list/responsive-list.js';
import {
  handleTargetEvent,
  checkTargetSupport,
  targetDataAdapter,
  updateCopyFromTarget,
  setTargetDataAsBlockAttribute,
} from '../../scripts/target/target.js';

const DEFAULT_NUM_CARDS = 4;
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}
const countNumberAsArray = (n) => Array.from({ length: n }, (_, i) => n - i);

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

const interestDataPromise = fetchInterestData();

const ALL_MY_OPTIONS_KEY = placeholders?.allMyProducts || 'All my products';
const ALL_ADOBE_OPTIONS_KEY = placeholders?.allAdobeProducts || 'All Adobe Products';

const renderCardPlaceholders = (contentDiv, renderCardsFlag = true) => {
  const cardDiv = document.createElement('div');
  cardDiv.classList.add('card-wrapper');
  if (renderCardsFlag) {
    contentDiv.appendChild(cardDiv);
  }

  const cardPlaceholder = new BuildPlaceholder(1);
  cardPlaceholder.add(cardDiv);
  return {
    shimmer: cardPlaceholder,
    wrapper: cardDiv,
  };
};

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
  // block.style.display = 'none';
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
  const profileDataPromise = defaultProfileClient.getMergedProfile();

  const tempWrapper = htmlToElement(`
      <div class="recommended-content-temp-wrapper">
        <div class="recommended-tab-headers">
          <p class="loading-shimmer" style="--placeholder-width: 100%; height: 48px"></p>
        </div>
        <div class="browse-cards-block-content recommended-content-block-section recommended-content-shimmer-wrapper"></div>
      </div>
    `);
  const tempContentSection = tempWrapper.querySelector('.recommended-content-block-section');
  countNumberAsArray(4).forEach(() => {
    const { shimmer: shimmerInstance, wrapper } = renderCardPlaceholders(tempWrapper);
    wrapper.appendChild(shimmerInstance.shimmer);
    tempContentSection.appendChild(wrapper);
  });

  block.appendChild(tempWrapper);

  checkTargetSupport().then(async (targetSupport) => {
    Promise.all([profileDataPromise, interestDataPromise]).then((promiseResponses) => {
      const [profileData, interestsDataArray] = promiseResponses;
      const {
        role: profileRoles = [],
        interests: profileInterests = [],
        solutionLevels: profileSolutionLevels = [],
      } = profileData || {};

      const defaultOptionsKey = [];

      if (profileInterests.length === 0) {
        filterSectionElement.style.display = 'none';
        blockHeader.style.display = 'none';
        defaultOptionsKey.push(ALL_ADOBE_OPTIONS_KEY);
      } else if (profileInterests.length === 1) {
        filterSectionElement.style.display = 'none';
        defaultOptionsKey.push(ALL_ADOBE_OPTIONS_KEY);
      } else {
        defaultOptionsKey.push(ALL_ADOBE_OPTIONS_KEY);
        defaultOptionsKey.push(ALL_MY_OPTIONS_KEY);
      }

      if (!(targetSupport && targetCriteriaId)) {
        block.style.display = 'block';
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

      const sortedProfileInterests = profileInterests.sort();
      const filterOptions = [...new Set(sortedProfileInterests)];
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
      const role = fourthEl?.innerText?.trim()?.includes('profile_context')
        ? profileRoles
        : fourthEl?.innerText?.trim().split(',').filter(Boolean);

      filterOptions.unshift(...defaultOptionsKey);
      const [defaultFilterOption = ''] = filterOptions;
      const containsAllMyProductsTab = filterOptions.includes(ALL_MY_OPTIONS_KEY);
      const cardIdsToExclude = [];
      const allMyProductsCardModels = [];
      const dataConfiguration = {};

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
          data = cardResponse?.data ?? [];
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
            // Remove contentType and make new call.
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
        const { renderCards = true, lowercaseOptionType } = payloadConfig;
        const promises = cardModels.map(
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
                      cardData.shimmers?.forEach((shimmerEl, index) => {
                        shimmerEl.remove();
                        cardData.wrappers[index].style.display = 'none';
                      });
                    }
                  } else {
                    countNumberAsArray(cardsToRenderCount).forEach((_, index) => {
                      const shimmer = cardData.shimmers[index];
                      const wrapperDiv = cardData.wrappers[index];
                      if (renderCards) {
                        if (shimmer) {
                          shimmer.remove();
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
                        if (cardModel.id) {
                          dataConfiguration[lowercaseOptionType].renderedCardIds.push(cardModel.id);
                        }
                        buildCard(contentDiv, wrapperDiv, cardModel);
                      }
                      cardModelsList.push(cardModel);
                    });
                  }
                  resolve(cardModelsList);
                });
              } else {
                if (renderCards) {
                  cardDiv.innerHTML = '';
                  if (cardData.id) {
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
      };

      const fetchDataAndRenderBlock = async (optionType, renderCards = true) => {
        const contentDiv = block.querySelector('.recommended-content-block-section');
        const lowercaseOptionType = optionType?.toLowerCase();
        const saveCardResponse =
          [ALL_MY_OPTIONS_KEY.toLowerCase()].includes(lowercaseOptionType) && cardIdsToExclude.length === 0;
        if (!dataConfiguration[lowercaseOptionType]) {
          dataConfiguration[lowercaseOptionType] = {};
        }
        dataConfiguration[lowercaseOptionType].renderedCardIds = [];
        contentDiv.dataset.selected = lowercaseOptionType;
        contentDiv.setAttribute('data-analytics-filter-id', lowercaseOptionType);
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

        if (!showProfileOptions && cardIdsToExclude.length) {
          const aq = prepareExclusionQuery(cardIdsToExclude);
          params.aq = aq;
        }

        if (renderCards) {
          contentDiv.innerHTML = '';
          contentDiv.style.display = '';
          const noResultsContent = block.querySelector('.browse-card-no-results');
          if (noResultsContent) {
            noResultsContent.remove();
          }
        }
        let cardPromises = [];
        if (targetSupport) {
          const cardShimmers = [];
          const wrappers = [];
          countNumberAsArray(DEFAULT_NUM_CARDS).forEach(() => {
            const { shimmer, wrapper } = renderCardPlaceholders(contentDiv, renderCards);
            cardShimmers.push(shimmer);
            wrappers.push(wrapper);
          });
          const payloadConfig = {
            targetSupport,
            shimmers: cardShimmers,
            wrappers,
            params,
            optionType,
            renderCards,
            lowercaseOptionType,
          };
          cardPromises.push(
            new Promise((resolve) => {
              handleTargetEvent(targetCriteriaId)
                .then(async (resp) => {
                  if (resp.data) {
                    updateCopyFromTarget(resp, headingElement, descriptionElement, firstEl, secondEl);
                    block.style.display = 'block';
                    setTargetDataAsBlockAttribute(resp, block);
                    block
                      .querySelector('.recommended-content-block-section')
                      ?.setAttribute('data-analytics-rec-source', 'target');
                  }
                  const cardModels = parseCardResponseData(resp, payloadConfig);
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
        } else {
          block.querySelector('.recommended-content-block-section')?.setAttribute('data-analytics-rec-source', 'coveo');
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
              const { shimmer, wrapper } = renderCardPlaceholders(contentDiv, renderCards);
              cardShimmers.push(shimmer);
              wrappers.push(wrapper);
            });
            const [payloadContentType] = payload.contentType || [''];
            const payloadConfig = {
              payload,
              shimmers: cardShimmers,
              contentType: payloadContentType,
              wrappers,
              renderCards,
              lowercaseOptionType,
            };
            return new Promise((resolve) => {
              getCardsData(payload).then(async (resp) => {
                const cardModels = parseCardResponseData(resp, payloadConfig);
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
        }
        Promise.all(cardPromises)
          .then((finalPromiseResponse) => {
            const dontRenderCards = finalPromiseResponse.some((data) => data?.payloadConfig?.renderCards === false);
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
            if (cardsCount === 0) {
              Array.from(contentDiv.querySelectorAll('.shimmer-placeholder')).forEach((shimmer) => {
                shimmer.remove();
              });
              buildNoResultsContent(contentDiv, false);
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
        block.removeChild(tempWrapper);
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('browse-cards-block-content', 'recommended-content-block-section');
        parentDiv.appendChild(contentDiv);
        secondEl.classList.add('recommended-content-discover-resource');
        firstEl.classList.add('recommended-content-result-link');
        if (firstEl.innerHTML || secondEl.innerHTML) {
          const seeMoreEl = document.createElement('div');
          seeMoreEl.classList.add('recommended-content-result-text');
          seeMoreEl.appendChild(secondEl);
          seeMoreEl.appendChild(firstEl);
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
          if (containsAllMyProductsTab && defaultOption !== ALL_MY_OPTIONS_KEY) {
            setTimeout(() => {
              fetchDataAndRenderBlock(ALL_MY_OPTIONS_KEY, false); // pre-fetch all my tab cards to avoid duplicates in indvidual tab. Timeout helps with 429 status code of v2 calls.
            }, 500);
          }
        },
        onSelectCallback: (selectedItem) => {
          /* Reused the existing method */
          if (selectedItem) {
            fetchDataAndRenderBlock(selectedItem);
          }
        },
      });
    });
  });
}
