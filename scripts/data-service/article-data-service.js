import { articleUrl } from '../urls.js';

/**
 * ArticleDataService class for fetching data from a Article API.
 */
export default class ArticleDataService {
  constructor() {
    this.id = '';
    this.pageContent = '';
  }

  /**
   * Fetch Article data fromcontentTypeD
   * @param {string} id - ID of the content source
   * @returns {Promise<object>} - Promise that resolves to the data results
   */
  async fetchArticleByID() {
    try {
      const response = await fetch(articleUrl + this.id);
      const json = await response.json();
      return json.data;
    } catch (error) {
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
  }

  /**
   * Extract ID of the page from page content
   * @param {string} pageContent - content of the page in string
   * @returns {string} - Id of the page
   */
  extractIdFromPage() {
    return this.pageContent.match(/<meta name="id" content="(.*)">/)[1];
  }

  /**
   * Extract contentType of the page from page content
   * @param {string} pageContent - content of the page in string
   * @returns {string} - contentType of the page
   */
  extractContentTypeFromPage() {
    return this.pageContent.match(/<meta name="coveo-content-type" content="(.*)">/)[1];
  }

  /**
   * Fetch article data from url
   * @param {string} url - Url of the page to fetch the article data from
   * @returns {Promise<object>} - Promise the resolves to the data results
   */
  async fetchArticleByURL(url) {
    try {
      const response = await fetch(url);
      this.pageContent = await response.text();
      this.id = this.extractIdFromPage();
      const data = await this.fetchArticleByID();
      data.contentType = this.extractContentTypeFromPage();
      return data;
    } catch (error) {
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
  }

  handleArticleDataService = async (url) => {
    const cardData = await this.fetchArticleByURL(url);
    return cardData;
  };
}
