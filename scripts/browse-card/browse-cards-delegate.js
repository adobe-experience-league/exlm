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

  const constructCoveoFacet = (facets) => {
    const facetsArray = facets.map(facet => ({
      facetId: `@${facet.id}`,
      field: facet.id,
      type: facet.type,
      numberOfValues: facet.currentValues?.length || 2,
      currentValues: facet.currentValues.map(value => ({
        value,
        state: "selected"
      }))
    }));
    return facetsArray;
  }

  const constructCoveoAdvancedQuery = () => {
    const featureQueryMap = param.feature ? param.feature.map(type => `@el_features=="${type}"`).join(' OR ') : '';
    const contentTypeQueryMap = param.contentType ? param.contentType.map(type => `@el_contenttype=="${type}"`).join(' OR ') : '';
    const productQueryMap = param.product ? param.product.map(type => `@el_product=="${type}"`).join(' OR ') : '';
    const roleQueryMap = param.role ? param.role.map(type => `@el_role=="${type}"`).join(' OR ') : '';

    const featureQuery = featureQueryMap?.length ? `(${featureQueryMap})` : '';
    const contentTypeQuery = contentTypeQueryMap?.length ? `(${contentTypeQueryMap})` : '';
    const productQuery = productQueryMap?.length ? `(${productQueryMap})` : '';
    const roleQuery = roleQueryMap?.length ? `(${roleQueryMap})` : '';

    const featureQuerySeparator = featureQuery && (contentTypeQuery || productQuery || roleQuery)? ' AND ' : '';
    const contentTypeQuerySeparator = contentTypeQuery && (productQuery || roleQuery) ? ' AND ' : '';
    const productQuerySeparator = productQuery && roleQuery ? ' AND ' : '';

    const query = `${featureQuery}${featureQuerySeparator}${contentTypeQuery}${contentTypeQuerySeparator}${productQuery}${productQuerySeparator}${roleQuery}`;
    return { aq: query };
  }

  /**
   * handleCoveoService is a method that handles fetching browse cards content using CoveoDataService.
   * @returns {Promise<Array>} - A promise resolving to an array of browse cards data.
   */
  const handleCoveoService = () => {
    const facets = [
      ...(param.contentType
        ? [{ id: "el_contenttype", type: "specific", currentValues: param.contentType }]
        : []),
      ...(param.product
        ? [{ id: "el_product", type: "specific", currentValues: param.product }]
        : []),
      ...(param.role
        ? [{ id: "el_role", type: "specific", currentValues: param.role }]
        : [])
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
          ...(param.sortBy ? {sortCriteria: param.sortBy} : ''),
          ...(param.feature ? constructCoveoAdvancedQuery() : ''),
          ...(!param.feature ? { facets: constructCoveoFacet(facets) } : '')          
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
  }
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
        reject(new Error('An Error Occured'));
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
      [CONTENT_TYPES.COURSE.MAPPING_KEY]: handleCoveoService,
      [CONTENT_TYPES.TUTORIAL.MAPPING_KEY]: handleCoveoService,
      [CONTENT_TYPES.EVENT.MAPPING_KEY]: handleCoveoService,
      [CONTENT_TYPES.CERTIFICATION.MAPPING_KEY]: handleCoveoService,
      [CONTENT_TYPES.TROUBLESHOOTING.MAPPING_KEY]: handleCoveoService,
      [CONTENT_TYPES.DOCUMENTATION.MAPPING_KEY]: handleCoveoService,
      [CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY]: handleLiveEventsService,
      [CONTENT_TYPES.COMMUNITY.MAPPING_KEY]: handleCoveoService,
      [CONTENT_TYPES.INSTRUCTOR_LED_TRANING.MAPPING_KEY]: handleADLSService,
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
    const service = handleCoveoService; //Array.isArray(contentType) ? handleCoveoService : getServiceForContentType(contentType?.toLowerCase());
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
