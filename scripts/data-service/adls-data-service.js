import { ADLS } from '../session-keys.js';

/**
 * ADLSDataService class for fetching data from ADLS Service API.
 */
export default class ADLSDataService {
  /**
   * Creates an instance of ADLSDataService.
   * @param {Object} dataSource - The data source configuration for ADLS Data Service.
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
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
      const urlWithParams = `${this.dataSource.url}?${this.dataSource.param.toString()}`;
      const response = await fetch(urlWithParams, {
        method: 'GET'
      });
      const data = await response.json();
      sessionStorage.setItem(ADLS, JSON.stringify(data));
      return data;
    } catch (error) {
      sessionStorage.removeItem(ADLS);
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
  }
}