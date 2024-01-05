import { fetchPlaceholders } from '../lib-franklin.js';
import browseCardDataModel from '../data-model/browse-cards-model.js';
import { CONTENT_TYPES } from './browse-cards-constants.js';

/**
 * Module that provides functionality for adapting live event results to BrowseCards data model.
 * @module BrowseCardsLiveEventsAdaptor
 */
const BrowseCardsLiveEventsAdaptor = (() => {
  let placeholders = {};
  /**
   * Maps a result to the BrowseCards data model.
   * @param {Object} result - The result object.
   * @returns {Object} The BrowseCards data model.
   */
  const mapResultToCardsDataModel = (result) => {
    const contentType = CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY;
    const { productFocus, eventTitle, eventDescription, startTime, endTime, time, cta } = result || {};
    const product = Array.isArray(productFocus) ? productFocus[0] : '';
    const { ctaLabel, ctaLink } = cta || {};
    const eventStartTime = new Date(`${startTime}Z`);
    const eventEndTime = new Date(`${endTime}Z`);
    const currentDate = new Date();
    if (currentDate >= eventStartTime && currentDate <= eventEndTime) {
      return {
        ...browseCardDataModel,
        contentType,
        badgeTitle: CONTENT_TYPES.LIVE_EVENTS.LABEL,
        product,
        title: eventTitle || '',
        description: eventDescription || '',
        event: {
          time,
        },
        copyLink: ctaLink || '',
        viewLink: ctaLink || '',
        viewLinkText: ctaLabel || placeholders.viewLinkLiveEvent || 'Register',
      };
    }
    return null;
  };

  /**
   * Maps an array of results to an array of BrowseCards data models.
   * @param {Array} data - The array of result objects.
   * @returns {Promise<Array>} A promise that resolves with an array of BrowseCards data models.
   */
  const mapResultsToCardsData = async (data) => {
    try {
      placeholders = await fetchPlaceholders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
    return data.map((result) => mapResultToCardsDataModel(result)).filter((item) => item !== null);
  };

  return {
    mapResultsToCardsData,
  };
})();

export default BrowseCardsLiveEventsAdaptor;
