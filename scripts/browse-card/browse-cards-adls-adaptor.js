import browseCardDataModel from '../data-model/browse-cards-model.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';
import { fetchLanguagePlaceholders, getConfig } from '../scripts.js';

const { adlsUrl } = getConfig();

/* Fetch the Domain Name and Protocol from ADLS End Point */
const extractDomain = (url) => {
  const urlObject = new URL(url);
  const protocolAndDomain = urlObject.origin;
  return protocolAndDomain;
};

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
    const contentType = CONTENT_TYPES.INSTRUCTOR_LED.MAPPING_KEY;
    const { solution, name, description, path, paths, dates, time } = result || {};
    const adlsDomain = extractDomain(adlsUrl);

    let formattedPath;
    if (path) {
      formattedPath = !path.startsWith('/') ? `/${path}` : path;
    } else if (paths && Array.isArray(paths) && paths.length > 0) {
      const firstPath = paths[0];
      formattedPath = firstPath.replace('us-en:/content/athena/us/us-en', '');
    }

    return {
      ...browseCardDataModel,
      contentType,
      badgeTitle: CONTENT_TYPES.INSTRUCTOR_LED.LABEL,
      product: solution && (Array.isArray(solution) ? solution : solution.split(/,\s*/)),
      title: name || '',
      event: {
        date: dates,
        time,
      },
      description: description || '',
      copyLink: formattedPath ? `${adlsDomain}${formattedPath}` : '',
      viewLink: formattedPath ? `${adlsDomain}${formattedPath}` : '',
      viewLinkText: placeholders.browseCardInstructorLedViewLabel || 'View course',
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
