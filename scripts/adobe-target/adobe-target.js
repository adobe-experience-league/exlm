import { buildBlock, decorateBlock, decorateSections, loadBlock } from '../lib-franklin.js';
import getCookie from '../utils/cookie-utils.js';
import getEmitter from '../events.js';

const targetEventEmitter = getEmitter('loadTargetBlocks');
class AdobeTargetClient {
  constructor() {
    this.targetDataEventName = 'target-recs-ready';
    this.cookieConsentName = 'OptanonConsent';
    this.targetCookieEnabled = this.checkIsTargetCookieEnabled();
    const main = document.querySelector('main');
    this.blocks = main.querySelectorAll('.recommended-content, .recently-reviewed');
    this.targetArray = [];
    this.currentItem = null;
  }

  /**
   * Check if the user has accepted the cookie policy for target
   * @returns {boolean}
   */
  checkIsTargetCookieEnabled() {
    const value = getCookie(this.cookieConsentName);
    if (!value || window.hlx.aemRoot) return false;
    const cookieConsentValues = value.split(',').map((part) => part[part.length - 1]);
    if (cookieConsentValues[0] === '1' && cookieConsentValues[1] === '1') {
      return true;
    }
    return false;
  }

  /**
   * Check if the user has accepted the cookie policy for target and loads target
   * @returns {Promise}
   */
  async checkTargetSupport() {
    if (this.targetCookieEnabled) {
      try {
        const isTargetDataLoaded = await this.loadTargetData();
        return isTargetDataLoaded;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
      }
    }
    return false;
  }

  /**
   * Check if target has loaded
   * @returns {Promise}
   */
  async loadTargetData() {
    return new Promise((resolve) => {
      if (window?.exlm?.targetData?.length) resolve(true);
      document.addEventListener(
        'web-sdk-send-event-complete',
        async (event) => {
          try {
            if (
              event.detail.$type === 'adobe-alloy.send-event-complete' &&
              event.detail.$rule.name === 'AT: PHP: Handle response propositions'
            ) {
              await this.handleTargetEvent();
              if (window?.exlm?.targetData?.length) resolve(true);
              else resolve(false);
            } else {
              resolve(false);
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(error);
          }
        },
        { once: true },
      );
      // web-sdk-send-event-complete will be dispatched regardless of target failing or passing
      // This timeout is to handle the case if event not at all dispatched
      setTimeout(() => {
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Listens for the target-recs-ready event to fetch the content as per the given criteria
   * @param {string} criteriaId - The criteria id to listen for
   * @returns {Promise}
   */
  handleTargetEvent() {
    return new Promise((resolve) => {
      function targetEventHandler(event) {
        if (!window?.exlm?.targetData) window.exlm.targetData = [];
        if (!window?.exlm?.targetData.filter((data) => data?.meta?.scope === event?.detail?.meta?.scope).length) {
          window.exlm.targetData.push(event.detail);
        }
        resolve(true);
      }
      document.addEventListener(this.targetDataEventName, targetEventHandler);
      resolve(false);
    });
  }

  /**
   * This function fetches the target data based on the given criteria id.
   * If the criteria id is not provided, it returns the entire target data.
   *
   * @param {string} criteria - The criteria id to fetch the target data
   * @returns {Promise}
   */
  // eslint-disable-next-line class-methods-use-this
  getTargetData(criteria) {
    return new Promise((resolve) => {
      if (!criteria) resolve(window.exlm.targetData);
      else {
        window.exlm.targetData.forEach((data) => {
          if (data?.meta.scope === criteria) resolve(data);
        });
        resolve(null);
      }
    });
  }

  /**
   * Fetches target data and maps it to the appropriate DOM components for processing.
   * It determines whether to update, replace, or add new blocks to the DOM.
   */
  async mapComponentsToTarget() {
    const targetData = await this.getTargetData();

    if (targetData.length) {
      this.targetArray = targetData.map(({ meta }) => {
        const { scope, 'criteria.title': criteriaTitle } = meta;
        const indexMatch = scope.match(/-(\d+)$/);
        const targetIndex = indexMatch ? indexMatch[1] - 1 : null;
        const blockElement = this.blocks[targetIndex];
        let blockId;
        if (blockElement) {
          blockId = `rc-${Math.random().toString(36).substring(2)}`;
          blockElement.id = blockId;
        }
        const blockName = blockElement?.dataset.blockName;

        // eslint-disable-next-line no-nested-ternary
        const mode = blockId
          ? (criteriaTitle === 'exl-php-recently-viewed-content' && blockName === 'recently-reviewed') ||
            (criteriaTitle !== 'exl-php-recently-viewed-content' && blockName === 'recommended-content')
            ? 'update'
            : 'replace'
          : 'new';

        let newBlock = 'recommended-content';
        if (criteriaTitle === 'exl-php-recently-viewed-content') {
          newBlock = 'recently-reviewed';
        }

        return { blockId, scope, mode, criteriaTitle, newBlock };
      });
      this.reviseBlocks();
    }
  }

  /**
   * Revises the DOM blocks by removing and processing the target array.
   * @param {Array} targetArray - Array of target elements defines the blockId and scope.
   * @param {NodeList} blocks - NodeList of existing DOM block elements to compare with.
   */
  reviseBlocks() {
    const blockIds = new Set(this.targetArray.map((item) => item.blockId));

    this.blocks.forEach((blockElem) => {
      if (!blockIds.has(blockElem.id)) blockElem.parentElement.remove();
    });

    document.querySelectorAll('.section:not(.profile-rail-section)').forEach((element) => {
      if (element.textContent.trim() === '') {
        element.remove();
      }
    });

    this.handleAction();
  }

  /**
   * Handles the action of a block (new, replace, update) based on the item properties.
   * @param {Object} item - Object representing the block action type and associated block ID.
   */
  handleAction() {
    this.targetArray.forEach((item) => {
      this.currentItem = item;
      switch (item.mode) {
        case 'new':
          this.createBlock();
          break;
        case 'replace': {
          const blockElem = document.querySelector(`div#${item?.blockId}`);
          this.createBlock(blockElem);
          break;
        }
        case 'update': {
          const blockElem = document.querySelector(`div#${item?.blockId}`);
          blockElem.dataset.targetScope = item.scope;
          targetEventEmitter.set('blockId', item);
          break;
        }
        default:
          break;
      }
    });
  }

  async createBlock(currentBlock) {
    const blockEl = buildBlock(this.currentItem.newBlock, []);
    if (this.currentItem.mode === 'replace' && currentBlock) {
      const containerSection = currentBlock?.parentElement?.parentElement;
      containerSection.replaceChild(blockEl, currentBlock?.parentElement);
    } else {
      const containerSection = document.createElement('div');
      containerSection.classList.add('section', 'profile-section');
      const main = document.querySelector('main');
      main.appendChild(containerSection);
      decorateSections(main);
      containerSection.appendChild(blockEl);
    }
    if (this.currentItem.blockId) blockEl.id = this.currentItem.blockId;
    blockEl.dataset.targetScope = this.currentItem.scope;
    decorateBlock(blockEl);
    await loadBlock(blockEl);
  }
}

const defaultAdobeTargetClient = new AdobeTargetClient();
export default defaultAdobeTargetClient;
