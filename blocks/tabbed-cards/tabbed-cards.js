import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, decorateExternalLinks, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import { createDateCriteria, formatTitleCase } from '../../scripts/browse-card/browse-card-utils.js';

const lang = document.querySelector('html').lang || 'en';

const urlMap = {
  playlist: `/${lang}/playlists`,
  tutorial: `/${lang}/docs/home-tutorials`,
  documentation: `/${lang}/docs`,
  troubleshooting: `/${lang}/docs`,
  event: `/events?lang=${lang}#ondemandevents`,
  community: 'https://experienceleaguecommunities.adobe.com',
  certification: `/${lang}/docs/certification/program/overview`,
};

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const [headingElement, toolTipElement, ...configs] = [...block.children].map((row) => row.firstElementChild);
  const [contentTypeText, filterByDateContent, sortByContent] = configs.map((cell) =>
    cell.textContent.trim().toLowerCase(),
  );

  const contentTypeList = contentTypeText.split(',');
  const sortCriteria = COVEO_SORT_OPTIONS[sortByContent?.toUpperCase()];
  const dateList = filterByDateContent && filterByDateContent.split(',');
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
  const initialContentType = contentTypeList[0].toLowerCase();

  if (initialContentType !== null && initialContentType !== '') {
    // Create content div and shimmer card parent
    contentDiv = document.createElement('div');
    contentDiv.classList.add('browse-cards-block-content', 'tabbed-cards-block');

    buildCardsShimmer = new BrowseCardShimmer();
    buildCardsShimmer.addShimmer(block);
  }

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  // Function to fetch data and render block
  const fetchDataAndRenderBlock = (contentType) => {
    const params = {
      contentType: contentType && contentType.split(','),
      sortCriteria,
      numberOfResults,
      dateCriteria: dateList && createDateCriteria(dateList),
    };

    const browseCardsContent = BrowseCardsDelegate.fetchCardData(params);
    browseCardsContent
      .then((data) => {
        // Hide shimmer placeholders
        buildCardsShimmer.removeShimmer();
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
          contentDiv.style.display = 'grid';
          /* Hide Tooltip while scrolling the cards layout */
          hideTooltipOnScroll(contentDiv);
        } else {
          buildCardsShimmer.removeShimmer();
          buildNoResultsContent(block, true);
          contentDiv.style.display = 'none';
        }
      })
      .catch((err) => {
        // Hide shimmer placeholders on error
        buildCardsShimmer.removeShimmer();
        buildNoResultsContent(block, true);
        contentDiv.style.display = 'none';
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
    contentTypeList.forEach((contentType) => {
      const contentTypeLowerCase = contentType.toLowerCase();
      const contentTypeTitleCase = formatTitleCase(contentType);
      const tabLabel = document.createElement('li');
      tabLabel.textContent = placeholders[`tabbedCard${contentTypeTitleCase}TabLabel`];
      // Create individual tab labels and attach click event listener
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
          tabbedContent.style.display = 'none';
        }

        // Clear No Results Content if avaliabel
        const noResultsContent = block.querySelector('.browse-card-no-results');
        if (noResultsContent) {
          noResultsContent.remove();
        }
        // Update view link and fetch/render data for the selected tab
        viewLinkURLElement.innerHTML = placeholders[`tabbedCard${contentTypeTitleCase}ViewAllLabel`] || 'View All';
        viewLinkURLElement.setAttribute('href', urlMap[contentTypeLowerCase]);
        tabList.appendChild(viewLinkURLElement);
        buildCardsShimmer.addShimmer(block);
        fetchDataAndRenderBlock(contentTypeLowerCase);
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
    buildCardsShimmer.addShimmer(block);

    // Update view link for initial content type
    viewLinkURLElement.innerHTML =
      placeholders[`tabbedCard${formatTitleCase(initialContentType)}ViewAllLabel`] || 'View All';
    viewLinkURLElement.setAttribute('href', urlMap[initialContentType]);
    tabList.appendChild(viewLinkURLElement);
    tabList.children[0].children[0].classList.add('active');

    fetchDataAndRenderBlock(initialContentType);
    decorateExternalLinks(block);
  } else {
    buildNoResultsContent(block, true);
  }
}
