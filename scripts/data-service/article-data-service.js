import { articleUrl } from '../urls.js';
import { fetchPlaceholders } from '../lib-franklin.js';

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

  createViewLinkText() {
    this.viewLinkTextPlaceholder = '';
    if (this.result.contentType === 'Course') {
      this.viewLinkTextPlaceholder = 'viewLinkCourse';
    }
    if (this.result.contentType === 'Tutorial') {
      this.viewLinkTextPlaceholder = 'viewLinkTutorial';
    }
    if (this.result.contentType === 'Article') {
      this.viewLinkTextPlaceholder = 'viewLinkArticle';
    }
    if (this.result.contentType === 'Documentation') {
      this.viewLinkTextPlaceholder = 'viewLinkDocumentation';
    }
    if (this.result.contentType === 'Event') {
      this.viewLinkTextPlaceholder = 'viewLinkEvent';
    }
  }

  createThumbnailURL() {
    let thumbnail = '';
    if (this.result.contentType === 'Course') {
      [, thumbnail] = this.result['Full Meta'].match(/course-thumbnail: (.*)/);
      return thumbnail ? `https://cdn.experienceleague.adobe.com/thumb/${thumbnail.split('thumb/')[1]}` : '';
    }

    if (this.result.contentType === 'Tutorial') {
      const videoUrl = this.result['Full Body'].match(/embedded-video src\s*=\s*['"]?([^'"]*)['"]?/)[1];
      this.result.videoUrl = videoUrl;
      this.result.videoId = videoUrl?.split('/')[4];
      return this.result.videoId ? `https://video.tv.adobe.com/v/${this.result.videoId}?format=jpeg` : '';
    }
    return thumbnail;
  }

  mapResultToCardsData = async (result) => {
    this.result = result;
    this.createViewLinkText();
    const placeholders = await fetchPlaceholders();

    return {
      contentType: result.contentType,
      badgeTitle: result.contentType,
      thumbnail: this.createThumbnailURL(),
      product: result.Solution[0],
      title: result.Title,
      description: result.Description,
      tags: result.Tags,
      copyLink: result.URL,
      bookmarkLink: '',
      viewLink: result.URL,
      viewLinkText: placeholders[this.viewLinkTextPlaceholder]
        ? placeholders[this.viewLinkTextPlaceholder]
        : `View ${this.result.contentType}`,
    };
  };

  handleArticleDataService = async (url) => {
    const cardData = await this.fetchArticleByURL(url);
    return this.mapResultToCardsData(cardData);
  };
}
