import { LIVE_EVENTS } from '../session-keys.js';

/**
 * UpcomingEventsDataService class for fetching data from a Upcoming Events Service API.
 */
export default class UpcomingEventsDataService {
  /**
   * Creates an instance of UpcomingEventsDataService.
   * @param {Object} dataSource - The data source configuration for Upcoming Events Service.
   */
  constructor(url) {
    this.url = url;
  }

  /**
   * Fetches data from the configured Upcoming Events Service.
   *
   * @returns {Promise<Array>} A promise that resolves with an array of data results.
   */
  async fetchDataFromSource() {
    try {
      if (LIVE_EVENTS in sessionStorage) {
        return JSON.parse(sessionStorage[LIVE_EVENTS]);
      }
      const response = await fetch(this.url, {
        method: 'GET',
      });
      const data = await response.json();
      sessionStorage.setItem(LIVE_EVENTS, JSON.stringify(data.eventList.events));
      return data.eventList.events;
    } catch (error) {
      sessionStorage.removeItem(LIVE_EVENTS);
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
  }
}
