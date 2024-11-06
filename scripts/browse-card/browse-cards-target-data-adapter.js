import { convertToTitleCase } from './browse-card-utils.js';
import { fetchLanguagePlaceholders, getPathDetails } from '../scripts.js';

const BrowseCardsTargetDataAdapter = (() => {
  let placeholders = {};
  /**
   * Maps a result to the BrowseCards data model.
   * @param {Object} result - The result object.
   * @returns {Object} The BrowseCards data model.
   */
  const mapResultsToCardsDataModel = (data) => {
    const articlePath = `/${getPathDetails().lang}${data?.path}`;
    const fullURL = new URL(articlePath, window.location.origin).href;
    const solutions = data?.product.split(',').map((s) => s.trim());
    return {
      ...data,
      badgeTitle: data?.contentType,
      type: data?.contentType,
      authorInfo: data?.authorInfo || {
        name: [''],
        type: [''],
      },
      product: solutions,
      tags: [],
      copyLink: fullURL,
      bookmarkLink: '',
      viewLink: fullURL,
      viewLinkText: placeholders[`browseCard${convertToTitleCase(data?.contentType)}ViewLabel`]
        ? placeholders[`browseCard${convertToTitleCase(data?.contentType)}ViewLabel`]
        : `View ${data?.contentType}`,
    };
  };

  const mapResultsToCardsData = async (data) => {
    try {
      placeholders = await fetchLanguagePlaceholders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
    return data.map((result) => mapResultsToCardsDataModel(result)).filter((item) => item !== null);
  };

  return {
    mapResultsToCardsData,
  };
})();

export default BrowseCardsTargetDataAdapter;
