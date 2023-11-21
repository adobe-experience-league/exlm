import CoveoDataService from '../data-service/coveo-data-service.js';
import CONTENT_TYPES from './browse-cards-constants.js';

/**
 * BrowseCardsFacade class provides a facade for fetching card data based on different content types.
 */
export default class BrowseCardsFacade {
  /**
   * Constructor for BrowseCardsFacade.
   * @param {Object} param - Parameters for configuring the browse cards facade.
   */
  constructor(param) {
    this.param = param;
  }

  /**
   * getActionForContentType retrieves the action associated with a specific content type.
   * @param {string} contentType - The content type for which to retrieve the action.
   * @returns {Function} - The action associated with the specified content type.
   */
  getActionForContentType(contentType) {
    const contentTypesActions = {
      [CONTENT_TYPES.COURSE]: this.handleCoveoService,
      [CONTENT_TYPES.TUTORIAL]: this.handleCoveoService,
      [CONTENT_TYPES.ON_DEMAND_EVENT]: this.handleCoveoService,
      [CONTENT_TYPES.CERTIFICATION]: this.handleCoveoService,
      [CONTENT_TYPES.TROUBLESHOOTING]: this.handleCoveoService,
      [CONTENT_TYPES.DOCUMENTATION]: this.handleCoveoService,
      [CONTENT_TYPES.LIVE_EVENT]: this.handleLiveEventService,
      [CONTENT_TYPES.COMMUNITY]: this.handleKhorosService,
      [CONTENT_TYPES.INSTRUCTOR_LED_TRANING]: this.handleADLSCatalogService,
    };

    return contentTypesActions[contentType];
  }

  /**
   * handleCoveoService is an asynchronous method that handles fetching browse cards content using CoveoDataService.
   * @returns {Promise<Array>} - A promise resolving to an array of browse cards data.
   */
  handleCoveoService = async () => {
    const cards = new CoveoDataService(this.param);
    /* eslint-disable no-return-await */
    return await cards.fetchBrowseCardsContent();
  };

  /**
   * fetchCardData is an asynchronous method that fetches card data based on the configured content type.
   * @returns {Promise<Array>|null} - A promise resolving to an array of browse cards data, or null if the content type is not handled.
   */
  async fetchCardData() {
    const { contentType } = this.param;
    const action = this.getActionForContentType(contentType?.toUpperCase());
    if (action) {
      /* eslint-disable no-return-await */
      return await action();
    }
    return null;
  }
}
