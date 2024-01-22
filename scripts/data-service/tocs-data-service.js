import { TOC } from '../session-keys.js';
/**
 * Tocs class for fetching data from a Tocs Service API.
 */
export default class TocDataService {
  /**
   * Creates an instance of Tocs.
   * @param {Object} dataSource - The data source configuration for Tocs Service API.
   */
  constructor(url) {
    this.url = url;
  }

  /**
   * Fetches data from the configured Tocs Service API
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  async fetchDataFromSource(tocID) {
    try {
      if (`${TOC}_${tocID}` in sessionStorage) {
        return JSON.parse(sessionStorage[`${TOC}_${tocID}`]);
      }
      const response = await fetch(`${this.url}${tocID}`, {
        method: 'GET',
      });

      const data = await response.json();
      sessionStorage.setItem(`${TOC}_${tocID}`, JSON.stringify(data.data));
      return data.data;
    } catch (error) {
      sessionStorage.removeItem(`${TOC}_${tocID}`);
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
  }
}
