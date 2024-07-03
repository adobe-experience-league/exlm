/**
 * IndustryDataService class for fetching data from Industry Service API.
 */
export default class IndustryDataService {
  /**
   * Creates an instance of IndustryDataService.
   * @param {Object} dataSource - The data source configuration for Industry Data Service.
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Fetches data from the configured Industry Service.
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  async fetchDataFromSource() {
    try {
      const urlWithParams = `${this.dataSource.url}`;
      const response = await fetch(urlWithParams, {
        method: 'GET',
      });
      const data = await response.json();
      return data.data;
    } catch (error) {
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
  }
}
