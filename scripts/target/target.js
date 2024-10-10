import { getCookie, getPathDetails, getConfig } from '../scripts.js';
import { convertToTitleCase } from '../browse-card/browse-card-utils.js';

const { cookieConsentName } = getConfig();

/**
 * Update the copy from the target
 * @param {Object} data
 * @param {HTMLElement} heading
 * @param {HTMLElement} subheading
 * @returns {void}
 */
export function updateCopyFromTarget(data, heading, subheading, taglineCta, taglineText) {
  if (data?.meta?.heading && heading) heading.innerHTML = data.meta.heading;
  if (data?.meta?.subheading && subheading) subheading.innerHTML = data.meta.subheading;
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
  }
  if (taglineText && data?.meta['tagline-text'] && data?.meta['tagline-text'].trim() !== '') {
    taglineText.innerHTML = data.meta['tagline-text'];
  }
}

/**
 * Listens for the target-recs-ready event to fetch the content as per the given criteria
 * @param {string} criteriaId - The criteria id to listen for
 * @returns {Promise}
 */
export async function handleTargetEvent(criteria) {
  if (!window.exlm.targetData) window.exlm.targetData = [];
  return new Promise((resolve) => {
    if (criteria) {
      window.exlm?.targetData?.forEach((data) => {
        if (data?.meta.scope === criteria) resolve(data);
      });
      resolve(null);
      return;
    }
    if (window.exlm?.targetData?.length) {
      resolve(true);
      return;
    }
    function targetEventHandler(event) {
      if (window.exlm?.targetData?.length >= 2) {
        document.removeEventListener('target-recs-ready', targetEventHandler);
      }
      if (!window.exlm.targetData.filter((data) => data?.meta?.scope === event?.detail?.meta?.scope).length) {
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
 * Check if the user has accepted the cookie policy for target and loads target
 * @returns {Promise}
 */
export async function checkTargetSupport() {
  const value = getCookie(cookieConsentName);
  if (!value || window.hlx.aemRoot) return false;
  const cookieConsentValues = value.split(',').map((part) => part[part.length - 1]);
  if (cookieConsentValues[0] === '1' && cookieConsentValues[1] === '1') {
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

export function targetDataAdapter(data, placeholders) {
  const articlePath = `/${getPathDetails().lang}${data?.path}`;
  const fullURL = new URL(articlePath, window.location.origin).href;
  const solutions = data?.product.split(',').map((s) => s.trim());
  return {
    ...data,
    badgeTitle: data?.contentType,
    type: data?.contentType,
    authorInfo: data?.authorInfo || {
      name: [''],
      type: [''],
    },
    product: solutions,
    tags: [],
    copyLink: fullURL,
    bookmarkLink: '',
    viewLink: fullURL,
    viewLinkText: placeholders[`browseCard${convertToTitleCase(data?.contentType)}ViewLabel`]
      ? placeholders[`browseCard${convertToTitleCase(data?.contentType)}ViewLabel`]
      : `View ${data?.contentType}`,
  };
}
