import browseCardDataModel from '../data-model/browse-cards-model.js';
import { CONTENT_TYPES } from './browse-cards-constants.js';
import { adlsRedirectUrl } from '../urls.js';
import { fetchLanguagePlaceholders } from '../scripts.js';

/**
 * Module that provides functionality for adapting ADLS results to BrowseCards data model
 * @module BrowseCardsADLSAdaptor
 */
const BrowseCardsADLSAdaptor = (() => {
  let placeholders = {};
  /**
   * Maps a result to the BrowseCards data model.
   * @param {Object} result - The result object.
   * @returns {Object} The BrowseCards data model.
   */
  const mapResultToCardsDataModel = (result) => {
    const contentType = CONTENT_TYPES.INSTRUCTOR_LED_TRANING.MAPPING_KEY;
    const { solution, name, description, path } = result || {};

    return {
      ...browseCardDataModel,
      contentType,
      badgeTitle: CONTENT_TYPES.INSTRUCTOR_LED_TRANING.LABEL,
      product: solution && (Array.isArray(solution) ? solution : solution.split(/,\s*/)),
      title: name || '',
      description: description || '',
      copyLink: adlsRedirectUrl + path || '',
      viewLink: adlsRedirectUrl + path || '',
      viewLinkText: placeholders.viewLinkCourse || 'View course',
    };
  };

  /**
   * Maps an array of results to an array of BrowseCards data models.
   * @param {Array} data - The array of result objects.
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

export default BrowseCardsADLSAdaptor;
