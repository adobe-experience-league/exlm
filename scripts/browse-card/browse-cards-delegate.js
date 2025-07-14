import CoveoDataService from '../data-service/coveo/coveo-data-service.js';
import UpcomingEventsDataService from '../data-service/upcoming-events-data-service.js';
import ADLSDataService from '../data-service/adls-data-service.js';
import BrowseCardsCoveoDataAdaptor from './browse-cards-coveo-data-adaptor.js';
import BrowseCardsUpcomingEventsAdaptor from './browse-cards-upcoming-events-adaptor.js';
import BrowseCardsADLSAdaptor from './browse-cards-adls-adaptor.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';
import PathsDataService from '../data-service/paths-data-service.js';
import { URL_SPECIAL_CASE_LOCALES, getConfig, getPathDetails } from '../scripts.js';
import { getExlPipelineDataSourceParams } from '../data-service/coveo/coveo-exl-pipeline-helpers.js';
import { RECOMMENDED_COURSES_CONSTANTS } from './browse-cards-constants.js';
import { createDateCriteria } from './browse-card-utils.js';

const { upcomingEventsUrl, adlsUrl, pathsUrl } = getConfig();

const { lang } = getPathDetails();

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
   * Handles Coveo data service to fetch card data.
   * @returns {Array} Array of card data.
   * @throws {Error} Throws an error if an issue occurs during data fetching.
   * @private
   */
  const handleCoveoService = async () => {
    const { contentType } = param;

    if (contentType?.includes(CONTENT_TYPES.COMMUNITY.MAPPING_KEY)) {
      if (param?.role) {
        param.role = [];
      }
      if (!param?.dateCriteria) {
        param.dateCriteria = createDateCriteria(['within_one_year']);
      }
    }

    const dataSource = getExlPipelineDataSourceParams(param, fieldsToInclude);
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
   * Handles Upcoming Events data service to fetch card data.
   * @returns {Array} Array of card data.
   * @throws {Error} Throws an error if an issue occurs during data fetching.
   * @private
   */
  const handleUpcomingEventsService = async () => {
    const upcomingEventsService = new UpcomingEventsDataService(upcomingEventsUrl);
    const events = await upcomingEventsService.fetchDataFromSource();
    if (!events) {
      throw new Error('An error occurred');
    }
    if (events?.length) {
      return BrowseCardsUpcomingEventsAdaptor.mapResultsToCardsData(events);
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
    const languageParam = URL_SPECIAL_CASE_LOCALES.get(lang) || lang;
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
      [CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY]: handleUpcomingEventsService,
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
