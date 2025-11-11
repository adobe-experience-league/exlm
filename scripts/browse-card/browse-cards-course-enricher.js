import { COURSE_STATUS } from './browse-cards-constants.js';

/**
 * Module that provides functionality for enriching browse cards with course progress data.
 * @module BrowseCardsCourseEnricher
 */
const BrowseCardsCourseEnricher = (() => {
  /**
   * Extracts the course path from a URL, removing the language parameter.
   * @param {string} url - The full URL.
   * @returns {string} The path without language (e.g., "courses/course-name").
   * @private
   */
  const extractCoursePathFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);

      // Always remove the first segment (language code like "en", "fr", "pt-BR", etc.)
      if (pathSegments.length > 0) {
        pathSegments.shift();
      }

      return pathSegments.join('/');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing URL:', url, error);
      return '';
    }
  };

  /**
   * Determines the course status based on progress data.
   * @param {Object} courseProgress - The course progress object.
   * @returns {string} The course status (COURSE_STATUS.COMPLETED, COURSE_STATUS.IN_PROGRESS, or COURSE_STATUS.NOT_STARTED).
   * @private
   */
  const determineCourseStatus = (courseProgress) => {
    if (!courseProgress) return COURSE_STATUS.NOT_STARTED;

    if (courseProgress.awards?.timestamp) {
      return COURSE_STATUS.COMPLETED;
    }

    const hasModules = courseProgress.modules && courseProgress.modules.length > 0;
    return hasModules ? COURSE_STATUS.IN_PROGRESS : COURSE_STATUS.NOT_STARTED;
  };

  /**
   * Enriches card data with course progress information.
   * @param {Array} cardData - Array of card data to enrich.
   * @param {Array} courses - User's course progress data array.
   * @returns {Array} Enriched card data with course status information.
   */
  const enrichCardsWithCourseStatus = (cardData, courses) => {
    if (!cardData || !Array.isArray(cardData)) {
      return cardData;
    }

    return cardData.map((card) => {
      let courseStatus = COURSE_STATUS.NOT_STARTED;

      if (card.viewLink && courses && Array.isArray(courses)) {
        const cardPath = extractCoursePathFromUrl(card.viewLink);
        const courseProgress = courses.find((c) => c.courseId === cardPath);
        courseStatus = determineCourseStatus(courseProgress);
      }

      const cardPath = extractCoursePathFromUrl(card.viewLink);
      const profileCourse = courses?.find((c) => c.courseId === cardPath);

      return {
        ...card,
        meta: {
          ...card.meta,
          courseInfo: {
            courseStatus,
            profileCourse, // Include the profile course data for module completion counting
          },
        },
      };
    });
  };

  return {
    enrichCardsWithCourseStatus,
  };
})();

export default BrowseCardsCourseEnricher;
