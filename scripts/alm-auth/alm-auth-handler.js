/**
 * ALM Authentication Handler
 * Main handler for ALM OAuth flow
 */

import { getALMCookie } from './cookie-utils.js';
import { startOAuthFlow, exchangeCodeForToken } from './oauth-flow.js';

/**
 * Handle the complete ALM OAuth flow
 * Checks for existing tokens, handles OAuth callback, or initiates new OAuth flow
 */
export default function handleOAuthFlow() {
  // Check if user is signed in with IMS first
  const isSignedIn = window?.adobeIMS?.isSignedInUser();
  
  if (!isSignedIn) {
    return; // Exit early if user is not signed in
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get('code');
  const error = urlParams.get('error');

  if (error) {
    /* eslint-disable-next-line no-console */
    console.error('[ALM Auth] OAuth error:', error);
    return; // OAuth Error occurred - handle silently
  }

  if (authCode) {
    // We have an auth code, exchange it for access token
    exchangeCodeForToken(authCode);
  } else {
    // Check if we already have a valid token in cookies
    const existingToken = getALMCookie('alm_access_token');
    
    if (!existingToken) {
      startOAuthFlow();
    }
  }
}
