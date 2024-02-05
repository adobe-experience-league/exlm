import browseCardDataModel from '../data-model/browse-cards-model.js';
import { CONTENT_TYPES, RECOMMENDED_COURSES_CONSTANTS } from './browse-cards-constants.js';
import { exlmCDNUrl } from '../urls.js';
import { fetchLanguagePlaceholders } from '../scripts.js';
/**
 * Module that provides functionality for adapting Paths results to BrowseCards data model
 * @module BrowseCardsPathsAdaptor
 */
const BrowseCardsPathsAdaptor = (() => {
  let placeholders = {};

  /**
   * Creates tags based on the result and content type.
   * @param {Object} result - The result object.
   * @param {string} contentType - The content type.
   * @returns {Array} An array of tags.
   */
  const createTags = (roleData) => {
    const tags = [];
    const role = roleData;
    tags.push({ icon: 'user', text: role || '' });
    return tags;
  };

  // Function to create view link text based on content type
  const createViewLinkText = (contentType) => {
    // Use conditional (ternary) operator for a more concise code
    const linkText =
      contentType === RECOMMENDED_COURSES_CONSTANTS.IN_PROGRESS.MAPPING_KEY
        ? placeholders.viewLinkContinueCourse || 'Continue Course'
        : placeholders.viewLinkCourse || 'View Course';

    // Return the generated link text
    return linkText;
  };

  /**
   * Maps a result to the BrowseCards data model.
   * @param {Object} result - The result object.
   * @returns {Object} The Path data model.
   */

  const mapResultToCardsDataModel = (result) => {
    const {
      Solution,
      Thumbnail,
      ID,
      'Path Title': PathTitle,
      'Path Duration': PathDuration,
      URL,
      inProgressValue,
      Role,
      contentType,
    } = result || {};

    return {
      ...browseCardDataModel,
      contentType,
      id: ID,
      badgeTitle: CONTENT_TYPES.COURSE.LABEL,
      thumbnail: (Thumbnail || '').replace('/www/img', exlmCDNUrl) || '',
      inProgressStatus: inProgressValue || '0',
      product: Solution || '',
      title: PathTitle || '',
      tags: createTags(Role) || '',
      inProgressText: PathDuration || '',
      copyLink: URL || '',
      viewLink: URL || '',
      viewLinkText: createViewLinkText(contentType),
    };
  };

  /**
   * Maps an array of results to an array of PathsCards data models.
   * @param {Array} data - The array of result objects.
   * @returns {Promise<Array>} A promise that resolves with an array of PathsCards data models.
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

export default BrowseCardsPathsAdaptor;
