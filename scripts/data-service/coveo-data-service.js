import { fetchPlaceholders } from '../lib-franklin.js';
import browseCardDataModel from '../data-model/browse-cards-model.js';
import CONTENT_TYPES from '../browse-card/browse-cards-constants.js';

/**
 * CoveoDataService class represents a service for fetching and processing data from a Coveo data source.
 */
export default class CoveoDataService {
  /**
   * Constructor for CoveoDataService.
   * @param {Object} params - Parameters for configuring the data source.
   */
  constructor(params) {
    /**
     * dataSource object contains the URL and parameters for the Coveo data source.
     * @type {Object}
     * @property {string} url - The URL of the Coveo data source.
     * @property {Object} params - Parameters for configuring the data source.
     */
    this.dataSource = {
      url: 'https://run.mocky.io/v3/c8b55a23-6abd-4f17-8f6d-53f298358031',
      params,
    };

    this.convertToTitleCase = this.convertToTitleCase.bind(this);
  }

  /**
   * convertToTitleCase converts a string to title case.
   * @param {string} str - The input string to be converted.
   * @returns {string} - The title case string.
   */
  /* eslint-disable class-methods-use-this */
  convertToTitleCase(str) {
    return str.replace(/\b\w/g, (match) => match.toUpperCase());
  }

  /**
   * constructSearchParams is a method that constructs search parameters for the data source.
   * @returns {URLSearchParams} - The URLSearchParams object containing the constructed parameters.
   */
  constructSearchParams() {
    const urlSearchParams = new URLSearchParams();
    // Sample data for demonstration (modify as needed)
    urlSearchParams.append('sortCriteria', 'relevancy');
    urlSearchParams.append(
      'facets',
      `[{"facetId":"@el_role","field":"el_role","type":"specific","injectionDepth":1000,"filterFacetCount":true,"currentValues":[],"numberOfValues":5,"freezeCurrentValues":false,"preventAutoSelect":false,"isFieldExpanded":false},{"facetId":"@el_contenttype","field":"el_contenttype","type":"hierarchical","injectionDepth":1000,"delimitingCharacter":"|","filterFacetCount":true,"basePath":[],"filterByBasePath":false,"currentValues":[{"value":"${this.dataSource?.params?.contentType}","state":"selected","children":[],"retrieveChildren":true,"retrieveCount":5}],"preventAutoSelect":false,"numberOfValues":1,"isFieldExpanded":false},{"facetId":"el_product","field":"el_product","type":"hierarchical","injectionDepth":1000,"delimitingCharacter":"|","filterFacetCount":true,"basePath":[],"filterByBasePath":false,"currentValues":[],"preventAutoSelect":false,"numberOfValues":10000,"isFieldExpanded":false}]`,
    );
    urlSearchParams.append('numberOfResults', this.dataSource?.params?.noOfResults);
    return urlSearchParams;
  }

  /**
   * fetchDataFromSource is a method that fetches data from the Coveo data source.
   * @returns {Array} - An array of results obtained from the data source.
   */
  async fetchDataFromSource() {
    try {
      const response = await fetch(this.dataSource.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: this.constructSearchParams(),
      });
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * createTags creates an array of tags based on the content type.
   * @param {string} contentType - The content type.
   * @returns {Array} - An array of tags.
   */
  createTags(contentType) {
    const tags = [];

    if (contentType.toUpperCase() === CONTENT_TYPES.COURSE) {
      tags.push({
        icon: 'user',
        text: '',
      });
      tags.push({
        icon: 'book',
        text: `0 ${this.placeholders.lesson}`,
      });
    } else {
      tags.push({
        icon: this.result?.raw?.el_view_status ? 'view' : '',
        text: this.result?.raw?.el_view_status || '',
      });
      tags.push({
        icon: this.result?.raw?.el_reply_status ? 'reply' : '',
        text: this.result?.raw?.el_reply_status || '',
      });
    }
    return tags;
  }

  /**
   * mapResultToCardsDataModel maps a result obtained from the data source to a browse cards data model.
   * @param {Object} result - The result obtained from the data source.
   * @returns {Object} - The mapped browse cards data model.
   */
  mapResultToCardsDataModel(result) {
    /* eslint-disable camelcase */
    const { raw, title, excerpt, uri } = result || {};
    const { contenttype, el_product } = raw || {};

    const contentType = Array.isArray(contenttype) ? contenttype[0] : contenttype;
    const product = Array.isArray(el_product) ? el_product[0] : el_product;
    const tags = this.createTags(contentType);

    return {
      ...browseCardDataModel,
      contentType,
      product,
      title: title || '',
      description: excerpt || '',
      tags,
      copyLink: uri || '',
      viewLink: uri || '',
      viewLinkText: contentType ? this.placeholders[`viewLink${this.convertToTitleCase(contentType)}`] : '',
    };
  }

  /**
   * fetchBrowseCardsContent is a method that fetches and processes data for browse cards.
   * @returns {Array} - An array of data models for browse cards.
   */
  async fetchBrowseCardsContent() {
    this.placeholders = await fetchPlaceholders();
    const data = await this.fetchDataFromSource();
    return data.map((result) => this.mapResultToCardsDataModel(result));
  }
}
