import { getConfig } from '../scripts.js';

/**
 * @typedef {Object} ALMQueryParams
 * @property {number} noOfResults - Number of results to fetch
 * @property {string|Array<string>} [contentType] - Content type filter (alm-cohort or alm-course)
 * @property {string} [sort] - Sort order
 * @property {string} [tagName] - Tag filter
 */

/**
 * ALMDataService class for fetching data from ALM (Adobe Learning Manager) API.
 * Handles API communication with Adobe Learning Manager to retrieve learning objects.
 * 
 * @class ALMDataService
 * @example
 * const service = new ALMDataService({
 *   noOfResults: 10,
 *   contentType: 'alm-cohort'
 * });
 * const data = await service.fetchDataFromSource();
 */
export default class ALMDataService {
  /**
   * Learning object types supported by ALM API
   * @private
   */
  static LO_TYPES = {
    LEARNING_PROGRAM: 'learningProgram',
    COURSE: 'course',
  };

  /**
   * Default sort order for ALM API queries
   * @private
   */
  static DEFAULT_SORT = 'name';

  /**
   * Creates an instance of ALMDataService.
   * @param {ALMQueryParams} queryParams - Query parameters for ALM API request
   */
  constructor(queryParams) {
    this.queryParams = queryParams;
    this.config = getConfig().alm;
  }

  /**
   * Builds URL search parameters for ALM API request
   * @private
   * @returns {URLSearchParams} Constructed URL search parameters
   */
  buildUrlParams() {
    const { noOfResults, sort } = this.queryParams;
    const params = new URLSearchParams();

    // Set result limit
    params.append('page[limit]', noOfResults || 10);

    // Add sort parameter
    params.append('sort', sort || ALMDataService.DEFAULT_SORT);

    // Add enforced fields and includes for comprehensive data
    params.append('enforcedFields[learningObject]', 'extensionOverrides');
    params.append('include', 'instances.enrollment.loResourceGrades,instances.loResources.resources,instances.badge,supplementaryResources,enrollment.loResourceGrades,skills.skillLevel.skill');

    return params;
  }

  /**
   * Builds request body with filters for ALM API POST request
   * @private
   * @returns {Object} Request body object
   */
  buildRequestBody() {
    const { contentType, tagName } = this.queryParams;
    const { catalogIds } = this.config;

    // Determine learning object types - support both course and cohort
    const loTypes = ALMDataService.determineLearningObjectTypes(contentType);


    const body = {
      'filter.loTypes': loTypes,
      'filter.learnerState': ['notenrolled', 'enrolled', 'started', 'completed'],
      'filter.ignoreEnhancedLP': false,
      'filter.recommendationProducts': [{ name: 'Acrobat', levels: [] }],
    };

    // Add catalog IDs if configured
    if (catalogIds) {
      body['filter.catalogIds'] = Array.isArray(catalogIds) ? catalogIds : [catalogIds];
    }

    // Add tag filter if provided
    if (tagName) {
      body['filter.tagName'] = tagName;
    }


    return body;
  }

  /**
   * Determines the ALM learning object types from content type(s)
   * Supports both single and multiple content types
   * @private
   * @param {string|Array<string>} contentType - Content type identifier(s)
   * @returns {Array<string>} Array of learning object types for ALM API
   */
  static determineLearningObjectTypes(contentType) {
    const types = Array.isArray(contentType) ? contentType : [contentType];
    const loTypes = [];

    types.forEach((type) => {
      const normalizedType = type?.toLowerCase().trim();
      if (normalizedType === 'alm-cohort' && !loTypes.includes('learningProgram')) {
        loTypes.push('learningProgram');
      } else if (normalizedType === 'alm-course' && !loTypes.includes('course')) {
        loTypes.push('course');
      }
    });

    // Default to course if no valid types found
    return loTypes.length > 0 ? loTypes : ['course'];
  }

  /**
   * Determines the ALM learning object type from content type (legacy method)
   * @deprecated Use determineLearningObjectTypes instead
   * @private
   * @param {string|Array<string>} contentType - Content type identifier
   * @returns {string} Learning object type for ALM API
   */
  static determineLearningObjectType(contentType) {
    const typeStr = Array.isArray(contentType) ? contentType.join(',') : contentType;
    return typeStr?.includes('alm-cohort')
      ? ALMDataService.LO_TYPES.LEARNING_PROGRAM
      : ALMDataService.LO_TYPES.COURSE;
  }

  /**
   * Builds request headers for ALM API
   * @private
   * @returns {Object} Request headers
   */
  buildRequestHeaders() {
    const { oauthToken } = this.config;
    return {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json;charset=UTF-8',
      'Authorization': oauthToken ? `oauth ${oauthToken}` : '',
    };
  }

  /**
   * Fetches learning objects from Adobe Learning Manager API
   * Makes POST request to ALM API query endpoint with filters in body
   * 
   * @returns {Promise<Array|null>} Array of learning objects or null on error
   * @throws {Error} If API request fails
   */
  async fetchDataFromSource() {
    try {
      const { apiBaseUrl } = this.config;
      const url = new URL(`${apiBaseUrl}/learningObjects/query`);
      url.search = this.buildUrlParams().toString();

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: this.buildRequestHeaders(),
        body: JSON.stringify(this.buildRequestBody()),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`ALM API request failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();

      return responseData;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching ALM data:', error);
      return null;
    }
  }
}
