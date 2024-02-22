import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, decorateExternalLinks, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import {
  tabbedCardViewAllTroubleshootingLink,
  tabbedCardViewAllCoursesLink,
  tabbedCardViewAllTutorialsLink,
  tabbedCardViewAllDocumentationLink,
  tabbedCardViewAllCommunityLink,
  tabbedCardViewAllCertificationLink,
  tabbedCardViewAllOnDemandEventsLink,
} from '../../scripts/urls.js';

const urlMap = {
  Troubleshooting: tabbedCardViewAllTroubleshootingLink,
  Courses: tabbedCardViewAllCoursesLink,
  Tutorials: tabbedCardViewAllTutorialsLink,
  Documentation: tabbedCardViewAllDocumentationLink,
  Community: tabbedCardViewAllCommunityLink,
  Certification: tabbedCardViewAllCertificationLink,
  OnDemandEvents: tabbedCardViewAllOnDemandEventsLink,
};

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const [headingElement, toolTipElement, ...configs] = [...block.children].map((row) => row.firstElementChild);
  const [contentTypeListContent, sortByContent] = configs.map((cell) => cell.textContent.trim().toLowerCase());

  const sortCriteria = COVEO_SORT_OPTIONS[sortByContent?.toUpperCase()];
  const tabsLabels = contentTypeListContent.split(',');
  const numberOfResults = 4;
  let buildCardsShimmer = '';
  let contentDiv = '';
  let viewLink = '';
  let tabList = '';
  let viewLinkURLElement = '';

  // Clearing the block's content and applying CSS class
  block.innerHTML = '';
  block.classList.add('browse-cards-block');

  // Creating the header div with title and tooltip
  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
        ${headingElement.innerHTML}
      </div>
    </div>
  `);

  if (toolTipElement?.textContent?.trim()) {
    headerDiv
      .querySelector('h1,h2,h3,h4,h5,h6')
      ?.insertAdjacentHTML('afterend', '<div class="tooltip-placeholder"></div>');
    const tooltipElem = headerDiv.querySelector('.tooltip-placeholder');
    const tooltipConfig = {
      content: toolTipElement.textContent.trim(),
    };
    createTooltip(block, tooltipElem, tooltipConfig);
  }

  // Appending header div to the block
  block.appendChild(headerDiv);

  // Authored Initial Content type
  const initialContentType = tabsLabels[0];

  if (initialContentType !== null && initialContentType !== '') {
    // Create content div and shimmer card parent
    contentDiv = document.createElement('div');
    contentDiv.classList.add('browse-cards-block-content', 'tabbed-cards-block');

    buildCardsShimmer = new BuildPlaceholder();
    buildCardsShimmer.add(block);
  }

  // Function to convert a string to title case
  const convertToTitleCaseAndRemove = (str) =>
    str.replace(/[-\s]/g, '').replace(/\b\w/g, (match) => match.toUpperCase());

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  // Function to fetch data and render block
  const fetchDataAndRenderBlock = (contentType, tabbedBlock) => {
    const params = {
      contentType: contentType && contentType.split(','),
      sortCriteria,
      numberOfResults,
    };

    const browseCardsContent = BrowseCardsDelegate.fetchCardData(params);
    browseCardsContent
      .then((data) => {
        // Hide shimmer placeholders
        buildCardsShimmer.remove();
        if (data?.length) {
          // Render cards
          for (let i = 0; i < Math.min(numberOfResults, data.length); i += 1) {
            const cardData = data[i];
            const cardDiv = document.createElement('div');
            buildCard(contentDiv, cardDiv, cardData);
            contentDiv.appendChild(cardDiv);
          }
          // Append content div to shimmer card parent and decorate icons
          block.appendChild(contentDiv);
          /* Hide Tooltip while scrolling the cards layout */
          hideTooltipOnScroll(contentDiv);
          decorateIcons(tabbedBlock);
        } else {
          buildCardsShimmer.remove();
          buildNoResultsContent(block, true);
        }
      })
      .catch((err) => {
        // Hide shimmer placeholders on error
        buildCardsShimmer.remove();
        buildNoResultsContent(block, true);
        /* eslint-disable-next-line no-console */
        console.error(err);
      });
  };

  // Function to fetch data and render Tab Labels and URL's
  const renderTabContent = () => {
    // Create view link element
    viewLink = document.createElement('div');
    viewLink.classList.add('browse-cards-block-view');

    viewLinkURLElement = document.createElement('a');
    viewLink.appendChild(viewLinkURLElement);

    // Create tab list for different content types
    tabList = document.createElement('div');
    tabList.classList.add('tabbed-cards-label');
    const tabListUlElement = document.createElement('ul');
    tabsLabels.forEach((tabLabelData) => {
      // Create individual tab labels and attach click event listener
      const tabLabel = document.createElement('li');
      tabLabel.textContent = placeholders[`${tabLabelData}LabelKey`];
      tabLabel.addEventListener('click', () => {
        // Clear Existing Label
        const tabLabelsListElements = block.querySelectorAll('.tabbed-cards-label ul li');
        tabLabelsListElements.forEach((label) => {
          label.classList.remove('active');
        });
        // Clear existing cards
        const tabbedContent = block.querySelector('.tabbed-cards-block');
        tabLabel.classList.add('active');
        if (tabbedContent) {
          tabbedContent.innerHTML = '';
        }

        // Clear No Results Content if avaliabel
        const noResultsContent = block.querySelector('.browse-card-no-results');
        if (noResultsContent) {
          noResultsContent.remove();
        }
        // Update view link and fetch/render data for the selected tab
        const viewLinkMappingKey = placeholders[`${tabLabelData}LabelKey`];
        viewLinkURLElement.innerHTML = placeholders[`viewAll${convertToTitleCaseAndRemove(viewLinkMappingKey)}`];
        viewLinkURLElement.setAttribute('href', urlMap[`${convertToTitleCaseAndRemove(viewLinkMappingKey)}`]);
        tabList.appendChild(viewLinkURLElement);
        buildCardsShimmer.add(block);
        fetchDataAndRenderBlock(tabLabelData, block);
      });
      tabListUlElement.appendChild(tabLabel);
      // Append tab label to the tab list
      tabList.appendChild(tabListUlElement);
      decorateExternalLinks(block);
    });
  };

  // Render Block content
  if (initialContentType !== null && initialContentType !== '') {
    // Render Tabs Label and Links
    renderTabContent();

    // Append tab list and Shimmer Card after Tab Label
    const shimmerClass = block.querySelector('.browse-card-shimmer');
    block.insertBefore(tabList, shimmerClass);
    buildCardsShimmer.add(block);
    const viewLinkInitialMappingKey = placeholders[`${initialContentType}LabelKey`];

    // Update view link for initial content type
    viewLinkURLElement.innerHTML = placeholders[`viewAll${convertToTitleCaseAndRemove(viewLinkInitialMappingKey)}`];
    viewLinkURLElement.setAttribute('href', urlMap[`${convertToTitleCaseAndRemove(viewLinkInitialMappingKey)}`]);
    tabList.appendChild(viewLinkURLElement);
    tabList.children[0].children[0].classList.add('active');

    fetchDataAndRenderBlock(initialContentType, block);
    decorateIcons(headerDiv);
    decorateExternalLinks(block);
  } else {
    buildNoResultsContent(block, true);
  }
}
