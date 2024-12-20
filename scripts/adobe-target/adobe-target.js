import { buildBlock, decorateBlock, decorateSections, loadBlock, updateSectionsStatus } from '../lib-franklin.js';
import getCookie from '../utils/cookie-utils.js';
import getEmitter from '../events.js';
import isFeatureEnabled from '../utils/feature-flag-utils.js';

const targetEventEmitter = getEmitter('loadTargetBlocks');
class AdobeTargetClient {
  constructor() {
    this.targetDataEventName = 'target-recs-ready';
    this.cookieConsentName = 'OptanonConsent';
    if (isFeatureEnabled('browsecardv2')) {
      this.recommendationMarqueeScopeName = 'exl-hp-auth-recs-1';
    }
    this.targetCookieEnabled = this.checkIsTargetCookieEnabled();
    this.blocks = [];
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
      if (window?.exlm?.targetData?.length || window?.exlm?.recommendationMarqueeTargetData?.length) resolve(true);

      function handleTargetError(event) {
        if (event) {
          // eslint-disable-next-line no-console
          console.error('Error loading target data', event?.detail);
          resolve(false);
        }
      }

      async function handleTargetLoad(event) {
        document.removeEventListener('web-sdk-send-event-error', handleTargetError);
        try {
          if (
            event.detail.$type === 'adobe-alloy.send-event-complete' &&
            event.detail.$rule.name === 'AT: PHP: Handle response propositions'
          ) {
            await this.handleTargetEvent();
            if (window?.exlm?.targetData?.length || window?.exlm?.recommendationMarqueeTargetData?.length)
              resolve(true);
            else resolve(false);
          } else {
            resolve(false);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(error);
        }
      }

      document.addEventListener('web-sdk-send-event-error', handleTargetError, { once: true });
      document.addEventListener('web-sdk-send-event-complete', handleTargetLoad.bind(this), { once: true });
    });
  }

  /**
   * Listens for the target-recs-ready event to fetch the content as per the given criteria
   * @param {string} criteriaId - The criteria id to listen for
   * @returns {Promise}
   */
  handleTargetEvent() {
    return new Promise((resolve) => {
      const targetEventHandler = (event) => {
        if (!window?.exlm?.targetData) window.exlm.targetData = [];
        if (!window?.exlm?.recommendationMarqueeTargetData) window.exlm.recommendationMarqueeTargetData = [];
        if (!window?.exlm?.targetData.filter((data) => data?.meta?.scope === event?.detail?.meta?.scope).length) {
          // TODO - remove dependecy on feature flag once browse card v2 theme is live
          if (isFeatureEnabled('browsecardv2') && event?.detail?.meta?.scope === this.recommendationMarqueeScopeName) {
            if (
              !window?.exlm?.recommendationMarqueeTargetData.filter(
                (data) => data?.meta?.scope === event?.detail?.meta?.scope,
              ).length
            ) {
              window.exlm.recommendationMarqueeTargetData.push(event.detail);
            }
          } else {
            window.exlm.targetData.push(event.detail);
          }
        }
        resolve(true);
      };
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
      if (!criteria) {
        const data = window.exlm?.targetData;
        resolve(data);
      } else if (criteria === this.recommendationMarqueeScopeName) {
        const [data] = window.exlm.recommendationMarqueeTargetData || [];
        resolve(data);
      } else {
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
    const main = document.querySelector('main');
    this.blocks = main.querySelectorAll(
      '.recommended-content:not(.recommended-content.coveo-only), .recently-reviewed, .recommendation-marquee:not(.recommendation-marquee.coveo-only)',
    );
    const targetData = await this.getTargetData();
    const marqueeTargetData = await this.getTargetData(this.recommendationMarqueeScopeName);
    let blockRevisionNeeded = false;
    if (targetData.length) {
      blockRevisionNeeded = true;
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
        let mode = blockId
          ? (criteriaTitle === 'exl-php-recently-viewed-content' && blockName === 'recently-reviewed') ||
            (criteriaTitle !== 'exl-php-recently-viewed-content' && blockName === 'recommended-content')
            ? 'update'
            : 'replace'
          : 'new';
        if (blockName === 'recommendation-marquee') {
          mode = 'replace'; // If authored block is marquee, replace it with recommended-block as, this block is not the first one and marquee is always reserved as first block.
        }
        let newBlock = 'recommended-content';
        if (criteriaTitle === 'exl-php-recently-viewed-content') {
          newBlock = 'recently-reviewed';
        }

        return { blockId, scope, mode, criteriaTitle, newBlock };
      });
    }
    if (marqueeTargetData?.meta) {
      blockRevisionNeeded = true;
      const [firstBlockEl] = this.blocks; // Marquee should always be the first block.
      let marqueeBlockId = '';
      if (firstBlockEl) {
        marqueeBlockId = `rm-${Math.random().toString(36).substring(2)}`;
        firstBlockEl.id = marqueeBlockId;
      }
      const blockName = firstBlockEl?.dataset.blockName;
      const { 'criteria.title': criteriaTitle, scope } = marqueeTargetData.meta;
      const mode = blockName === 'recommendation-marquee' ? 'update' : 'replace';
      const newBlock = 'recommendation-marquee';
      this.targetArray.unshift({ blockId: marqueeBlockId, scope, mode, criteriaTitle, newBlock });
    }
    if (blockRevisionNeeded) {
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
      if (!blockIds.has(blockElem.id)) {
        const section = blockElem.closest('.section');
        blockElem.parentElement.remove();
        if (section?.children?.length === 0) section.remove();
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
    const main = document.querySelector('main');
    let blockEl;
    if (this.currentItem.newBlock === 'recently-reviewed') {
      blockEl = buildBlock(this.currentItem.newBlock, []);
    } else {
      blockEl = buildBlock(
        this.currentItem.newBlock,
        Array.from({ length: 13 }, () => ['']),
      );
    }
    if (this.currentItem.mode === 'replace' && currentBlock) {
      const containerSection = currentBlock?.parentElement?.parentElement;
      containerSection.replaceChild(blockEl, currentBlock?.parentElement);
    } else {
      const containerSection = document.createElement('div');
      containerSection.classList.add('section', 'profile-section');
      main.appendChild(containerSection);
      decorateSections(main);
      containerSection.appendChild(blockEl);
    }
    if (this.currentItem.blockId) blockEl.id = this.currentItem.blockId;
    blockEl.dataset.targetScope = this.currentItem.scope;
    decorateBlock(blockEl);
    await loadBlock(blockEl);
    updateSectionsStatus(main);
  }
}

const defaultAdobeTargetClient = new AdobeTargetClient();
export default defaultAdobeTargetClient;
