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
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  async fetchDataFromSource() {
    try {
      const urlWithParams = `${this.dataSource.url}?${this.dataSource.param.toString()}`;
      const response = await fetch(urlWithParams, {
        method: 'GET',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      /* eslint-disable no-console */
      console.error('Error fetching ALM data', error);
      return null;
    }
  }
}
