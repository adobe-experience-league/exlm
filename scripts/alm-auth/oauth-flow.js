/**
 * ALM OAuth Flow
 * Handles OAuth authentication with Adobe Learning Manager
 */

import { setALMCookie } from './cookie-utils.js';

// ALM Configuration
const ALM_CONFIG = {
  clientId: '8abd1228-a8f3-4aab-87d1-6eb12bab32b6',
  account: '136804',
  authEndpoint: 'https://learningmanager.adobe.com/oauth/o/authorize',
  tokenEndpoint: 'https://51837-570cornsilkbat-qa.adobeioruntime.net/api/v1/web/alm/authentication',
  scope: 'learner:read,learner:write',
  tokenExpiryMinutes: 10,
};

/**
 * Start OAuth flow by redirecting to ALM authorization endpoint
 */
export function startOAuthFlow() {
  const redirectUri = `${window.location.origin + window.location.pathname}?ims=prod`;

  const authUrl = new URL(ALM_CONFIG.authEndpoint);
  authUrl.searchParams.set('client_id', ALM_CONFIG.clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', ALM_CONFIG.scope);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('account', ALM_CONFIG.account);
  authUrl.searchParams.set('logoutAfterAuthorize', 'false');

  window.location.replace(authUrl.toString());
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from OAuth callback
 */
export async function exchangeCodeForToken(code) {
  try {
    const redirectUri = window.location.origin + window.location.pathname;

    // Create URL with query parameters
    const authUrl = new URL(ALM_CONFIG.tokenEndpoint);
    authUrl.searchParams.set('code', code);
    authUrl.searchParams.set('redirect_uri', redirectUri);

    const response = await fetch(authUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const tokenResponse = await response.json();

    // Store the access token in both cookies AND sessionStorage for backward compatibility
    const tokenExpiryDays = ALM_CONFIG.tokenExpiryMinutes / (60 * 24);
    
    // Store in cookies (primary storage)
    setALMCookie('alm_access_token', tokenResponse.access_token, tokenExpiryDays);
    if (tokenResponse.user_id) {
      setALMCookie('alm_user_id', tokenResponse.user_id, tokenExpiryDays);
    }
    if (tokenResponse.user_role) {
      setALMCookie('alm_user_role', tokenResponse.user_role, tokenExpiryDays);
    }
    
    // Also store in sessionStorage for backward compatibility with existing code
    try {
      sessionStorage.setItem('alm_access_token', tokenResponse.access_token);
      if (tokenResponse.user_id) {
        sessionStorage.setItem('alm_user_id', tokenResponse.user_id);
      }
      if (tokenResponse.user_role) {
        sessionStorage.setItem('alm_user_role', tokenResponse.user_role);
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('[ALM Auth] Could not store in sessionStorage:', e);
    }

    // Authentication successful - Remove code parameter from URL and reload to clean up
    const url = new URL(window.location);
    ['code', 'state', 'PRIME_BASE'].forEach((param) => url.searchParams.delete(param));
    
    window.location.replace(url.toString());
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('[ALM Auth] Token exchange failed:', error);
  }
}
