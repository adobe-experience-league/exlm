import CoveoDataService from '../data-service/coveo/coveo-data-service.js';
import BrowseCardsCoveoDataAdaptor from './browse-cards-coveo-data-adaptor.js';
import CONTENT_TYPES from './browse-cards-constants.js';
import { coveoSearchResultsUrl } from '../urls.js';

/**
 * Module that provides a facade for fetching card data based on different content types.
 * @module BrowseCardsDelegate
 */
const BrowseCardsDelegate = (() => {
  let param = {};

  /**
   * constructCoveoSearchParams is a method that constructs search parameters for the data source.
   * @returns {URLSearchParams} - The URLSearchParams object containing the constructed parameters.
   */
  const constructCoveoSearchParams = () => {
    const { noOfResults, contentType } = param;
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('searchHub', 'Experience League Learning Hub');
    urlSearchParams.append('locale', 'en');
    urlSearchParams.append('numberOfResults', noOfResults);
    urlSearchParams.append('excerptLength', '200');
    urlSearchParams.append('sortCriteria', 'relevancy');
    urlSearchParams.append(
      'facets',
      `[{"facetId":"@el_role","field":"el_role","type":"specific","injectionDepth":1000,"filterFacetCount":true,"currentValues":[{"value":"Admin","state":"idle"},{"value":"Developer","state":"idle"},{"value":"Leader","state":"idle"},{"value":"User","state":"idle"}],"numberOfValues":5,"freezeCurrentValues":false,"preventAutoSelect":false,"isFieldExpanded":false},{"facetId":"@el_contenttype","field":"el_contenttype","type":"hierarchical","injectionDepth":1000,"delimitingCharacter":"|","filterFacetCount":true,"basePath":[],"filterByBasePath":false,"currentValues":[{"value":"${contentType}","state":"selected","children":[],"retrieveChildren":true,"retrieveCount":5}],"preventAutoSelect":true,"numberOfValues":1,"isFieldExpanded":false},{"facetId":"el_product","field":"el_product","type":"hierarchical","injectionDepth":1000,"delimitingCharacter":"|","filterFacetCount":true,"basePath":[],"filterByBasePath":false,"currentValues":[],"preventAutoSelect":false,"numberOfValues":10000,"isFieldExpanded":false}]`,
    );
    urlSearchParams.append('timezone', 'Asia/Calcutta');
    urlSearchParams.append('enableQuerySyntax', 'true');
    urlSearchParams.append('enableDuplicateFiltering', 'false');
    urlSearchParams.append('enableCollaborativeRating', 'false');
    urlSearchParams.append('debug', 'false');
    return urlSearchParams;
  };

  /**
   * handleCoveoService is a method that handles fetching browse cards content using CoveoDataService.
   * @returns {Promise<Array>} - A promise resolving to an array of browse cards data.
   */
  const handleCoveoService = () =>
    /* eslint-disable-next-line no-async-promise-executor */
    new Promise(async (resolve, reject) => {
      const dataSource = {
        url: coveoSearchResultsUrl,
        param: constructCoveoSearchParams(),
      };
      const coveoService = new CoveoDataService(dataSource);
      const cardData = await coveoService.fetchDataFromSource();
      if (cardData?.results) {
        resolve(BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(cardData.results));
      } else {
        reject(new Error('An Error Occured'));
      }
    });

  /**
   * getServiceForContentType retrieves the action associated with a specific content type.
   * @param {string} contentType - The content type for which to retrieve the action.
   * @returns {Function} - The action associated with the specified content type.
   */
  const getServiceForContentType = (contentType) => {
    const contentTypesServices = {
      [CONTENT_TYPES.COURSE]: handleCoveoService,
      [CONTENT_TYPES.TUTORIAL]: handleCoveoService,
      [CONTENT_TYPES.ON_DEMAND_EVENT]: handleCoveoService,
      [CONTENT_TYPES.CERTIFICATION]: handleCoveoService,
      [CONTENT_TYPES.TROUBLESHOOTING]: handleCoveoService,
      [CONTENT_TYPES.DOCUMENTATION]: handleCoveoService,
      [CONTENT_TYPES.LIVE_EVENT]: null, // placeholder for handleLiveEventService,
      [CONTENT_TYPES.COMMUNITY]: null, // placeholder for handleKhorosService,
      [CONTENT_TYPES.INSTRUCTOR_LED_TRANING]: null, // placeholder for handleADLSCatalogService,
    };

    return contentTypesServices[contentType];
  };

  /**
   * fetchCardData is an asynchronous method that fetches card data based on the configured content type.
   * @returns {Promise<Array>|null} - A promise resolving to an array of browse cards data, or null if the content type is not handled.
   */
  const fetchCardData = async (paramObj) => {
    param = paramObj;
    const { contentType } = paramObj;
    const service = getServiceForContentType(contentType?.toUpperCase());
    if (service) {
      return new Promise((resolve) => {
        resolve(service());
      });
    }
    return null;
  };

  return {
    fetchCardData,
  };
})();

export default BrowseCardsDelegate;
