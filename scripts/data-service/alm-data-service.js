/**
 * ALMDataService class for fetching data from ALM (Adobe Learning Manager) API.
 */
export default class ALMDataService {
  /**
   * Creates an instance of ALMDataService.
   * @param {Object} dataSource - The data source configuration for ALM Data Service.
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Fetches data from the configured ALM Service.
   * ALM API returns array response format: { data: [...], links, meta }
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  async fetchDataFromSource() {
    try {
      const urlWithParams = `${this.dataSource.url}?${this.dataSource.param.toString()}`;
      const response = await fetch(urlWithParams, {
        method: 'GET',
      });
      const responseData = await response.json();

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
