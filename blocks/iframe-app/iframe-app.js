import { getPathDetails } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';

const authEventType = 'REQUEST_AUTH_STATE';

const { lang } = getPathDetails();

async function getIMSInfo() {
  const isAuthenticated = await isSignedInUser();
  let imsToken;
  let imsProfile;
  if (isAuthenticated) {
    imsToken = await defaultProfileClient.getIMSaccessToken();
    imsProfile = await defaultProfileClient.getIMSProfile();
  }
  return {
    isAuthenticated,
    imsToken,
    imsProfile,
    locale: lang,
  };
}

function listenToMessages(iframe) {
  window.addEventListener('message', (event) => {
    if (event.origin === new URL(iframe.src).origin && event.data.type === authEventType) {
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
  });
}

export default function decorate(block) {
  const props = [...block.children].map((row) => row.firstElementChild);
  const appUrl = props[0].textContent;
  const iframe = document.createElement('iframe');
  iframe.src = appUrl;
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.style.border = 'none';
  block.textContent = '';
  block.append(iframe);
  listenToMessages(iframe);
}
