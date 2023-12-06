import { fetchPlaceholders } from '../lib-franklin.js';
import browseCardDataModel from '../data-model/browse-cards-model.js';
import CONTENT_TYPES from './browse-cards-constants.js';

/**
 * Module that provides functionality for adapting ADLS results to BrowseCards data model.
 * @module BrowseCardsADLSAdaptor
 */
const BrowseCardsADLSAdaptor = (() => {
  let placeholders;

  /**
   * Converts a string to title case.
   * @param {string} str - The input string.
   * @returns {string} The string in title case.
   */
  const convertToTitleCase = (str) => str.replace(/\b\w/g, (match) => match.toUpperCase());

  /**
   * Maps a result to the BrowseCards data model.
   * @param {Object} result - The result object.
   * @returns {Object} The BrowseCards data model.
   */
  const mapResultToCardsDataModel = (result) => {
    const contentType = CONTENT_TYPES.INSTRUCTOR_LED_TRANING.MAPPING_KEY;
    const {solution, name, description, path } = result || {};

    return {
      ...browseCardDataModel,
      contentType,
      badgeTitle: CONTENT_TYPES.INSTRUCTOR_LED_TRANING.LABEL,
      product: solution,
      title: name || '',
      description: description || '',
      copyLink: path || '',
      viewLink: path || '',
      viewLinkText: placeholders['viewLinkCourse'],
    };
  };

  /**
   * Maps an array of results to an array of BrowseCards data models.
   * @param {Array} data - The array of result objects.
   * @returns {Promise<Array>} A promise that resolves with an array of BrowseCards data models.
   */
  const mapResultsToCardsData = async (data) => {
    placeholders = await fetchPlaceholders();
    return data.map((result) => mapResultToCardsDataModel(result));
  };

  return {
    mapResultsToCardsData,
  };
})();

export default BrowseCardsADLSAdaptor;
