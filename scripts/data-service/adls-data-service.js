import { ADLS } from '../session-keys.js';

/**
 * ADLSDataService class for fetching data from ADLS Service API.
 */
export default class ADLSDataService {
  /**
   * Creates an instance of ADLSDataService.
   * @param {Object} dataSource - The data source configuration for ADLS Service.
   */
  constructor(url) {
    this.url = url;
  }

  /**
   * Fetches data from the configured ADLS Service.
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  async fetchDataFromSource() {
    try {
      if (ADLS in sessionStorage) {
        return JSON.parse(sessionStorage[ADLS]);
      }
      const response = await fetch(this.url, {
        method: 'GET',
      });
      const data = await response.json();
      sessionStorage.setItem(ADLS, JSON.stringify(data.results));
      return data.results;
    } catch (error) {
      sessionStorage.removeItem(ADLS);
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
  }
}