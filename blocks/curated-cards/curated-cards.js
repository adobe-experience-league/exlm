import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, loadIms } from '../../scripts/scripts.js';
import buildCard from '../../scripts/browse-card/browse-card.js';
import detectSwipe from '../../scripts/swipe.js';

function handleCarouselControlClick(carouselControls, contentDiv) {
  carouselControls.addEventListener('click', (e) => {
    if (e.target.getAttribute('type') === 'button' && e.target.ariaSelected === 'false') {
      [...carouselControls.children].forEach((btn) => {
        if (btn.ariaSelected === 'true') btn.ariaSelected = 'false';
      });
      e.target.ariaSelected = 'true';
      contentDiv.dataset.activeSlide = e.target.dataset.slideValue;
    }
  });
}

function swipeHandler(contentDiv, activeCardMutator) {
  const { activeSlide } = contentDiv.dataset;
  const currentTab = parseInt(activeSlide.split('-')[1], 10) + activeCardMutator;
  if (currentTab <= contentDiv.children.length && currentTab > 0) {
    contentDiv.dataset.activeSlide = `slide-${currentTab}`;
    const buttons = Array.from(contentDiv.nextElementSibling.children);
    buttons.forEach((btn) => {
      if (btn.ariaSelected === 'true') {
        btn.ariaSelected = 'false';
      }
    });
    buttons[currentTab - 1].ariaSelected = 'true';
  }
}

function swipeLeft(contentDiv) {
  swipeHandler(contentDiv, 1);
}

function swipeRight(contentDiv) {
  swipeHandler(contentDiv, -1);
}

function handleCarouselControlSwipe(contentDiv) {
  detectSwipe(contentDiv, swipeLeft, swipeRight);
}

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div > a');
  const contentType = block.querySelector('div:nth-child(4) > div')?.textContent.trim();
  const noOfResults = 4;

  // Clearing the block's content
  block.innerHTML = '';

  const headerDiv = htmlToElement(`
    <div class="curated-cards-header">
      <div class="curated-cards-title">
          <h4>${headingElement?.textContent.trim()}</h4>
          <div class="tooltip">
            <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement?.textContent.trim()}</span>
          </div>
      </div>
        <div class="curated-cards-view">${linkTextElement?.outerHTML}</div>
    </div>
  `);
  // Appending header div to the block
  block.appendChild(headerDiv);

  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  const param = {
    contentType,
    noOfResults,
  };

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent.then((data) => {
    if (data?.length) {
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('curated-cards-content');
      contentDiv.dataset.activeSlide = 'slide-1';

      for (let i = 0; i < Math.min(noOfResults, data.length); i += 1) {
        const cardData = data[i];
        const cardDiv = document.createElement('div');
        buildCard(cardDiv, cardData);
        contentDiv.appendChild(cardDiv);
      }

      const carouselContainer = document.createElement('div');
      carouselContainer.classList.add('card-carousel-container');

      const carouselControls = htmlToElement(`
      <div class="carousel-controls">
        <button id="carousel-tab-1" type="button" role="tab" aria-label="Slide 1" data-slide-value="slide-1" aria-selected="true" aria-controls="carousel-item-1"></button>
        <button id="carousel-tab-2" type="button" role="tab" aria-label="Slide 2" data-slide-value="slide-2" aria-selected="false" aria-controls="carousel-item-2"></button>
        <button id="carousel-tab-3" type="button" role="tab" aria-label="Slide 3" data-slide-value="slide-3" aria-selected="false" aria-controls="carousel-item-3"></button>
        <button id="carousel-tab-4" type="button" role="tab" aria-label="Slide 4" data-slide-value="slide-4" aria-selected="false" aria-controls="carousel-item-4"></button>
      </div>
    `);
      carouselContainer.appendChild(contentDiv);
      carouselContainer.appendChild(carouselControls);

      handleCarouselControlClick(carouselControls, contentDiv);
      handleCarouselControlSwipe(contentDiv);
      block.appendChild(carouselContainer);
      decorateIcons(block);
    }
  });
}
