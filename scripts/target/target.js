import { getCookie, getConfig } from '../scripts.js';
import getEmitter from '../../scripts/events.js';

const targetEventEmitter = getEmitter('loadTargetBlocks');

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

/**
 * This function fetches the target data based on the given criteria id.
 * If the criteria id is not provided, it returns the entire target data.
 *
 * @param {string} criteria - The criteria id to fetch the target data
 * @returns {Promise}
 */
export function getTargetData(criteria) {
  return new Promise((resolve) => {
    if (!criteria) resolve(window?.exlm.targetData);
    else {
      window.exlm?.targetData?.forEach((data) => {
        if (data?.meta.scope === criteria) resolve(data);
      });
      resolve(null);
    }
  });
}

/**
 * Listens for the target-recs-ready event to fetch the content as per the given criteria
 * @param {string} criteriaId - The criteria id to listen for
 * @returns {Promise}
 */
export async function handleTargetEvent() {
  return new Promise((resolve) => {
    function targetEventHandler(event) {
      if (!window?.exlm?.targetData) window.exlm.targetData = [];
      if (!window?.exlm?.targetData.filter((data) => data?.meta?.scope === event?.detail?.meta?.scope).length) {
        window.exlm.targetData.push(event.detail);
      }
      resolve(true);
    }
    document.addEventListener('target-recs-ready', targetEventHandler);
    resolve(false);
  });
}

/**
 * Check if target has loaded
 * @returns {Promise}
 */
async function loadTargetData() {
  return new Promise((resolve) => {
    document.addEventListener(
      'web-sdk-send-event-complete',
      (event) => {
        try {
          if (
            event.detail.$type === 'adobe-alloy.send-event-complete' &&
            event.detail.$rule.name === 'AT: PHP: Handle response propositions'
          ) {
            handleTargetEvent().then(() => {
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
 * Check if the user has accepted the cookie policy for target
 * @returns {boolean}
 */
export function isTargetCookieEnabled() {
  const { cookieConsentName } = getConfig();
  const value = getCookie(cookieConsentName);
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
export async function checkTargetSupport() {
  if (isTargetCookieEnabled()) {
    try {
      const isTargetDataLoaded = await loadTargetData();
      return isTargetDataLoaded;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }
  return false;
}

/**
 * Handles the action of a block (new, replace, update) based on the item properties.
 * @param {Object} item - Object representing the block action type and associated block ID.
 */
function handleAction(item) {
    const blockId = item?.blockId;
    if (blockId) {
        const blockElem = document.querySelector(`#${blockId}`);
        switch (item.mode) {
            case "new":
                console.log("New", item.blockId);
                break;
            case "replace":
                console.log("Replace", blockElem);
                break;
            case "update":
                console.log("Update", blockElem);
                targetEventEmitter.set('blockId', item.blockId);
                break;
        }
    }
}

/**
 * Revises the DOM blocks by removing and processing the target array.
 * @param {Array} targetArray - Array of target elements defines the blockId and scope.
 * @param {NodeList} blocks - NodeList of existing DOM block elements to compare with.
 */
function reviseBlocks(targetArray, blocks) {
    const blockIds = new Set(targetArray.map(item => item.blockId));

    blocks.forEach(blockElem => {
        if (!blockIds.has(blockElem.id)) blockElem.remove();
    });

    targetArray.forEach(handleAction);
}

/**
 * Fetches target data and maps it to the appropriate DOM components for processing.
 * It determines whether to update, replace, or add new blocks to the DOM.
 */
export async function mapComponentsToTarget() {
    const main = document.querySelector('main');
    const blocks = main.querySelectorAll('.recommended-content, .recently-reviewed');
    const targetData = await getTargetData();

    if (targetData.length) {
        const targetArray = targetData.map(({ meta }) => {
            const { scope, 'criteria.title': criteriaTitle } = meta;
            const indexMatch = scope.match(/-(\d+)$/);
            const targetIndex = indexMatch ? indexMatch[1] - 1 : null;
            const blockElement = blocks[targetIndex];
            const blockId = blockElement?.id;
            const blockName = blockElement?.dataset.blockName;

            const mode = blockId
                ? (criteriaTitle === 'exl-php-recently-viewed-content' && blockName === 'recently-reviewed') ||
                  (criteriaTitle !== 'exl-php-recently-viewed-content' && blockName === 'recommended-content')
                    ? "update"
                    : "replace"
                : "new";

            return { blockId, scope, mode };
        });

        reviseBlocks(targetArray, blocks);
    }
}
