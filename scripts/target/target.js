import { getCookie, getPathDetails, getConfig } from '../scripts.js';
import { convertToTitleCase } from '../browse-card/browse-card-utils.js';

const { cookieConsentName } = getConfig();

/**
 * Check if the user has accepted the cookie policy for target
 * @returns {boolean}
 */
export function checkTargetSupport() {
  const value = getCookie(cookieConsentName);
  if (!value || window.hlx.aemRoot) return false;
  const cookieConsentValues = value.split(',').map((part) => part[part.length - 1]);
  if (cookieConsentValues[0] === '1' && cookieConsentValues[1] === '1') {
    return true;
  }
  return false;
}

/**
 * Listens for the target-recs-ready event to fetch the content as per the given criteria
 * @param {string} criteriaId - The criteria id to listen for
 * @returns {Promise}
 */
export function handleTargetEvent(criteria) {
  return new Promise((resolve) => {
    window.exlm?.targetData?.forEach((data) => {
      if (data?.meta.scope === criteria) resolve(data);
    });
    function targetEventHandler(event) {
      if (event?.detail?.meta.scope === criteria) {
        document.removeEventListener('target-recs-ready', targetEventHandler);
        if (!window.exlm.targetData) window.exlm.targetData = [];
        window.exlm.targetData.push(event.detail);
        resolve(event.detail);
      }
    }
    document.addEventListener('target-recs-ready', targetEventHandler);
    setTimeout(() => {
      document.removeEventListener('target-recs-ready', targetEventHandler);
      resolve({ data: [] });
    }, 5000);
  });
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
