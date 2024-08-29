// import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';

// const authEventType = 'REQUEST_AUTH_STATE';

// TODO : Once Iframe starts working, Use this function to auth details to iframe
// function postMessageToIframe(iframe, message) {
//   window.addEventListener('message', async (event) => {
//     if (event.origin === new URL(iframe.src).origin && event.data.type === authEventType) {
//       // get current auth state
//       const isAuthenticated = await isSignedInUser();

//       let imsToken;
//       let imsProfile;
//       if (isAuthenticated) {
//         // yes, return the whole object response for these two, not just the token and not just the requested profile attributes. Everything.
//         imsToken = adobeIMS.getAccessToken(); // or better add method for this in defaultProfileClient and use it here.
//         imsProfile = await adobeIMS.getProfile(); // or better use defaultProfileClient, do not use the merged profile here. only the IMS profile.
//       }

//       // Send the authenticated state back to the child window
//       event.source.postMessage(
//         {
//           type: 'AUTH_STATE_RESPONSE',
//           requestId: event.data?.payload?.requestId, // Match the request ID if provided
//           payload: {
//             isAuthenticated, // boolean, indicates auth state
//             imsToken,
//             imsProfile,
//             locale: '', // get the current page language code
//           },
//         },
//         event.origin,
//       );
//     }
//   });
// }

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
}
