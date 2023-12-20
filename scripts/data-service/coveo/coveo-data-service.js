// TODO: Add additional methods and headers specific to Coveo Data Service.
import { COVEO_TOKEN } from '../../session-keys.js';
import loadCoveoToken from './coveo-token-service.js';

/**
 * CoveoDataService class for fetching data from a Coveo Data Service.
 */
export default class CoveoDataService {
  /**
   * Creates an instance of CoveoDataService.
   * @param {Object} dataSource - The data source configuration for Coveo Data Service.
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Fetches data from the configured Coveo Data Service.
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  async fetchDataFromSource() {
    try {
      // Load the Coveo Token
      const coveoToken = await loadCoveoToken();
      // Send a POST request to the Coveo Data Service
      const response = await fetch(this.dataSource.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${coveoToken}`,
        },
        body: JSON.stringify(this.dataSource.param),
      });
      if (response.status === 200) {
        const data = await response.json();
        return data || [];
      }

      if (response.status === 419) {
        sessionStorage.removeItem(COVEO_TOKEN);
      }

      return null;
    } catch (error) {
      throw new Error(error);
    }
  }
}
