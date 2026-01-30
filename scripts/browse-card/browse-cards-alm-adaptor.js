import browseCardDataModel from '../data-model/browse-cards-model.js';
import ALM_CONTENT_TYPES from '../data-service/alm/alm-constants.js';
import { fetchLanguagePlaceholders } from '../scripts.js';

/**
 * Module that provides functionality for adapting ALM results to BrowseCards data model.
 * @module BrowseCardsALMAdaptor
 */
const BrowseCardsALMAdaptor = (() => {
  let placeholders = {};

  /**
   * Helper function to determine content type based on loType field.
   * @param {Object} result - The result object from ALM API.
   * @returns {string} The content type mapping key.
   * @private
   */
  const determineContentType = (result) => {
    const loType = result?.attributes?.loType;

    if (loType === 'learningProgram') {
      return ALM_CONTENT_TYPES.COHORT.MAPPING_KEY;
    }

    return ALM_CONTENT_TYPES.COURSE.MAPPING_KEY;
  };

  /**
   * Helper function to format duration from seconds to human-readable format.
   * @param {number} durationInSeconds - Duration in seconds from API.
   * @returns {string} Human-readable duration string.
   * @private
   */
  const formatDuration = (durationInSeconds) => {
    if (!durationInSeconds) return '';

    const seconds = parseInt(durationInSeconds, 10);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''}`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  /**
   * Helper function to determine badge title - simple static mapping.
   * @param {string} contentType - The content type.
   * @returns {string} Badge title.
   * @private
   */
  const determineBadge = (contentType) => {
    if (contentType === ALM_CONTENT_TYPES.COHORT.MAPPING_KEY) {
      return ALM_CONTENT_TYPES.COHORT.LABEL;
    }
    return ALM_CONTENT_TYPES.COURSE.LABEL;
  };

  /**
   * Maps a single ALM result to the BrowseCards data model.
   * @param {Object} result - The result object from ALM API.
   * @returns {Object} The BrowseCards data model.
   * @private
   */
  const mapResultToCardsDataModel = (result) => {
    const contentType = determineContentType(result);
    const { id, attributes, links } = result || {};
    const metadata = attributes?.localizedMetadata?.[0] || {};
    const isCohort = contentType === ALM_CONTENT_TYPES.COHORT.MAPPING_KEY;

    return {
      ...browseCardDataModel,
      id: id || '',
      contentType,
      badgeTitle: determineBadge(contentType),
      title: metadata.name || '',
      description: metadata.description || '',
      viewLink: links?.self || '',
      copyLink: links?.self || '',
      viewLinkText: isCohort
        ? (placeholders.browseCardAlmCohortViewLabel || 'Register')
        : (placeholders.browseCardAlmCourseViewLabel || 'View'),
      // Map confirmed ALM fields to meta
      meta: {
        rating: {
          average: attributes?.rating?.averageRating || 0,
          count: attributes?.rating?.ratingsCount || 0,
        },
        duration: formatDuration(attributes?.duration),
        loFormat: attributes?.loFormat || '',
        loType: attributes?.loType || '',
        enrollmentType: attributes?.enrollmentType || '',
        state: attributes?.state || '',
        // Cohort-specific fields (confirmed from API)
        ...(isCohort && {
          sections: attributes?.sections || [],
          isEnhancedLP: attributes?.isEnhancedLP || false,
        }),
        // Placeholder fields for future implementation
        level: '', // TODO: Add when field is available in API
        locations: [], // TODO: Add when field is available in API
        startDate: '', // TODO: Add when field is available in API
      },
    };
  };

  /**
   * Maps an array of ALM results to an array of BrowseCards data models.
   * @param {Array} data - The array of result objects from ALM API.
   * @returns {Promise<Array>} A promise that resolves with an array of BrowseCards data models.
   */
  const mapResultsToCardsData = async (data) => {
    try {
      placeholders = await fetchLanguagePlaceholders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
    return data.map((result) => mapResultToCardsDataModel(result));
  };

  return {
    mapResultsToCardsData,
  };
})();

export default BrowseCardsALMAdaptor;
