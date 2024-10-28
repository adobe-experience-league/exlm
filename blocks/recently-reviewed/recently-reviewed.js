import { htmlToElement } from '../../scripts/scripts.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import Swiper from '../../scripts/swiper/swiper.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsTargetDataAdapter from '../../scripts/browse-card/browse-card-target-data-adapter.js';
import { defaultAdobeTargetClient } from '../../scripts/adobe-target/adobe-target.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
let displayBlock = false;

/**
 * Update the copy from the target
 * @param {Object} data
 * @param {HTMLElement} heading
 * @param {HTMLElement} subheading
 * @returns {void}
 */
export function updateCopyFromTarget(data, heading, subheading, taglineCta, taglineText) {
  if (data?.meta?.heading && heading) heading.innerHTML = data.meta.heading;
  else heading?.remove();
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

/**
 * Sets target data as a data attribute on the given block element.
 *
 * This function checks if the provided `data` object contains a `meta` property.
 * If the `meta` property exists, it serializes the metadata as a JSON string and
 * adds it to the specified block element as a custom data attribute `data-analytics-target-meta`.
 *
 * @param {Object} data - The data returned from target.
 * @param {HTMLElement} block - The DOM element to which the meta data will be added as an attribute.
 *
 */
export function setTargetDataAsBlockAttribute(data, block) {
  if (data?.meta) {
    block.setAttribute('data-analytics-target-meta', JSON.stringify(data?.meta));
  }
}

function renderNavigationArrows(titleContainer) {
  const navigationElements = htmlToElement(`
        <div class="recently-viewed-nav-section">
            <button class="prev-nav" disabled>
                <span class="icon icon-chevron-gray"></span>
            </button>
            <button class="next-nav" disabled>
                <span class="icon icon-chevron-gray"></span>
            </button
        </div>
    `);
  decorateIcons(navigationElements);
  titleContainer.appendChild(navigationElements);
}

export default async function decorate(block) {
  defaultAdobeTargetClient
    .checkTargetSupport()
    .then((targetSupport) => {
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
      headingElement.classList.add('recently-reviewed-header');
      descriptionElement.classList.add('recently-reviewed-description');
      const titleContainer = document.createElement('div');
      const navContainer = document.createElement('div');
      const contentDiv = document.createElement('div');
      contentDiv.className = 'browse-cards-block-content';
      const buildCardsShimmer = new BuildPlaceholder();

      function appendNavAndContent() {
        navContainer.classList.add('recently-viewed-nav-container');
        navContainer.appendChild(titleContainer);
        titleContainer.appendChild(headingElement);
        titleContainer.appendChild(descriptionElement);
        renderNavigationArrows(navContainer);
        block.appendChild(navContainer);
        block.appendChild(contentDiv);
      }

      if (UEAuthorMode) {
        displayBlock = true;
        appendNavAndContent();
        buildCardsShimmer.add(block);
        const authorInfo = 'Based on profile context, if the customer has enabled the necessary cookies';
        buildNoResultsContent(contentDiv, true, authorInfo);
        buildCardsShimmer.remove();
      }

      if (targetSupport) {
        defaultAdobeTargetClient.getTargetData(block.dataset.targetScope).then(async (resp) => {
          updateCopyFromTarget(resp, headingElement, descriptionElement);
          if (resp?.data?.length) {
            displayBlock = true;
            appendNavAndContent();
            buildCardsShimmer.add(block);

            const cardData = await BrowseCardsTargetDataAdapter.mapResultsToCardsData(resp.data);
            cardData.forEach((item) => {
              const cardDiv = document.createElement('div');
              buildCard(contentDiv, cardDiv, item);
              contentDiv.appendChild(cardDiv);
            });

            const prevButton = block.querySelector('.recently-viewed-nav-section > .prev-nav');
            const nextButton = block.querySelector('.recently-viewed-nav-section > .next-nav');
            const items = contentDiv.querySelectorAll('.browse-cards-block-content > div');
            // eslint-disable-next-line no-new
            new Swiper(contentDiv, items, true, null, prevButton, nextButton);
            setTargetDataAsBlockAttribute(resp, block);
          } else {
            buildNoResultsContent(contentDiv, true);
          }
          buildCardsShimmer.remove();
        });
      }
    })
    .finally(() => {
      if (!UEAuthorMode && !displayBlock) {
        block.parentElement.remove();
        document.querySelectorAll('.section:not(.profile-rail-section)').forEach((element) => {
          if (element.textContent.trim() === '') {
            element.remove();
          }
        });
      }
    });
}
