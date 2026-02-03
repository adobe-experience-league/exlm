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
  static DEFAULT_SORT = '-rating';

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
  buildQueryParams() {
    const { noOfResults, contentType, sort, tagName } = this.queryParams;
    const params = new URLSearchParams();

    // Set result limit
    params.append('page[limit]', noOfResults || 10);

    // Determine learning object type based on content type
    const loType = ALMDataService.determineLearningObjectType(contentType);
    params.append('filter.loTypes', loType);

    // Add sort parameter
    params.append('sort', sort || ALMDataService.DEFAULT_SORT);

    // Add tag filter
    if (tagName) {
      params.append('filter.tagName', tagName);
    }

    // Add fixed filters
    params.append('filter.ignoreEnhancedLP', 'true');

    return params;
  }

  /**
   * Determines the ALM learning object type from content type
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
      Accept: 'application/vnd.api+json',
      Authorization: oauthToken ? `oauth ${oauthToken}` : '',
    };
  }

  /**
   * Extracts data array from ALM API response
   * @private
   * @param {Object} responseData - Response data from ALM API
   * @returns {Array|null} Extracted data array or null
   */
  static extractDataFromResponse(responseData) {
    // ALM API returns standard format: { data: [...], links, meta }
    if (responseData?.data && Array.isArray(responseData.data)) {
      return responseData.data;
    }

    // Fallback for direct array response
    if (Array.isArray(responseData)) {
      return responseData;
    }

    return null;
  }

  /**
   * Fetches learning objects from Adobe Learning Manager API
   * Makes HTTP request to ALM API with configured parameters
   * 
   * @returns {Promise<Array|null>} Array of learning objects or null on error
   * @throws {Error} If API request fails
   */
  async fetchDataFromSource() {
    try {
      const { apiBaseUrl } = this.config;
      const url = new URL(`${apiBaseUrl}/learningObjects`);
      url.search = this.buildQueryParams().toString();

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.buildRequestHeaders(),
      });

      if (!response.ok) {
        throw new Error(`ALM API request failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      return ALMDataService.extractDataFromResponse(responseData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching ALM data:', error);
      return null;
    }
  }
}
