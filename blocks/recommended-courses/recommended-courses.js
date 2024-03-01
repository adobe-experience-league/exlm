// Importing constants and modules
import { RECOMMENDED_COURSES_CONSTANTS } from '../../scripts/browse-card/browse-cards-constants.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { isSignedInUser, profile } from '../../scripts/data-service/profile-service.js';
import { htmlToElement } from '../../scripts/scripts.js';
import BrowseCardsPathsAdaptor from '../../scripts/browse-card/browse-cards-paths-adaptor.js';
import { buildCard, buildNoResultsContent } from '../../scripts/browse-card/browse-card.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const [headingElement, toolTipElement, linkElement] = [...block.children].map((row) => row.firstElementChild);
  const contentType = RECOMMENDED_COURSES_CONSTANTS.PATHS.MAPPING_KEY;
  let buildCardsShimmer = '';
  const noOfResults = 4;

  // Clearing the block's content and adding CSS class
  block.innerHTML = '';
  block.classList.add('browse-cards-block');

  /**
   * Extracts progress data from the user profile.
   * @param {Object} progress - The progress data from the user profile.
   * @returns {Object} - Extracted progress data.
   */
  const extractProgressData = (progress) =>
    Object.keys(progress)
      .filter((key) => key.startsWith('award:'))
      .reduce((acc, key) => {
        acc[key.replace('award:', '')] = progress[key];
        return acc;
      }, {});

  /**
   * Creates a Map for courses using their IDs as keys.
   * @param {Array} browseCardsData - The data containing courses.
   * @returns {Map} - A Map with course IDs as keys and course objects as values.
   */
  const createCourseMap = (browseCardsData) => {
    const courseMap = new Map();
    browseCardsData.forEach((group) => {
      group.forEach((course) => {
        courseMap.set(course.ID, course);
      });
    });
    return courseMap;
  };

  /**
   * Filters courses based on progress data.
   * @param {Map} courseMap - The Map containing courses.
   * @param {Object} progressData - The progress data.
   * @returns {Array} - Filtered courses based on progress.
   */
  const filterCoursesByProgress = (courseMap, progressData) => {
    const inProgressCoursesData = [];

    Object.entries(progressData).forEach(([key, inProgressValue]) => {
      if (inProgressCoursesData.length >= 4) {
        return;
      }

      const course = courseMap.get(key);

      if (course && !course.Archived && course['Path Title'] && inProgressValue > 0) {
        course.inProgressValue = inProgressValue;
        course.contentType = RECOMMENDED_COURSES_CONSTANTS.IN_PROGRESS.MAPPING_KEY;

        inProgressCoursesData.push(course);
      }
    });

    return inProgressCoursesData;
  };

  /**
   * Filters courses based on recommendations.
   * @param {Map} courseMap - The Map containing courses.
   * @param {Array} recommendedData - The array of recommended data.
   * @returns {Array} - Filtered courses based on recommendations.
   */
  const filterCoursesByRecommendations = (courseMap, recommendedData) => {
    const recommendedCoursesData = [];
    let totalRecommendedCount = 0;

    courseMap.forEach((course) => {
      if (totalRecommendedCount >= 4) {
        return;
      }

      if (
        course &&
        !course.Archived &&
        course['Path Title'] &&
        course.Solution?.some((value) => recommendedData.includes(value))
      ) {
        course.contentType = RECOMMENDED_COURSES_CONSTANTS.RECOMMENDED.MAPPING_KEY;
        recommendedCoursesData.push(course);
        totalRecommendedCount += 1;
      }
    });

    return recommendedCoursesData;
  };

  /**
   * Combines and limits arrays based on specific conditions for recommended block data.
   * @param {Array} inProgressArray - The array representing in-progress courses.
   * @param {Array} recommendedArray - The array representing recommended courses.
   * @returns {Array} - The combined and limited array.
   */
  const recommendedBlockData = (inProgressArray, recommendedArray) => {
    const displayData = [];
    const inProgressLength = inProgressArray.length;
    /**
     * Conditions for populating the cards dynamically based on the length of inProgress and recommended data elements.
     * At most, there can only be 2 cards of each type if there is a mix of content; otherwise, a combination is displayed.
     * Always, inProgress elements are shown first.
     */
    if (inProgressLength === 4 || inProgressLength === 3) {
      if (recommendedArray.length === 1) {
        displayData.push(...inProgressArray.slice(0, 3), ...recommendedArray.slice(0, 1));
      } else if (recommendedArray.length > 1) {
        displayData.push(...inProgressArray.slice(0, 2), ...recommendedArray.slice(0, 2));
      } else {
        displayData.push(...inProgressArray.slice(0, inProgressLength));
      }
    } else if (inProgressLength === 2) {
      displayData.push(...inProgressArray, ...recommendedArray.slice(0, Math.min(2, recommendedArray.length)));
    } else if (inProgressLength === 1) {
      displayData.push(...inProgressArray.slice(0, 1), ...recommendedArray.slice(0, 3));
    } else {
      displayData.push(...(inProgressArray.length === 0 ? recommendedArray.slice(0, 4) : inProgressArray.slice(0, 4)));
    }

    return displayData;
  };

  /**
   * Displays cards in the content div.
   * @param {HTMLElement} contentDiv - The content div to display cards.
   * @param {Array} cardData - The array of card data to display.
   */
  const displayCards = (contentDiv, cardData, noOfResult, buildCardShimmer) => {
    if (cardData && cardData.length > 0) {
      for (let i = 0; i < Math.min(noOfResult, cardData.length); i += 1) {
        const cardsData = cardData[i];
        const cardsDiv = document.createElement('div');
        buildCard(contentDiv, cardsDiv, cardsData);
        contentDiv.appendChild(cardsDiv);
      }
    } else {
      buildCardShimmer.remove();
      buildNoResultsContent(block, true);
    }
  };

  // Parameters for fetching card data
  const parameters = { contentType };

  headingElement.firstElementChild.classList.add('h2');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
        ${headingElement.innerHTML}
      </div>
      <div class="browse-cards-block-view">${linkElement.innerHTML}</div>
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

  await decorateIcons(headerDiv);

  // Checking if the user is signed in before proceeding
  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    // Creating content div for card display
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('browse-cards-block-content');

    buildCardsShimmer = new BuildPlaceholder(noOfResults, block);
    buildCardsShimmer.add(block);

    // Fetching user profile data
    profile().then(async (data) => {
      // Fetching card data based on parameters
      const browseCardsContent = BrowseCardsDelegate.fetchCardData(parameters);

      // Processing fetched data
      browseCardsContent.then((browseCardsData) => {
        // Extracting progress and interests data from user profile
        const progressData = data && data.progress ? extractProgressData(data.progress) : {};
        const recommendedData = data && data.interests ? [...data.interests] : [];

        // Create a Map for courses using their IDs as keys
        const courseMap = createCourseMap(browseCardsData);

        // Filtering courses based on progress and recommendations
        const inProgressCoursesData = filterCoursesByProgress(courseMap, progressData);
        const recommendedCoursesData = filterCoursesByRecommendations(courseMap, recommendedData);

        // Combine and limit arrays based on specific conditions
        const finalCoursesData = recommendedBlockData(inProgressCoursesData, recommendedCoursesData);

        // Mapping results to card data and displaying cards
        const cardModifiedData = BrowseCardsPathsAdaptor.mapResultsToCardsData(finalCoursesData);

        cardModifiedData
          .then((cardData) => {
            buildCardsShimmer.remove();
            displayCards(contentDiv, cardData, noOfResults, buildCardsShimmer);
            block.appendChild(contentDiv);
            /* Hide Tooltip while scrolling the cards layout */
            hideTooltipOnScroll(contentDiv);
          })
          .catch((err) => {
            // Hide shimmer placeholders on error
            buildCardsShimmer.remove();
            buildNoResultsContent(block, true);
            // eslint-disable-next-line no-console
            console.error('Recommended Cards:', err);
          });
      });
    });
  } else if (
    document.documentElement.classList.contains('adobe-ue-edit') ||
    document.documentElement.classList.contains('adobe-ue-preview')
  ) {
    buildNoResultsContent(block, true);
  } else {
    block.style.display = 'None';
  }
}
