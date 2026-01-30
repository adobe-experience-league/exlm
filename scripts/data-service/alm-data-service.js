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
   * Simulates a delay to mimic API response time.
   * @param {number} ms - Milliseconds to delay.
   * @returns {Promise} A promise that resolves after the specified delay.
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  async delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Fetches data from the configured ALM Service.
   * Currently returns dummy data with a 5-second delay to mimic API response.
   * ALM API returns array response format: { data: [...], links, meta }
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  async fetchDataFromSource() {
    try {
      // TODO: Replace with actual API call when ready
      // const urlWithParams = `${this.dataSource.url}?${this.dataSource.param.toString()}`;
      // const response = await fetch(urlWithParams, { method: 'GET' });
      // const responseData = await response.json();

      // Simulate 5-second API delay
      await this.delay(5000);

      // Load dummy data
      const dummyDataModule = await import('./alm/alm-dummy-data.js');
      const responseData = dummyDataModule.default;

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
