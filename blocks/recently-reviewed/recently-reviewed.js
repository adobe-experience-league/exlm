import { fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import BrowseCardsTargetDataAdapter from '../../scripts/browse-card/browse-cards-target-data-adapter.js';
import defaultAdobeTargetClient from '../../scripts/adobe-target/adobe-target.js';
import getEmitter from '../../scripts/events.js';
import { hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import { setTargetDataAsBlockAttribute } from '../../scripts/utils/analytics-utils.js';
import { formatId } from '../../scripts/browse-card/browse-card-utils.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const targetEventEmitter = getEmitter('loadTargetBlocks');

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
let displayBlock = false;

let DEFAULT_NUM_CARDS = 4;
let resizeObserved;
let cardsWidth;
let cardsGap;
const seeMoreConfig = {
  minWidth: 1024,
  noOfRows: 2,
};

/**
 * Debounces a function call to limit its execution rate.
 * @param {number} ms - The debounce delay in milliseconds.
 * @param {Function} fn - The function to debounce.
 * @returns {Function} - The debounced function.
 */
// eslint-disable-next-line class-methods-use-this
function debounce(func, delay) {
  let timeoutId;

  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function resizeObserverHandler(callback, block) {
  const debouncedCallback = debounce(callback, 500);
  const wrapperResizeObserver = new ResizeObserver(debouncedCallback);
  wrapperResizeObserver.observe(block);
}

function calculateNumberOfCardsToRender(container) {
  if (window.innerWidth < seeMoreConfig.minWidth) {
    DEFAULT_NUM_CARDS = 4;
  } else {
    let cardsContainer = container.querySelector('.card-wrapper');
    if (!cardsContainer) cardsContainer = container.querySelector('.browse-card-shimmer-wrapper');
    let containerWidth = container.offsetWidth;

    if (!containerWidth) {
      const section = container.closest('.section');
      if (section) {
        const originalDisplay = section.style.display;
        section.style.display = 'block';
        section.style.visibility = 'hidden';
        containerWidth = container.offsetWidth;
        section.style.display = originalDisplay;
        section.style.visibility = 'visible';
      }
    }

    if (!cardsWidth) cardsWidth = cardsContainer?.offsetWidth || 256;
    if (!cardsGap) cardsGap = parseInt(getComputedStyle(cardsContainer).gap, 10) || 24;
    const visibleItems = Math.floor((containerWidth + cardsGap) / (cardsWidth + cardsGap));
    if (visibleItems) {
      DEFAULT_NUM_CARDS = visibleItems;
    }
  }
}

function createSeeMoreButton(block, contentDiv, addNewRowOfCards, cardData) {
  if (!block.querySelector('.recently-reviewed-see-more-btn')) {
    const btnContainer = document.createElement('div');
    const btn = document.createElement('button');
    btn.innerHTML = placeholders?.recentlyReviewedSeeMoreButtonText || 'See more Recently viewed';
    btnContainer.classList.add('recently-reviewed-see-more-btn');
    btnContainer.appendChild(btn);
    contentDiv.insertAdjacentElement('afterend', btnContainer);

    btn.addEventListener('click', () => {
      const contentDivs = block.querySelectorAll('.browse-cards-block-content');
      const currentRow = parseInt(block.dataset.browseCardRows, 10);
      const maxRows = parseInt(block.dataset.maxRows, 10);
      const newRow = currentRow ? currentRow + 1 : 2;
      block.dataset.browseCardRows = newRow;
      const { allRowsLoaded } = block.dataset;

      function hideSeeMoreRows() {
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
        btn.innerHTML = placeholders?.recentlyReviewedSeeMoreButtonText || 'See more Recently viewed';
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
            btn.innerHTML = placeholders?.recentlyReviewedSeeLessButtonText || 'See Less Recently Reviewed';
          }
          showNewRow();
        }
      } else if (allRowsLoaded === 'true') {
        if (newRow === seeMoreConfig.noOfRows) {
          btn.innerHTML = placeholders?.recentlyReviewedSeeLessButtonText || 'See Less Recently Reviewed';
        }
        showNewRow();
      } else {
        if (newRow === seeMoreConfig.noOfRows) {
          block.dataset.allRowsLoaded = true;
          btn.innerHTML = placeholders?.recentlyReviewedSeeLessButtonText || 'See Less Recently Reviewed';
        }
        addNewRowOfCards(cardData);
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
  if (data?.meta?.heading && heading) {
    if (heading.firstElementChild) {
      heading.firstElementChild.innerHTML = data.meta.heading;
    } else {
      heading.innerHTML = data.meta.heading;
    }
  } else {
    heading?.remove();
  }
  if (data?.meta?.subheading && subheading) subheading.innerHTML = data.meta.subheading;
  else subheading?.remove();
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
    const taglineParentBlock = document.querySelector('.recommended-content-result-text');
    if (taglineParentBlock) {
      taglineParentBlock?.remove();
    }
  }
}

function removeEmptySection(block) {
  const section = block.closest('.section');
  block.parentElement.remove();
  if (section?.children?.length === 0) section.remove();
}

export default async function decorate(block) {
  defaultAdobeTargetClient.checkTargetSupport().then((targetSupport) => {
    let headingElement;
    let descriptionElement;
    if (!block.dataset.targetScope) {
      [headingElement, descriptionElement] = [...block.children].map((row) => row.firstElementChild);
    } else {
      headingElement = htmlToElement('<h2></h2>');
      descriptionElement = htmlToElement('<p></p>');
      block.prepend(headingElement);
      block.prepend(descriptionElement);
    }
    headingElement.classList.add('recently-reviewed-header', 'rec-block-header');
    descriptionElement.classList.add('recently-reviewed-description');
    const titleContainer = document.createElement('div');
    const navContainer = document.createElement('div');
    const buildCardsShimmer = new BrowseCardShimmer();

    function appendNavAndContent() {
      navContainer.classList.add('recently-viewed-nav-container');
      navContainer.appendChild(titleContainer);
      titleContainer.appendChild(headingElement);
      titleContainer.appendChild(descriptionElement);
      block.appendChild(navContainer);
    }

    let isTooltipListenerAdded = false;
    resizeObserved = false;

    function addNewRowOfCards(cardData, args = { clear: false }) {
      let contentDivs = block.querySelectorAll('.browse-cards-block-content');
      if (args.clear) {
        contentDivs.forEach((el) => el.remove());
        contentDivs = [];
        // Remove the existing cards container
        block.removeAttribute('data-all-rows-loaded');
        block.removeAttribute('data-browse-card-rows');
        block.removeAttribute('data-max-rows');
      }

      const contentDiv = document.createElement('div');
      contentDiv.classList.add('browse-cards-block-content', 'fade-in');

      if (contentDivs.length) {
        contentDivs[contentDivs.length - 1].insertAdjacentElement('afterEnd', contentDiv);
      } else {
        block.querySelector('.recently-viewed-nav-container')?.insertAdjacentElement('afterEnd', contentDiv);
      }
      const noOfCards = block.querySelectorAll('.card-wrapper').length;
      cardData.slice(noOfCards, noOfCards + DEFAULT_NUM_CARDS).forEach((item) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card-wrapper');
        buildCard(contentDiv, cardDiv, item);
        contentDiv.appendChild(cardDiv);
      });
      if (!isTooltipListenerAdded) {
        hideTooltipOnScroll(contentDiv);
        isTooltipListenerAdded = true;
      }
      if (!cardData[noOfCards + DEFAULT_NUM_CARDS]) {
        block.dataset.allRowsLoaded = true;
        block.dataset.maxRows = block.dataset.browseCardRows;
        if (block.querySelector('.recently-reviewed-see-more-btn > button')) {
          block.querySelector('.recently-reviewed-see-more-btn > button').innerHTML =
            placeholders?.recentlyReviewedSeeLessButtonText || 'See Less Recently Reviewed';
        }
      }

      if (cardData.length > DEFAULT_NUM_CARDS) {
        createSeeMoreButton(block, contentDiv, addNewRowOfCards, cardData);
      }
    }

    function calculateNumberOfCardsOnResize(cardData) {
      if (!resizeObserved) {
        let previousWidth = block.offsetWidth;
        resizeObserverHandler((entries) => {
          if (resizeObserved) {
            entries.forEach((entry) => {
              const { width } = entry.contentRect;
              if (!previousWidth) previousWidth = block.offsetWidth;
              if (Math.abs(entry.contentRect.width - previousWidth) > 1) {
                // Calculate no. of cards that fits
                calculateNumberOfCardsToRender(block);
                addNewRowOfCards(cardData, { clear: true });
                // Render the new set of cards
                previousWidth = width;
              }
            });
          }
          resizeObserved = true;
        }, block);
      }
    }

    function renderCards() {
      defaultAdobeTargetClient.getTargetData(block.dataset.targetScope).then(async (resp) => {
        updateCopyFromTarget(resp, headingElement, descriptionElement);
        headingElement.id = formatId(headingElement.innerHTML);
        if (resp?.data?.length) {
          displayBlock = true;
          appendNavAndContent();
          buildCardsShimmer.addShimmer(block);
          const cardData = await BrowseCardsTargetDataAdapter.mapResultsToCardsData(resp.data);
          calculateNumberOfCardsToRender(block);
          addNewRowOfCards(cardData, { clear: true }); // eslint-disable-next-line no-new
          calculateNumberOfCardsOnResize(cardData);
          setTargetDataAsBlockAttribute(block, resp);
        } else {
          const contentDiv = document.createElement('div');
          contentDiv.classList.add('browse-cards-block-content');
          block.appendChild(contentDiv);
          buildNoResultsContent(contentDiv, true);
          if (!UEAuthorMode && !displayBlock) {
            removeEmptySection(block);
          }
        }
        buildCardsShimmer.removeShimmer();
      });
    }

    if (UEAuthorMode) {
      displayBlock = true;
      appendNavAndContent();
      buildCardsShimmer.addShimmer(block);
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('browse-cards-block-content');
      block.appendChild(contentDiv);
      const authorInfo = 'Based on profile context, if the customer has enabled the necessary cookies';
      buildNoResultsContent(contentDiv, true, authorInfo);
      buildCardsShimmer.removeShimmer();
    }

    if (!targetSupport && !UEAuthorMode) {
      removeEmptySection(block);
    }

    if (targetSupport && block.dataset.targetScope) {
      renderCards();
    }

    targetEventEmitter.on('dataChange', async (data) => {
      if (block.id === data.value.blockId) {
        renderCards();
      }
    });
  });
}
