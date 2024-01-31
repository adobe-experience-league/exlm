import { JWT } from '../session-keys.js';
import loadJWT from '../auth/jwt.js';
/**
 * PathsDataService class for fetching data from a  Path Service API.
 */
export default class PathsDataService {
  /**
   * Creates an instance of PathsDataService.
   * @param {Object} dataSource - The data source configuration for ADLS Data Service.
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Fetches data from the configured Paths Service.
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  async fetchDataFromSource() {
    try {
      let auth = '';
      if (JWT in sessionStorage) {
        auth = sessionStorage[JWT];
      } else {
        auth = await loadJWT();
      }

      const urlWithParams = `${this.dataSource.url}?${this.dataSource.param.toString()}`;
      const response = await fetch(urlWithParams, {
        method: 'GET',
        headers: {
          authorization: auth,
          accept: 'application/json',
        },
      });
      const data = await response.json();
      // sessionStorage.setItem(PATHS, JSON.stringify(data));
      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data', error);
      return null;
    }
  }
}
