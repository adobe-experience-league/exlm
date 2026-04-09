import { getPathDetails } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';

const authEventType = 'REQUEST_AUTH_STATE';
const routeChangeEventType = 'ROUTE_CHANGE';

const { lang } = getPathDetails();

/**
 * This function gets the IMS info.
 * @returns {Promise<IMSInfo>}
 */
async function getIMSInfo() {
  const isAuthenticated = await isSignedInUser();
  let imsToken;
  let imsProfile;
  if (isAuthenticated) {
    imsToken = await defaultProfileClient.getIMSAccessToken();
    imsProfile = await defaultProfileClient.getIMSProfile();
  }
  return {
    isAuthenticated,
    imsToken,
    imsProfile,
    locale: lang,
  };
}

/**
 * This function listens to messages from iframe.
 * - REQUEST_AUTH_STATE: responds with IMS auth info
 * - ROUTE_CHANGE: updates the browser URL to reflect the iframe's current path
 * @param {HTMLIFrameElement} iframe
 * @param {string} basePath - the EXL page path that hosts the iframe (e.g. /en/tools/commerce-storefront)
 */
function listenToMessages(iframe, basePath) {
  const iframeOrigin = new URL(iframe.src).origin;
  window.addEventListener('message', (event) => {
    if (event.origin !== iframeOrigin) return;

    if (event.data?.type === authEventType) {
      getIMSInfo().then((payload) => {
        event.source.postMessage(
          {
            type: 'AUTH_STATE_RESPONSE',
            requestId: event.data?.requestId,
            payload,
          },
          event.origin,
        );
      });
    }

    if (event.data?.type === routeChangeEventType) {
      const iframePath = event.data?.path || '';
      // Normalize: basePath has no trailing slash; iframePath starts with /
      const normalizedPath = iframePath.startsWith('/') ? iframePath : `/${iframePath}`;
      const newUrl = `${basePath}${normalizedPath === '/' ? '' : normalizedPath}`;
      if (window.location.pathname !== newUrl) {
        window.history.pushState({ iframePath }, '', newUrl);
      }
    }
  });

  // Restore iframe to deep-linked path when the user navigates via browser back/forward
  window.addEventListener('popstate', (event) => {
    const restoredPath = event.state?.iframePath;
    if (restoredPath !== undefined) {
      const iframeUrl = new URL(iframe.src);
      iframeUrl.pathname = restoredPath || '/';
      iframe.src = iframeUrl.toString();
    }
  });
}

/**
 * Extracts the iframe's initial deep-link sub-path from the current browser URL.
 * If the page is at /en/tools/commerce-storefront/some/page, returns /some/page.
 * @param {string} basePath
 * @returns {string}
 */
function getDeepLinkPath(basePath) {
  const { pathname } = window.location;
  if (pathname.startsWith(basePath) && pathname.length > basePath.length) {
    return pathname.slice(basePath.length);
  }
  return '';
}

export default function decorate(block) {
  const props = [...block.children].map((row) => row.firstElementChild);
  const appUrl = props[0].textContent.trim();
  const iframe = document.createElement('iframe');

  // The base path is the current page's pathname (strip any deep-link suffix that may
  // already be in the URL from a shared/bookmarked deep link).
  // We use the appUrl's pathname as a hint for how deep the iframe routes can go,
  // but the simplest safe default is the page's own canonical path.
  const basePath = window.location.pathname.replace(/\/$/, '');

  // If the current URL already contains a deep-link path beyond what the iframe's
  // origin serves at its root, seed the iframe src with that sub-path.
  const deepPath = getDeepLinkPath(basePath);
  const initialUrl = new URL(appUrl);
  if (deepPath) {
    initialUrl.pathname = deepPath;
  }

  iframe.src = initialUrl.toString();
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.style.border = 'none';
  block.textContent = '';
  block.append(iframe);
  listenToMessages(iframe, basePath);
}
