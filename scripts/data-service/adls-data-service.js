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
      console.log("Data Source URL");
      console.log(this.dataSource.url);
      console.log(this.dataSource.param);
      const urlWithParams = `${this.dataSource.url}?${this.dataSource.param.toString()}`;
      console.log(urlWithParams);
      const response = await fetch(turlWithParams, {
        method: 'GET'
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