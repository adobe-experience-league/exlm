import CoveoDataService from '../data-service/coveo/coveo-data-service.js';
import LiveEventsDataService from '../data-service/live-events-data-service.js';
import ADLSDataService from '../data-service/adls-data-service.js';
import BrowseCardsCoveoDataAdaptor from './browse-cards-coveo-data-adaptor.js';
import BrowseCardsLiveEventsAdaptor from './browse-cards-live-events-adaptor.js';
import BrowseCardsADLSAdaptor from './browse-cards-adls-adaptor.js';
import { CONTENT_TYPES, COMMUNITY_SEARCH_FACET, RECOMMENDED_COURSES_CONSTANTS } from './browse-cards-constants.js';
import PathsDataService from '../data-service/paths-data-service.js';
import { getConfig, getPathDetails } from '../scripts.js';

const { coveoSearchResultsUrl, liveEventsUrl, adlsUrl, pathsUrl } = getConfig();

const { lang } = getPathDetails();

// Most of these are copied from an existing call. I do not believe we need all of them, so this list could probably be pruned.
const fieldsToInclude = [
  '@foldingchild',
  '@foldingcollection',
  '@foldingparent',
  'author',
  'author_bio_page',
  'author_name',
  'author_type',
  'authorname',
  'authortype',
  'collection',
  'connectortype',
  'contenttype',
  'date',
  'documenttype',
  'el_author_type',
  'el_contenttype',
  'el_id',
  'el_interactionstyle',
  'el_kudo_status',
  'el_lirank',
  'el_product',
  'el_rank_icon',
  'el_reply_status',
  'el_solution',
  'el_solutions_authored',
  'el_type',
  'el_usergenerictext',
  'el_version',
  'el_view_status',
  'exl_description',
  'exl_thumbnail',
  'filetype',
  'id',
  'language',
  'liMessageLabels',
  'liboardinteractionstyle',
  'licommunityurl',
  'lithreadhassolution',
  'objecttype',
  'outlookformacuri',
  'outlookuri',
  'permanentid',
  'role',
  'source',
  'sourcetype',
  'sysdocumenttype',
  'type',
  'urihash',
  'video_url',
];

const locales = new Map([
  ['es', 'es-ES'],
  ['pt-br', 'pt-BR'],
  ['zh-hans', 'zh-CN'],
  ['zh-hant', 'zh-TW'],
]);
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
        state: value === CONTENT_TYPES.COMMUNITY.MAPPING_KEY ? 'idle' : 'selected',
        ...(value === CONTENT_TYPES.COMMUNITY.MAPPING_KEY ? { children: COMMUNITY_SEARCH_FACET } : []),
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
    const versionQuery = param.version
      ? `AND (${param.version.map((type) => `@el_version=="${type}"`).join(' OR ')})`
      : '';
    const roleQuery = param.role ? `AND (${param.role.map((type) => `@el_role=="${type}"`).join(' OR ')})` : '';
    const levelQuery = param.level ? `AND (${param.level.map((type) => `@el_level=="${type}"`).join(' OR ')})` : '';
    const authorTypeQuery = param.authorType
      ? `AND (${param.authorType.map((type) => `@author_type=="${type}"`).join(' OR ')})`
      : '';
    const query = `${featureQuery} ${contentTypeQuery} ${productQuery} ${versionQuery} ${roleQuery} ${levelQuery} ${authorTypeQuery}`;
    return query;
  };

  /**
   * Constructs advanced query for Coveo data service based on date array.
   * @param {Array} dateCriteria - Array of date values.
   * @returns {string} Advanced query string for date.
   */
  const contructDateAdvancedQuery = (dateCriteria) => `@date==(${dateCriteria.join(',')})`;

  /**
   * Handles Coveo data service to fetch card data.
   * @returns {Array} Array of card data.
   * @throws {Error} Throws an error if an issue occurs during data fetching.
   * @private
   */
  const handleCoveoService = async () => {
    const facets = [
      ...(param.contentType
        ? [
            {
              id: 'el_contenttype',
              type: param.contentType[0] === CONTENT_TYPES.COMMUNITY.MAPPING_KEY ? 'hierarchical' : 'specific',
              currentValues: param.contentType,
            },
          ]
        : []),
      ...(param.product ? [{ id: 'el_product', type: 'specific', currentValues: param.product }] : []),
      ...(param.version ? [{ id: 'el_version', type: 'specific', currentValues: param.version }] : []),
      ...(param.role ? [{ id: 'el_role', type: 'specific', currentValues: param.role }] : []),
      ...(param.authorType ? [{ id: 'author_type', type: 'specific', currentValues: param.authorType }] : []),
      ...(param.level ? [{ id: 'el_level', type: 'specific', currentValues: param.level }] : []),
    ];

    const dataSource = {
      url: coveoSearchResultsUrl,
      param: {
        locale: locales.get(document.querySelector('html').lang) || document.querySelector('html').lang || 'en',
        searchHub: `Experience League Learning Hub`,
        numberOfResults: param.noOfResults,
        excerptLength: 200,
        sortCriteria: param.sortCriteria,
        context: { entitlements: {}, role: {}, interests: {}, industryInterests: {} },
        filterField: '@foldingcollection',
        parentField: '@foldingchild',
        childField: '@foldingparent',
        ...(param.q && !param.feature ? { q: param.q } : ''),
        ...(param.dateCriteria && !param.feature ? { aq: contructDateAdvancedQuery(param.dateCriteria) } : ''),
        ...(!param.feature ? { facets: constructCoveoFacet(facets) } : ''),
        ...(param.feature ? { aq: constructCoveoAdvancedQuery() } : ''),
        fieldsToInclude,
      },
    };
    const coveoService = new CoveoDataService(dataSource);
    const cardData = await coveoService.fetchDataFromSource();
    if (!cardData) {
      throw new Error('An error occurred');
    }
    if (cardData?.results?.length) {
      return BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(cardData.results, cardData.searchUid);
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
    const languageParamValue = lang === 'ja' ? 'Japanese' : 'English';
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('trainingMethod', 'Live Instructor Courses');
    urlSearchParams.append('pageIndex', '1');
    urlSearchParams.append('learningType', 'catalog');
    urlSearchParams.append('language', languageParamValue);
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
   * Constructs search parameters for Paths data service.
   * @returns {URLSearchParams} Constructed URLSearchParams object.
   * @private
   */
  const constructPathsSearchParams = () => {
    const languageParam = locales.get(lang) || lang;
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('page_size', '200');
    urlSearchParams.append('sort', 'Order,Solution,ID');
    urlSearchParams.append('lang', languageParam);
    return urlSearchParams;
  };

  /**
   * Handles Paths data service to fetch card data.
   * @returns {Array} Array of card data.
   * @throws {Error} Throws an error if an issue occurs during data fetching.
   * @private
   */
  const handlePathsService = async () => {
    const dataSource = {
      url: pathsUrl,
      param: constructPathsSearchParams(),
    };
    const pathsService = new PathsDataService(dataSource);
    const cardData = await pathsService.fetchDataFromSource();
    if (!cardData) {
      throw new Error('An error occurred');
    }
    if (cardData.data) {
      return cardData.data;
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
      [CONTENT_TYPES.LIVE_EVENT.MAPPING_KEY]: handleLiveEventsService,
      [CONTENT_TYPES.INSTRUCTOR_LED.MAPPING_KEY]: handleADLSService,
      [RECOMMENDED_COURSES_CONSTANTS.PATHS.MAPPING_KEY]: handlePathsService,
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
