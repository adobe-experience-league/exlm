/* eslint-disable no-console */

class AnalyticsQueue {
  constructor() {
    this.queue = [];
    this.isReady = false;
    this.init();
  }

  init() {
    // Listen for the custom event that signals analytics is ready
    window.addEventListener('Analytics:pageDataLayerPushed', () => {
      this.isReady = true;
      this.processAnalyticsEventsQueue();
    });
  }

  /**
   * Add an analytics function call to the queue or execute immediately if ready
   * @param {Function} fn - The analytics function to call
   * @param {Array} args - Arguments to pass to the function
   */
  async add(fn, ...args) {
    if (this.isReady) {
      // If analytics is ready, execute immediately without waiting
      await this.execute(fn, args);
    } else {
      // Otherwise, add to queue
      this.queue.push({ fn, args });
    }
  }

  /**
   * Execute a queued analytics function
   * @param {Function} fn - The function to call
   * @param {Array} args - Arguments to pass to the function
   */
  // eslint-disable-next-line class-methods-use-this
  async execute(fn, args) {
    try {
      if (typeof fn === 'function') {
        await fn(...args);
      } else {
        console.error('Invalid analytics function provided');
      }
    } catch (e) {
      console.error('Error executing analytics function:', e);
    }
  }

  /**
   * Process all queued analytics events
   */
  async processAnalyticsEventsQueue() {
    while (this.queue.length > 0) {
      const { fn, args } = this.queue.shift();
      // eslint-disable-next-line no-await-in-loop
      await this.execute(fn, args);
    }
  }
}

// Create a singleton instance
const analyticsQueue = new AnalyticsQueue();

/**
 * Queue an analytics event to be executed when the data layer is ready
 * @param {Function} fn - The analytics function to execute (e.g., pushStepsStartEvent)
 * @param  {...any} args - Arguments to pass to the analytics function
 *
 * @example
 * import { queueAnalyticsEvent } from './analytics/queue.js';
 * import { pushStepsStartEvent } from './analytics/lib-analytics.js';
 *
 * // Queue a steps start event
 * queueAnalyticsEvent(pushStepsStartEvent, stepInfo);
 */
export async function queueAnalyticsEvent(fn, ...args) {
  await analyticsQueue.add(fn, ...args);
}

/**
 * Signal that analytics is ready and process all queued events
 * This should be called after pushPageDataLayer and loadMartech complete
 */
export function signalReadyforAnalyticsEvents() {
  window.dispatchEvent(new CustomEvent('Analytics:pageDataLayerPushed'));
}
