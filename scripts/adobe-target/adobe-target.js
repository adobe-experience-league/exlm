import getEmitter from '../events.js';

const targetEventEmitter = getEmitter('loadTargetBlocks');

function getCookie(cookieName) {
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  for (let i = 0; i < cookies.length; i += 1) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length + 1);
    }
  }
  return null;
}

/**
 * Update the copy from the target
 * @param {Object} data
 * @param {HTMLElement} heading
 * @param {HTMLElement} subheading
 * @returns {void}
 */
export function updateCopyFromTarget(data, heading, subheading, taglineCta, taglineText) {
  if (data?.meta?.heading && heading) heading.innerHTML = data.meta.heading;
  else heading?.remove();
  if (data?.meta?.subheading && subheading) subheading.innerHTML = data.meta.subheading;
  else subheading?.remove();
  if (
    taglineCta &&
    data?.meta['tagline-cta-text'] &&
    data?.meta['tagline-cta-url'] &&
    data.meta['tagline-cta-text'].trim() !== '' &&
    data.meta['tagline-cta-url'].trim() !== ''
  ) {
    taglineCta.innerHTML = `
        <a href="${data.meta['tagline-cta-url']}" title="${data.meta['tagline-cta-text']}">
          ${data.meta['tagline-cta-text']}
        </a>
      `;
  } else {
    taglineCta?.remove();
  }
  if (taglineText && data?.meta['tagline-text'] && data?.meta['tagline-text'].trim() !== '') {
    taglineText.innerHTML = data.meta['tagline-text'];
  } else {
    taglineText?.remove();
  }
  if (!document.contains(taglineCta) && !document.contains(taglineText)) {
    const taglineParentBlock = document.querySelector('.recommended-content-result-text');
    if (taglineParentBlock) {
      taglineParentBlock?.remove();
    }
  }
}

/**
 * Sets target data as a data attribute on the given block element.
 *
 * This function checks if the provided `data` object contains a `meta` property.
 * If the `meta` property exists, it serializes the metadata as a JSON string and
 * adds it to the specified block element as a custom data attribute `data-analytics-target-meta`.
 *
 * @param {Object} data - The data returned from target.
 * @param {HTMLElement} block - The DOM element to which the meta data will be added as an attribute.
 *
 */
export function setTargetDataAsBlockAttribute(data, block) {
  if (data?.meta) {
    block.setAttribute('data-analytics-target-meta', JSON.stringify(data?.meta));
  }
}

class AdobeTargetClient {
  constructor() {
    this.targetData = window.exlm.targetData || [];
    this.targetDataEventName = 'target-recs-ready';
    // getConfig().cookieConsentName - cannot use getConfig because of cyclic dependency
    this.cookieConsentName = 'OptanonConsent';
    this.targetCookieEnabled = this.checkIsTargetCookieEnabled();
    const main = document.querySelector('main');
    this.blocks = main.querySelectorAll('.recommended-content, .recently-reviewed');
    this.targetArray = [];
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
        (event) => {
          try {
            if (
              event.detail.$type === 'adobe-alloy.send-event-complete' &&
              event.detail.$rule.name === 'AT: PHP: Handle response propositions'
            ) {
              this.handleTargetEvent().then(() => {
                if (window?.exlm?.targetData.length) resolve(true);
                else resolve(false);
              });
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
          this.targetData = window.exlm.targetData;
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
  getTargetData(criteria) {
    return new Promise((resolve) => {
      if (!criteria) resolve(this.targetData);
      else {
        this.targetData.forEach((data) => {
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
        blockElement.id = `rc-${Math.random().toString(36).substring(2)}`;
        const blockId = blockElement?.id;
        const blockName = blockElement?.dataset.blockName;

        // eslint-disable-next-line no-nested-ternary
        const mode = blockId
          ? (criteriaTitle === 'exl-php-recently-viewed-content' && blockName === 'recently-reviewed') ||
            (criteriaTitle !== 'exl-php-recently-viewed-content' && blockName === 'recommended-content')
            ? 'update'
            : 'replace'
          : 'new';

        return { blockId, scope, mode };
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
      if (!blockIds.has(blockElem.id)) blockElem.remove();
    });

    this.targetArray.forEach(this.handleAction);
  }

  /**
   * Handles the action of a block (new, replace, update) based on the item properties.
   * @param {Object} item - Object representing the block action type and associated block ID.
   */
  handleAction(item) {
    const blockId = item?.blockId;
    if (blockId) {
      const blockElem = document.querySelector(`div#${blockId}`);
      switch (item.mode) {
        case 'new':
          console.log('New', item.blockId);
          this.createBlock();
          break;
        case 'replace':
          console.log('Replace', blockElem);
          this.createBlock();
          break;
        case 'update':
          console.log('Update', blockElem);
          targetEventEmitter.set('blockId', item.blockId);
          break;
        default:
          break;
      }
    }
  }

  createBlock() {
    console.log(this.targetArray, 'createBlock');
  }
}

const defaultAdobeTargetClient = new AdobeTargetClient();
export default defaultAdobeTargetClient;
