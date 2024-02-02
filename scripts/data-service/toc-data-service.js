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
  async fetchDataFromSource(tocID, lang) {
    try {
      if (`${TOC}_${tocID}_${lang}` in sessionStorage) {
        return JSON.parse(sessionStorage[`${TOC}_${tocID}_${lang}`]);
      }
      const response = await fetch(`${this.url}${tocID}?lang=${lang}`, {
        method: 'GET',
      });

      const data = await response.json();
      sessionStorage.setItem(`${TOC}_${tocID}_${lang}`, JSON.stringify(data.data));
      return data.data;
    } catch (error) {
      sessionStorage.removeItem(`${TOC}_${tocID}_${lang}`);
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
  }
}
