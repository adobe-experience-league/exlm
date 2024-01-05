import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import buildCard from '../../scripts/browse-card/browse-card.js';
import buildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import CONTENT_TYPES from './tabbed-cards-constants.js';

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const contentTypeList = block.querySelector('div:nth-child(3) > div').textContent?.trim()?.toLowerCase();
  const sortBy = block.querySelector('div:nth-child(4) > div')?.textContent?.trim()?.toLowerCase();
  const sortCriteria = COVEO_SORT_OPTIONS[sortBy?.toUpperCase()];
  const tabsElementLabel = contentTypeList.split(',');
  const noOfResults = 4;

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block');

  // Creating the header div with title and tooltip
  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
          <h2>${headingElement?.textContent?.trim()}</h2>
          <div class="tooltip">
            <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement?.textContent?.trim()}</span>
          </div>
      </div>
    </div> 
  `);
  // Appending header div to the block
  block.appendChild(headerDiv);
  await decorateIcons(headerDiv);

  // Create content div and shimmer card parent
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content', 'tabbed-cards-block');

  const shimmerCardParent = document.createElement('div');
  shimmerCardParent.classList.add('browse-card-shimmer');

  // Function to fetch data and render block
  const fetchDataAndRenderBlock = (contentType, tabbedBlock) => {
    const param = {
      contentType: contentType && contentType.split(','),
      sortCriteria,
      noOfResults,
    };

    const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
    browseCardsContent
      .then((data) => {
        // Hide shimmer placeholders
        tabbedBlock.querySelectorAll('.shimmer-placeholder').forEach((el) => {
          el.classList.add('hide-shimmer');
        });

        if (data?.length) {
          // Render cards
          for (let i = 0; i < Math.min(noOfResults, data.length); i += 1) {
            const cardData = data[i];
            const cardDiv = document.createElement('div');
            buildCard(cardDiv, cardData);
            contentDiv.appendChild(cardDiv);
          }
          // Append content div to shimmer card parent and decorate icons
          shimmerCardParent.appendChild(contentDiv);
          decorateIcons(tabbedBlock);
        }
      })
      .catch((err) => {
        // Hide shimmer placeholders on error
        tabbedBlock.querySelectorAll('.shimmer-placeholder').forEach((el) => {
          el.classList.add('hide-shimmer');
        });
        /* eslint-disable-next-line no-console */
        console.error(err);
      });
  };

  // Create view link element
  const viewLink = document.createElement('div');
  viewLink.classList.add('browse-cards-block-view');
  const viewLinkURLElement = document.createElement('a');
  viewLink.appendChild(viewLinkURLElement);

  // Create tab list for different content types
  const tabList = document.createElement('div');
  tabList.classList.add('tabbed-cards');
  tabsElementLabel.forEach((tabLabelData) => {
    // Create individual tab labels and attach click event listener
    const tabLabel = document.createElement('p');
    tabLabel.classList.add('tab-label');
    tabLabel.textContent = CONTENT_TYPES[tabLabelData.toUpperCase()].LABEL;
    tabLabel.addEventListener('click', () => {
      // Clear existing cards
      const tabbedContent = block.querySelector('.tabbed-cards-block');
      if (tabbedContent) {
        [...tabbedContent.children].forEach((cards) => {
          cards.remove();
        });
      }

      // Update view link and fetch/render data for the selected tab
      viewLinkURLElement.innerHTML = CONTENT_TYPES[tabLabelData.toUpperCase()].VIEW_TEXT;
      viewLinkURLElement.setAttribute('href', CONTENT_TYPES[tabLabelData.toUpperCase()].VIEW_LINK);
      tabList.appendChild(viewLinkURLElement);
      fetchDataAndRenderBlock(tabLabelData, block);
    });

    // Append tab label to the tab list
    tabList.appendChild(tabLabel);
  });

  // Append tab list and Shimmer Card to the main block
  block.appendChild(tabList);
  block.appendChild(shimmerCardParent);

  // Append placeholder to shimmer card parent
  shimmerCardParent.appendChild(buildPlaceholder());

  // Fetch and render data for the initial content type
  const initialContentType = contentTypeList.split(',')[0];
  fetchDataAndRenderBlock(initialContentType, block);
}
