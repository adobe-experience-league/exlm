import { getConfig, fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { handleTargetEvent, checkTargetSupport, targetDataAdapter } from '../../scripts/target/target.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import Swiper from '../../scripts/swiper/swiper.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

const { targetCriteriaIds } = getConfig();

const authorInfo = 'Based on profile context, if the customer has enabled the necessary cookies';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

function renderNavigationArrows(titleContainer) {
  const navigationElements = htmlToElement(`
        <div class="recently-viewed-nav-section">
            <button class="prev-nav" disabled>
                <span class="icon icon-chevron"></span>
            </button>
            <button class="next-nav">
                <span class="icon icon-chevron"></span>
            </button
        </div>
    `);
  decorateIcons(navigationElements);
  titleContainer.appendChild(navigationElements);
}

function handleArrowClick(block, swiper) {
  const prevButton = block.querySelector('.recently-viewed-nav-section > .prev-nav');
  const nextButton = block.querySelector('.recently-viewed-nav-section > .next-nav');

  prevButton.addEventListener('click', () => {
    swiper.swipe(false);
  });
  nextButton.addEventListener('click', () => {
    swiper.swipe(true);
  });
}

export default async function decorate(block) {
  block.style.display = 'none';
  const [headingElement, descriptionElement] = [...block.children].map((row) => row.firstElementChild);
  headingElement.classList.add('recently-reviewed-header');
  descriptionElement.classList.add('recently-reviewed-description');
  const titleContainer = document.createElement('div');
  const navContainer = document.createElement('div');
  block.appendChild(navContainer);
  navContainer.classList.add('recently-viewed-nav-container');
  navContainer.appendChild(titleContainer);
  titleContainer.appendChild(headingElement);
  titleContainer.appendChild(descriptionElement);
  renderNavigationArrows(navContainer);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'browse-cards-block-content';
  block.appendChild(contentDiv);

  const buildCardsShimmer = new BuildPlaceholder();
  buildCardsShimmer.add(block);

  function handleSwipe(direction) {
    const prevButton = block.querySelector('.recently-viewed-nav-section > .prev-nav');
    const nextButton = block.querySelector('.recently-viewed-nav-section > .next-nav');
    nextButton.disabled = false;
    prevButton.disabled = false;
    if (direction) {
      if (this.currentIndex >= this.totalSlides - 2) {
        nextButton.disabled = true;
      }
    } else if (this.currentIndex <= 1) {
      prevButton.disabled = true;
    }
  }

  if (window.hlx.aemRoot) {
    block.style.display = 'block';
    buildNoResultsContent(contentDiv, true, authorInfo);
    buildCardsShimmer.remove();
  }

  const targetSupport = checkTargetSupport();
  if (targetSupport) {
    block.style.display = 'block';
    handleTargetEvent(targetCriteriaIds.recentlyViewed).then(({ data }) => {
      if (data.length) {
        data.forEach((item) => {
          const cardData = targetDataAdapter(item, placeholders);
          const cardDiv = document.createElement('div');
          buildCard(contentDiv, cardDiv, cardData);
          contentDiv.appendChild(cardDiv);
        });
        const items = contentDiv.querySelectorAll('.browse-cards-block-content > div');
        const swiper = new Swiper(contentDiv, items, true, handleSwipe);
        handleArrowClick(block, swiper);
      } else {
        buildNoResultsContent(contentDiv, true);
      }
      buildCardsShimmer.remove();
    });
  }
}
