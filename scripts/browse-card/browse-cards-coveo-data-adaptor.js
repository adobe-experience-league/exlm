import { fetchPlaceholders } from '../lib-franklin.js';
import browseCardDataModel from '../data-model/browse-cards-model.js';
import { CONTENT_TYPES } from './browse-cards-constants.js';

/**
 * Module that provides functionality for adapting Coveo search results to BrowseCards data model.
 * @module BrowseCardsCoveoDataAdaptor
 */
const BrowseCardsCoveoDataAdaptor = (() => {
  let placeholders = {};

  /**
   * Converts a string to title case.
   * @param {string} str - The input string.
   * @returns {string} The string in title case.
   */
  const convertToTitleCase = (str) => (str ? str.replace(/\b\w/g, (match) => match.toUpperCase()) : '');

  /**
   * Creates tags based on the result and content type.
   * @param {Object} result - The result object.
   * @param {string} contentType - The content type.
   * @returns {Array} An array of tags.
   */
  const createTags = (result, contentType) => {
    const tags = [];
    const role = result?.raw?.role ? result.raw.role.replace(/,/g, ', ') : '';
    if (contentType === CONTENT_TYPES.COURSE.MAPPING_KEY) {
      tags.push({ icon: 'user', text: role || '' });
      /* TODO: Will enable once we have the API changes ready from ExL */
      // tags.push({ icon: 'book', text: `0 ${placeholders.lesson}` });
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
    const { raw, parentResult, title, excerpt, clickUri, uri } = result || {};
    /* eslint-disable camelcase */
    const { el_contenttype, el_product, el_solution, el_type } = parentResult?.raw || raw || {};
    let contentType;
    if (el_type) {
      contentType = el_type.trim();
    } else {
      contentType = Array.isArray(el_contenttype) ? el_contenttype[0]?.trim() : el_contenttype?.trim();
    }
    let product = Array.isArray(el_product) ? el_product[0] : el_product;
    if (!product && el_solution) {
      product = Array.isArray(el_solution) ? el_solution[0] : el_solution;
    }
    const tags = createTags(result, contentType.toLowerCase());
    const url = parentResult?.clickableuri || parentResult?.uri || clickUri || uri || '';

    return {
      ...browseCardDataModel,
      contentType,
      badgeTitle: CONTENT_TYPES[contentType.toUpperCase()]?.LABEL,
      thumbnail:
        (raw?.video_url &&
          (raw.video_url.includes('?')
            ? raw.video_url.replace(/\?.*/, '?format=jpeg')
            : `${raw.video_url}?format=jpeg`)) ||
        '',
      product,
      title: parentResult?.title || title || '',
      description: parentResult?.excerpt || excerpt || '',
      tags,
      copyLink: url,
      viewLink: url,
      viewLinkText: placeholders[`viewLink${convertToTitleCase(contentType)}`] || 'View',
    };
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
    return data.map((result) => mapResultToCardsDataModel(result));
  };

  return {
    mapResultsToCardsData,
  };
})();

export default BrowseCardsCoveoDataAdaptor;
