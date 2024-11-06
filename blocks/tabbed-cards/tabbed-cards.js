import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, decorateExternalLinks, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { COVEO_SORT_OPTIONS, COVEO_DATE_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import { formatTitleCase } from '../../scripts/browse-card/browse-card-utils.js';

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

  /**
   * Formats a date object into a string with the format "YYYY/MM/DD@HH:MM:SS".
   * @param {Date} dateObj - The date object to be formatted.
   * @returns {string} The formatted date string.
   */
  const getFormattedDate = (dateObj) => {
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    const hours = String(dateObj.getUTCHours()).padStart(2, '0');
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');

    return `${year}/${month}/${day}@${hours}:${minutes}:${seconds}`;
  };

  /**
   * Calculates the date range between two dates and returns it in Coveo-compatible format.
   * @param {Date} startDate - The start date of the range.
   * @param {Date} endDate - The end date of the range.
   * @returns {string} The date range string in Coveo-compatible format.
   */
  const getDateRange = (startDate, endDate) => `${getFormattedDate(startDate)}..${getFormattedDate(endDate)}`;

  /**
   * Constructs date criteria based on a list of date options.
   * @returns {Array} Array of date criteria.
   */
  const createDateCriteria = () => {
    const dateCriteria = [];
    const dateOptions = {
      [COVEO_DATE_OPTIONS.WITHIN_ONE_MONTH]: { monthsAgo: 1 },
      [COVEO_DATE_OPTIONS.WITHIN_SIX_MONTHS]: { monthsAgo: 6 },
      [COVEO_DATE_OPTIONS.WITHIN_ONE_YEAR]: { yearsAgo: 1 },
      [COVEO_DATE_OPTIONS.MORE_THAN_ONE_YEAR_AGO]: { yearsAgo: 50 }, // Assuming 50 years ago as the "more than one year ago" option
    };
    dateList.forEach((date) => {
      if (dateOptions[date]) {
        const { monthsAgo, yearsAgo } = dateOptions[date];
        const currentDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (monthsAgo || 0));
        startDate.setFullYear(startDate.getFullYear() - (yearsAgo || 0));
        if (date === COVEO_DATE_OPTIONS.MORE_THAN_ONE_YEAR_AGO) {
          // For "MORE_THAN_ONE_YEAR_AGO", adjust startDate by adding one more year
          currentDate.setFullYear(currentDate.getFullYear() - 1);
        }
        dateCriteria.push(getDateRange(startDate, currentDate));
      }
    });
    return dateCriteria;
  };

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

    buildCardsShimmer = BrowseCardShimmer.create(4, block);
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
      dateCriteria: dateList && createDateCriteria(),
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
          contentDiv.style.display = 'flex';
          /* Hide Tooltip while scrolling the cards layout */
          hideTooltipOnScroll(contentDiv);
        } else {
          buildCardsShimmer.remove();
          buildNoResultsContent(block, true);
          contentDiv.style.display = 'none';
        }
      })
      .catch((err) => {
        // Hide shimmer placeholders on error
        buildCardsShimmer.remove();
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
        block.append(buildCardsShimmer);
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
    block.append(buildCardsShimmer);

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
