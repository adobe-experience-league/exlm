import { fetchPlaceholders } from '../lib-franklin.js';
import browseCardDataModel from '../data-model/browse-cards-model.js';
import CONTENT_TYPES from './browse-cards-constants.js';

/**
 * Module that provides functionality for adapting Coveo search results to BrowseCards data model.
 * @module BrowseCardsCoveoDataAdaptor
 */
const BrowseCardsCoveoDataAdaptor = (() => {
  let placeholders;

  /**
   * Converts a string to title case.
   * @param {string} str - The input string.
   * @returns {string} The string in title case.
   */
  const convertToTitleCase = (str) => str.replace(/\b\w/g, (match) => match.toUpperCase());

  /**
   * Creates tags based on the result and content type.
   * @param {Object} result - The result object.
   * @param {string} contentType - The content type.
   * @returns {Array} An array of tags.
   */
  const createTags = (result, contentType) => {
    const tags = [];

    if (contentType === CONTENT_TYPES.COURSE.MAPPING_KEY) {
      tags.push({ icon: 'user', text: '' });
      tags.push({ icon: 'book', text: `0 ${placeholders.lesson}` });
    } else {
      tags.push({ icon: result?.raw?.el_view_status ? 'view' : '', text: result?.raw?.el_view_status || '' });
      tags.push({ icon: result?.raw?.el_reply_status ? 'reply' : '', text: result?.raw?.el_reply_status || '' });
    }
    return tags;
  };

  /**
   * Maps a result to the BrowseCards data model.
   * @param {Object} result - The result object.
   * @returns {Object} The BrowseCards data model.
   */
  const mapResultToCardsDataModel = (result) => {
    const { raw, title, excerpt, uri } = result || {};
    /* eslint-disable camelcase */
    const { el_contenttype, el_product } = raw || {};
    const contentType = Array.isArray(el_contenttype) ? el_contenttype[0]?.trim() : el_contenttype?.trim();
    const product = Array.isArray(el_product) ? el_product[0] : el_product;
    /* eslint-enable camelcase */
    const tags = createTags(result, contentType.toLowerCase(), placeholders);

    return {
      ...browseCardDataModel,
      contentType,
      badgeTitle: CONTENT_TYPES[contentType.toUpperCase()]?.LABEL,
      product,
      title: title || '',
      description: excerpt || '',
      tags,
      copyLink: uri || '',
      viewLink: uri || '',
      viewLinkText: contentType ? placeholders[`viewLink${convertToTitleCase(contentType)}`] : '',
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

export default BrowseCardsCoveoDataAdaptor;
