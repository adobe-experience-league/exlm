import browseCardDataModel from '../data-model/browse-cards-model.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';
import { rewriteDocsPath, fetchLanguagePlaceholders } from '../scripts.js';

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
    if (contentType === CONTENT_TYPES.PLAYLIST.MAPPING_KEY) {
      tags.push({ icon: 'user', text: role || '' });
      /* TODO: Will enable once we have the API changes ready from ExL */
      // tags.push({ icon: 'book', text: `0 ${placeholders.lesson}` });
    } else {
      tags.push({
        icon: result?.parentResult?.raw?.el_view_status || result?.raw?.el_view_status ? 'view' : '',
        text: result?.parentResult?.raw?.el_view_status || result?.raw?.el_view_status || '',
      });
      tags.push({
        icon: result?.parentResult?.raw?.el_reply_status || result?.raw?.el_reply_status ? 'reply' : '',
        text: result?.parentResult?.raw?.el_reply_status || result?.raw?.el_reply_status || '',
      });
    }
    return tags;
  };

  /**
   * Removes duplicate items from an array of products/solutions (with sub-solutions)
   * @param {Array} products - Array of products to remove duplicates from.
   * @returns {Array} - Array of unique products.
   */
  const removeProductDuplicates = (products) => {
    const filteredProducts = [];
    for (let outerIndex = 0; outerIndex < products.length; outerIndex += 1) {
      const currentItem = products[outerIndex];
      let isDuplicate = false;
      for (let innerIndex = 0; innerIndex < products.length; innerIndex += 1) {
        if (outerIndex !== innerIndex && products[innerIndex].startsWith(currentItem)) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        const product = products[outerIndex].replace(/\|/g, ' ');
        filteredProducts.push(product);
      }
    }
    return filteredProducts;
  };

  /**
   * Maps a result to the BrowseCards data model.
   * @param {Object} result - The result object.
   * @param {Number} index - The index of the result object in the source array.
   * @param {string} searchUid - If the data comes from coveo, provide the searchUid
   * @returns {Object} The BrowseCards data model.
   */
  const mapResultToCardsDataModel = (result, index, searchUid) => {
    const { raw, parentResult, title, excerpt, clickUri, uri } = result || {};
    /* eslint-disable camelcase */

    const { el_id, el_contenttype, el_product, el_solution, el_type } = parentResult?.raw || raw || {};
    let contentType;
    if (el_type) {
      contentType = el_type.trim();
    } else {
      contentType = Array.isArray(el_contenttype) ? el_contenttype[0]?.trim() : el_contenttype?.trim();
    }
    let products;
    if (el_solution) {
      products = Array.isArray(el_solution) ? el_solution : el_solution.split(/,\s*/);
    } else if (el_product) {
      products = Array.isArray(el_product) ? el_product : el_product.split(/,\s*/);
    }
    const tags = createTags(result, contentType?.toLowerCase());
    let url = parentResult?.clickUri || parentResult?.uri || clickUri || uri || '';
    url = rewriteDocsPath(url);
    const contentTypeTitleCase = convertToTitleCase(contentType?.toLowerCase());

    return {
      ...browseCardDataModel,
      id: parentResult?.el_id || el_id || '',
      contentType,
      badgeTitle: contentType ? CONTENT_TYPES[contentType.toUpperCase()]?.LABEL : '',
      thumbnail:
        raw?.exl_thumbnail ||
        (raw?.video_url &&
          (raw.video_url.includes('?')
            ? raw.video_url.replace(/\?.*/, '?format=jpeg')
            : `${raw.video_url}?format=jpeg`)) ||
        '',
      product: products && removeProductDuplicates(products),
      title: parentResult?.title || title || '',
      description:
        contentType?.toLowerCase() === CONTENT_TYPES.PERSPECTIVE.MAPPING_KEY ||
        contentType?.toLowerCase() === CONTENT_TYPES.PLAYLIST.MAPPING_KEY
          ? raw?.exl_description || parentResult?.excerpt || ''
          : parentResult?.excerpt || excerpt || raw?.description || raw?.exl_description || '',
      tags,
      copyLink: url,
      viewLink: url,
      viewLinkText: placeholders[`browseCard${contentTypeTitleCase}ViewLabel`] || 'View',
      permanentid: raw?.permanentid,
      searchUid,
      index,
      authorInfo: {
        name: raw?.author_name || '',
        type: raw?.author_type || '',
      },
    };
  };

  /**
   * Maps an array of results to an array of BrowseCards data models.
   * @param {Array} data - The array of result objects.
   * @param {string} searchUid - Optional. If the data comes from coveo, provide the searchUid
   * @returns {Promise<Array>} A promise that resolves with an array of BrowseCards data models.
   */
  const mapResultsToCardsData = async (data, searchUid) => {
    try {
      placeholders = await fetchLanguagePlaceholders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
    return data.map((result, index) => mapResultToCardsDataModel(result, index, searchUid));
  };

  return {
    mapResultsToCardsData,
  };
})();

export default BrowseCardsCoveoDataAdaptor;
