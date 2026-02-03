/**
 * ALMDataService class for fetching data from ALM (Adobe Learning Manager) API.
 */
export default class ALMDataService {
  // Hardcoded OAuth token for ALM API
  static ALM_OAUTH_TOKEN = '';

  static ALM_API_BASE_URL = 'https://learningmanager.adobe.com/primeapi/v2';

  /**
   * Creates an instance of ALMDataService.
   * @param {Object} dataSource - The data source configuration for ALM Data Service.
   */
  constructor(param) {  
    this.param = param;
  }

  /**
   * Fetches data from the configured ALM Service.
   * Makes actual API call to Adobe Learning Manager (ALM) API.
   * ALM API returns array response format: { data: [...], links, meta }
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  // eslint-disable-next-line class-methods-use-this
  async fetchDataFromSource() {
    try {
      // Construct the API URL with parameters
      const url = new URL(`${ALMDataService.ALM_API_BASE_URL}/learningObjects`);

      // eslint-disable-next-line no-console
      // console.log('param', this.param);
      
      url.searchParams.append('page[limit]', this.param.noOfResults);

      if(this.param.contentType?.includes('alm-cohort')) {
        url.searchParams.append('filter.loTypes', 'learningProgram');
      } else {
        url.searchParams.append('filter.loTypes', 'course');
      }

      url.searchParams.append('sort', '-rating');
      url.searchParams.append('filter.ignoreEnhancedLP', 'true');
      url.searchParams.append('filter.tagName', 'workfront');
      // url.searchParams.append('filter.recommendationProducts', 'analytics');

      // Make the API call
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
          Authorization: `oauth ${ALMDataService.ALM_OAUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ALM API request failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();

      // eslint-disable-next-line no-console
      // console.log('responseData', responseData);

      // ALM API always returns array response: { links, data: [...], meta }
      if (responseData?.data && Array.isArray(responseData.data)) {
        return responseData.data;
      }

      // Fallback for direct array
      if (Array.isArray(responseData)) {
        return responseData;
      }

      return null;
    } catch (error) {
      /* eslint-disable no-console */
      console.error('Error fetching ALM data', error);
      return null;
    }
  }
}
