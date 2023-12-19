import CoveoDataService from '../data-service/coveo/coveo-data-service.js';
import LiveEventsDataService from '../data-service/live-events-data-service.js';
import ADLSDataService from '../data-service/adls-data-service.js';
import BrowseCardsCoveoDataAdaptor from './browse-cards-coveo-data-adaptor.js';
import BrowseCardsLiveEventsAdaptor from './browse-cards-live-events-adaptor.js';
import BrowseCardsADLSAdaptor from './browse-cards-adls-adaptor.js';
import { CONTENT_TYPES } from './browse-cards-constants.js';
import { coveoSearchResultsUrl, liveEventsUrl, adlsUrl } from '../urls.js';

/**
 * @module BrowseCardsDelegate
 * @description A module that handles the delegation of fetching card data based on content types.
 */
const BrowseCardsDelegate = (() => {
  /**
   * Object to store query parameters for fetching data.
   * @type {Object}
   * @private
   */
  let param = {};

  /**
   * Constructs Coveo facet structure based on provided facets.
   * @param {Array} facets - An array of facet objects.
   * @returns {Array} Array of Coveo facet objects.
   * @private
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
   * Constructs advanced query for Coveo data service based on query parameters.
   * @returns {Object} Object containing the advanced query.
   * @private
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
   * Handles Coveo data service to fetch card data.
   * @returns {Array} Array of card data.
   * @throws {Error} Throws an error if an issue occurs during data fetching.
   * @private
   */
  const handleCoveoService = async () => {
    const facets = [
      ...(param.contentType ? [{ id: 'el_contenttype', type: 'specific', currentValues: param.contentType }] : []),
      ...(param.product ? [{ id: 'el_product', type: 'specific', currentValues: param.product }] : []),
      ...(param.role ? [{ id: 'el_role', type: 'specific', currentValues: param.role }] : []),
      ...(param.level ? [{ id: 'el_level', type: 'specific', currentValues: param.level }] : []),
    ];
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
    if (!cardData) {
      throw new Error('An error occurred');
    }
    if (cardData?.results?.length) {
      return BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(cardData.results);
    }
    return [];
  };

  /**
   * Handles Live Events data service to fetch card data.
   * @returns {Array} Array of card data.
   * @throws {Error} Throws an error if an issue occurs during data fetching.
   * @private
   */
  const handleLiveEventsService = async () => {
    const liveEventsService = new LiveEventsDataService(liveEventsUrl);
    const events = await liveEventsService.fetchDataFromSource();
    if (!events) {
      throw new Error('An error occurred');
    }
    if (events?.length) {
      return BrowseCardsLiveEventsAdaptor.mapResultsToCardsData(events);
    }
    return [];
  };

  /**
   * Constructs search parameters for ADLS data service.
   * @returns {URLSearchParams} Constructed URLSearchParams object.
   * @private
   */
  const constructADLSSearchParams = () => {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('trainingMethod', 'Live Instructor Courses');
    urlSearchParams.append('pageIndex', '1');
    urlSearchParams.append('learningType', 'catalog');
    if (param.solutions) {
      urlSearchParams.append('products', param.solutions);
    }
    if (param.roles) {
      urlSearchParams.append('roles', param.roles);
    }
    urlSearchParams.append('sort', param.sortBy);
    return urlSearchParams;
  };

  /**
   * Handles ADLS data service to fetch card data.
   * @returns {Array} Array of card data.
   * @throws {Error} Throws an error if an issue occurs during data fetching.
   * @private
   */
  const handleADLSService = async () => {
    const dataSource = {
      url: adlsUrl,
      param: constructADLSSearchParams(),
    };
    const adlsService = new ADLSDataService(dataSource);
    const cardData = await adlsService.fetchDataFromSource();
    if (!cardData) {
      throw new Error('An error occurred');
    }
    if (cardData[0]?.results?.length) {
      return BrowseCardsADLSAdaptor.mapResultsToCardsData(cardData[0].results);
    }
    return [];
  };

  /**
   * Retrieves the appropriate service function based on the content type.
   * @param {string} contentType - The content type for which the service is needed.
   * @returns {Function} The corresponding service function for the content type.
   * @private
   */
  const getServiceForContentType = (contentType) => {
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
   * Fetches card data based on the provided parameters.
   * @param {Object} paramObj - Parameters for fetching card data.
   * @returns {Promise} A promise that resolves to an array of card data.
   */
  const fetchCardData = (paramObj) =>
    new Promise((resolve, reject) => {
      param = paramObj;
      const { contentType } = param;
      const cardDataService = getServiceForContentType(contentType);
      if (cardDataService) {
        const cardDataPromise = cardDataService();
        cardDataPromise
          .then((data) => {
            resolve(data);
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        reject(new Error('Service Unavailable'));
      }
    });

  return {
    fetchCardData,
  };
})();

export default BrowseCardsDelegate;
