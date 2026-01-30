import { convertToTitleCase } from './browse-card-utils.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';
import { fetchLanguagePlaceholders, getPathDetails } from '../scripts.js';
import { isSignedInUser } from '../auth/profile.js';

const BrowseCardsTargetDataAdapter = (() => {
  let placeholders = {};
  /**
   * Maps a result to the BrowseCards data model.
   * @param {Object} result - The result object.
   * @returns {Object} The BrowseCards data model.
   */
  const mapResultsToCardsDataModel = (data) => {
    const contentTypeKey = data?.contentType?.toUpperCase();
    // Normalize contentType to lowercase to match CONTENT_TYPES mapping keys
    const contentType = data?.contentType?.toLowerCase() || '';
    const articlePath = `/${getPathDetails().lang}${data?.path}`;
    const fullURL = new URL(articlePath, window.location.origin).href;
    const solutions = data?.product?.split(',').map((s) => s.trim()) || [];
    const viewLinkPlaceholderKey = `browseCard${convertToTitleCase(data?.contentType)}ViewLabel`.replace(/\s+/g, '');

    // Extract course-related fields
    const level = data?.level || data?.el_level || '';
    const duration = data?.['course-duration'] || data?.el_course_duration || '';
    const moduleCount = data?.['course-module-count'] || data?.el_course_module_count || '';

    return {
      ...data,
      contentType, // Normalized to lowercase
      badgeTitle: CONTENT_TYPES[contentTypeKey]?.LABEL,
      type: contentType,
      authorInfo: {
        name: data?.authorName ? [data?.authorName] : '',
        type: data?.authorType ? [data?.authorType] : '',
      },
      product: solutions,
      tags: [],
      copyLink: fullURL,
      bookmarkLink: '',
      viewLink: fullURL,
      viewLinkText: placeholders[viewLinkPlaceholderKey]
        ? placeholders[viewLinkPlaceholderKey]
        : `View ${data?.contentType}`,
      // Course-specific fields
      el_level: level,
      el_course_duration: duration,
      el_course_module_count: moduleCount,
    };
  };

  /**
   * Enriches card data with course status from user profile.
   * @param {Array} cardData - Array of card data to enrich.
   * @returns {Promise<Array>} Enriched card data.
   */
  const enrichWithCourseStatus = async (cardData) => {
    const hasCourseCard = cardData.some((card) => card?.contentType?.toLowerCase() === 'course');
    if (!hasCourseCard) return cardData;

    const isUserSignedIn = await isSignedInUser();
    if (!isUserSignedIn) return cardData;

    try {
      const { getCurrentCourses } = await import('../courses/course-profile.js');
      const { default: BrowseCardsCourseEnricher } = await import('./browse-cards-course-enricher.js');
      const currentCourses = await getCurrentCourses();
      return BrowseCardsCourseEnricher.enrichCardsWithCourseStatus(cardData, currentCourses);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error enriching course status:', err);
      return cardData;
    }
  };

  const mapResultsToCardsData = async (data) => {
    try {
      placeholders = await fetchLanguagePlaceholders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
    let cardData = Array.isArray(data)
      ? data?.map((result) => mapResultsToCardsDataModel(result)).filter((item) => item !== null)
      : [];

    // Enrich course cards with status information
    const hasCourseCard = cardData.some((card) => card?.contentType === 'course');
    if (hasCourseCard) {
      cardData = await enrichWithCourseStatus(cardData);
    }

    return cardData;
  };

  return {
    mapResultsToCardsData,
  };
})();

export default BrowseCardsTargetDataAdapter;
