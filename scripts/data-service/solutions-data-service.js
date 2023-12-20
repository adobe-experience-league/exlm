import { SOLUTIONS } from '../session-keys.js';
/**
 * Solutions class for fetching data from a Solutions Service API.
 */
export default class SolutionDataService {
  /**
   * Creates an instance of Solutions.
   * @param {Object} dataSource - The data source configuration for Solutions Service API.
   */
  constructor(url) {
    this.url = url;
  }

  /**
   * Fetches data from the configured Solutions Service API
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  async fetchDataFromSource() {
    try {
      if (SOLUTIONS in sessionStorage) {
        return JSON.parse(sessionStorage[SOLUTIONS]);
      }
      const response = await fetch(this.url, {
        method: 'GET',
      });
      const data = await response.json();
      sessionStorage.setItem(SOLUTIONS, JSON.stringify(data.data));
      return data.data;
    } catch (error) {
      sessionStorage.removeItem(SOLUTIONS);
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
  }
}
