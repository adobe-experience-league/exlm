export default class ExlClient {
  constructor({ domain = 'https://experienceleague.adobe.com', state } = {}) {
    this.domain = domain;
    this.state = state;
  }

  /**
   * Fetch data from the given endpoint
   * @param {string} endpoint
   * @returns {Promise<any>}
   */
  async fetchData(endpoint) {
    const response = await fetch(`${this.domain}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${endpoint}`);
    }
    return response.json();
  }

  /**
   * Get combined topics and features
   * @param {string} lang
   * @returns {Promise<Object>}
   */
  async getCombinedTopicsAndFeatures(lang = 'en') {
    // the topics don't return any results at the moment
    const [, features] = await Promise.all([
      this.fetchData(`api/topics?page_size=1000&lang=${lang}`),
      this.fetchData(`api/features?page_size=1000&lang=${lang}`),
    ]);

    const combinedData = [...features.data].reduce((acc, item) => {
      acc[item.Name] = item;
      return acc;
    }, {});

    return combinedData;
  }
}
