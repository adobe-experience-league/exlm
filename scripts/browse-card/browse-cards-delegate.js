import CoveoDataService from '../data-service/coveo/coveo-data-service.js';
import LiveEventsDataService from '../data-service/live-events-data-service.js';
import ADLSDataService from '../data-service/adls-data-service.js';
import BrowseCardsCoveoDataAdaptor from './browse-cards-coveo-data-adaptor.js';
import BrowseCardsLiveEventsAdaptor from './browse-cards-live-events-adaptor.js';
import BrowseCardsADLSAdaptor from './browse-cards-adls-adaptor.js';
import { CONTENT_TYPES } from './browse-cards-constants.js';
import { coveoSearchResultsUrl, liveEventsUrl, adlsUrl } from '../urls.js';

/**
 * Module that provides a facade for fetching card data based on different content types.
 * @module BrowseCardsDelegate
 */
const BrowseCardsDelegate = (() => {
  let param = {};

  /**
   * constructADLSSearchParams is a method that constructs search parameters for the data source.
   * @returns {URLSearchParams} - The URLSearchParams object containing the constructed parameters
   */
  const constructADLSSearchParams = () => {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('trainingMethod', 'Live Instructor Courses');
    urlSearchParams.append('pageIndex', '1');
    urlSearchParams.append('sort', 'recommended');
    urlSearchParams.append('learningType', 'catalog');
    return urlSearchParams;
  };

  /**
   * constructCoveoFacet is a method that constructs Coveo facets based on the provided facet data.
   * @param {Array} facets - An array of facet objects.
   * @returns {Array} - An array of Coveo facet objects.
   */
  const constructCoveoFacet = (facets) => {
    const facetsArray = facets.map((facet) => ({
      facetId: `@${facet.id}`,
      field: facet.id,
      type: facet.type,
      numberOfValues: facet.currentValues?.length || 2,
      currentValues: facet.currentValues.map((value) => ({
        value,
        state: 'selected',
      })),
    }));
    return facetsArray;
  };

  /**
   * constructCoveoAdvancedQuery is a method that constructs an advanced Coveo query based on the provided parameters.
   * @returns {Object} - An object containing the advanced Coveo query.
   */
  const constructCoveoAdvancedQuery = () => {
    const featureQuery = param.feature
      ? `(${param.feature.map((type) => `@el_features=="${type}"`).join(' OR ')})`
      : '';
    const contentTypeQuery = param.contentType
      ? `AND (${param.contentType.map((type) => `@el_contenttype=="${type}"`).join(' OR ')})`
      : '';
    const productQuery = param.product
      ? `AND (${param.product.map((type) => `@el_product=="${type}"`).join(' OR ')})`
      : '';
    const roleQuery = param.role ? `AND (${param.role.map((type) => `@el_role=="${type}"`).join(' OR ')})` : '';
    const levelQuery = param.level ? `AND (${param.level.map((type) => `@el_level=="${type}"`).join(' OR ')})` : '';
    const query = `${featureQuery} ${contentTypeQuery} ${productQuery} ${roleQuery} ${levelQuery}`;
    return { aq: query };
  };

  /**
   * handleCoveoService is a method that handles fetching browse cards content using CoveoDataService.
   * @returns {Promise<Array>} - A promise resolving to an array of browse cards data.
   */
  const handleCoveoService = () => {
    const facets = [
      ...(param.contentType ? [{ id: 'el_contenttype', type: 'specific', currentValues: param.contentType }] : []),
      ...(param.product ? [{ id: 'el_product', type: 'specific', currentValues: param.product }] : []),
      ...(param.role ? [{ id: 'el_role', type: 'specific', currentValues: param.role }] : []),
      ...(param.level ? [{ id: 'el_level', type: 'specific', currentValues: param.level }] : []),
    ];
    /* eslint-disable-next-line no-async-promise-executor */
    return new Promise(async (resolve) => {
      const dataSource = {
        url: coveoSearchResultsUrl,
        param: {
          locale: 'en',
          searchHub: 'Experience League Learning Hub',
          numberOfResults: param.noOfResults,
          excerptLength: 200,
          sortCriteria: param.sortCriteria,
          context: { entitlements: {}, role: {}, interests: {}, industryInterests: {} },
          filterField: '@foldingcollection',
          parentField: '@foldingchild',
          childField: '@foldingparent',
          ...(param.feature ? constructCoveoAdvancedQuery() : ''),
          ...(!param.feature ? { facets: constructCoveoFacet(facets) } : ''),
        },
      };
      const coveoService = new CoveoDataService(dataSource);
      const cardData = await coveoService.fetchDataFromSource();
      if (cardData?.results?.length) {
        resolve(BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(cardData.results));
      } else {
        resolve([]);
      }
    });
  };

  /**
   * handleLiveEventsService is a method that handles fetching browse cards content using LiveEventsDataService.
   * @returns {Promise<Array>} - A promise resolving to an array of browse cards data.
   */
  const handleLiveEventsService = () =>
    /* eslint-disable-next-line no-async-promise-executor */
    new Promise(async (resolve, reject) => {
      const liveEventsService = new LiveEventsDataService(liveEventsUrl);
      const events = await liveEventsService.fetchDataFromSource();
      if (events?.length) {
        resolve(BrowseCardsLiveEventsAdaptor.mapResultsToCardsData(events));
      } else {
        reject(new Error('An Error Occurred'));
      }
    });

  /**
   * handleADLSService is a method that handles fetching browse cards content using ADLSService.
   * @returns {Promise<Array>} - A promise resolving to an array of browse cards data.
   */
  const handleADLSService = () =>
    /* eslint-disable-next-line no-async-promise-executor */
    new Promise(async (resolve, reject) => {
      const dataSource = {
        url: adlsUrl,
        param: constructADLSSearchParams(),
      };
      const adlsService = new ADLSDataService(dataSource);
      const cardData = await adlsService.fetchDataFromSource();
      if (cardData[0]?.results?.length) {
        resolve(BrowseCardsADLSAdaptor.mapResultsToCardsData(cardData[0].results));
      } else {
        reject(new Error('An Error Occurred'));
      }
    });

  /**
   * Determines and returns the appropriate service based on the provided content type.
   *
   * @param {string | string[]} contentType - The content type or an array of content types.
   * @returns {function} - The corresponding service function.
   */
  const getService = (contentType) => {
    const contentTypesServices = {
      [CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY]: handleLiveEventsService,
      [CONTENT_TYPES.INSTRUCTOR_LED_TRANING.MAPPING_KEY]: handleADLSService,
    };

    // If the content type is an array, use the handleCoveoService (Works only with Coveo related content types)
    if (Array.isArray(contentType)) {
      return handleCoveoService;
    }

    // Use the mapping object to get the service for the other content types
    const service = contentTypesServices[contentType?.toLowerCase()];

    // If no specific match is found, use the default handleCoveoService
    return service || handleCoveoService;
  };

  /**
   * fetchCardData is an asynchronous method that fetches card data based on the configured content type.
   * @param {Object} paramObj - An object containing parameters for fetching card data.
   * @returns {Promise<Array>|null} - A promise resolving to an array of browse cards data, or null if the content type is not handled.
   */
  const fetchCardData = async (paramObj) => {
    param = paramObj;
    const { contentType } = param;
    const service = getService(contentType);
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
