import { fetchPlaceholders } from '../lib-franklin.js';
import browseCardDataModel from '../data-model/browse-cards-model.js';
import CONTENT_TYPES from './browse-cards-constants.js';

/**
 * Module that provides functionality for adapting live event results to BrowseCards data model.
 * @module BrowseCardsLiveEventsAdaptor
 */
const BrowseCardsLiveEventsAdaptor = (() => {
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
    const contentType = CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY;
    const { productFocus, eventTitle, eventDescription, startTime, endTime, cta } = result || {};
    const product = Array.isArray(productFocus) ? productFocus[0] : '';
    const { ctaLabel, ctaLink } = cta || {};

    return {
      ...browseCardDataModel,
      contentType,
      badgeTitle: CONTENT_TYPES.LIVE_EVENTS.LABEL,
      product,
      title: eventTitle || '',
      description: eventDescription || '',
      event: {
        startTime,
        endTime,
      },
      copyLink: ctaLink || '',
      viewLink: ctaLink || '',
      viewLinkText: ctaLabel || placeholders[`viewLink${convertToTitleCase(contentType)}`],
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

export default BrowseCardsLiveEventsAdaptor;
