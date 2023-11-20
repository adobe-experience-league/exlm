import { fetchPlaceholders } from '../lib-franklin.js';
import COVEO_API_MOCKS from './coveo-api-mocks.js';
/**
 * Module for handling cards.
 * @module BrowseCardsCoveoSource
 */

/**
 * Creates a new instance of BrowseCardsCoveoSource.
 * @constructor
 * @param {Object} params - Data source parameters for the cards.
 */
export default function BrowseCardsCoveoSource(params) {
  /**
   * Data source for the cards.
   * @type {Object}
   */
  this.dataSource = {
    url: COVEO_API_MOCKS[params.contentType.toUpperCase()],
    params,
  };

  /**
   * Converts a string to title case.
   *
   * @param {string} str - The input string to be converted to title case.
   * @returns {string} - The title case version of the input string.
   */
  this.convertToTitleCase = (str) => str.replace(/\b\w/g, (match) => match.toUpperCase());

  /**
   * Constructs Coveo search parameters for API request.
   * @returns {URLSearchParams} - The URLSearchParams object for Coveo API request.
   */
  this.constructCoveoSearchParams = () => {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('sortCriteria', 'relevancy');
    urlSearchParams.append(
      'facets',
      `[{"facetId":"@el_role","field":"el_role","type":"specific","injectionDepth":1000,"filterFacetCount":true,"currentValues":[],"numberOfValues":5,"freezeCurrentValues":false,"preventAutoSelect":false,"isFieldExpanded":false},{"facetId":"@el_contenttype","field":"el_contenttype","type":"hierarchical","injectionDepth":1000,"delimitingCharacter":"|","filterFacetCount":true,"basePath":[],"filterByBasePath":false,"currentValues":[{"value":"${this.dataSource?.params?.contentType}","state":"selected","children":[],"retrieveChildren":true,"retrieveCount":5}],"preventAutoSelect":false,"numberOfValues":1,"isFieldExpanded":false},{"facetId":"el_product","field":"el_product","type":"hierarchical","injectionDepth":1000,"delimitingCharacter":"|","filterFacetCount":true,"basePath":[],"filterByBasePath":false,"currentValues":[],"preventAutoSelect":false,"numberOfValues":10000,"isFieldExpanded":false}]`,
    );
    urlSearchParams.append('numberOfResults', this.dataSource?.params?.noOfResults);
    return urlSearchParams;
  };

  /**
   * Fetches data from the Coveo data source.
   * @async
   * @function
   * @returns {Array} - An array of results from the data source.
   */
  this.fetchDataFromSource = async () => {
    try {
      const response = await fetch(this.dataSource.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: this.constructCoveoSearchParams(),
      });
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching data', error);
      return [];
    }
  };

  /**
   * Maps a result from the Coveo API source to a common format.
   * @function
   * @param {Object} result - The result to be mapped.
   * @returns {Object} - The mapped result in a common format.
   */
  this.mapResultToCommonFormat = (result) => {
    const contentType = Array.isArray(result?.raw?.type) ? result?.raw?.type[0] : result?.raw?.type;
    const product = Array.isArray(result?.raw?.el_product) ? result?.raw?.el_product[0] : result?.raw?.el_product;
    const tags = [];
    if (contentType === 'Course') {
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
        icon: result?.raw?.el_view_status ? 'view' : '',
        text: result?.raw?.el_view_status || '',
      });
      tags.push({
        icon: result?.raw?.el_reply_status ? 'reply' : '',
        text: result?.raw?.el_reply_status || '',
      });
    }
    return {
      contentType,
      thumbnail: '',
      product,
      title: result?.title,
      description: result?.excerpt,
      tags,
      event: {
        startTime: '',
        endTime: ''
      },
      contributor: {
        thumbnail: '',
        name: '',
        level: '',
        date: '',
      },
      copyLink: result?.uri,
      bookmarkLink: '',
      viewLink: result?.uri,
      viewLinkText: contentType ? this.placeholders[`viewLink${this.convertToTitleCase(contentType)}`] : '',
    };
  };

  /**
   * Fetches content for browse cards.
   * @async
   * @function
   * @returns {Array} - An array of mapped results for browse cards.
   */
  this.fetchBrowseCardsContent = async () => {
    this.placeholders = await fetchPlaceholders();
    const data = await this.fetchDataFromSource();
    return data.map((result) => this.mapResultToCommonFormat(result));
  };
}
