/**
 * Gainsight API utilities for Adobe Experience League
 * Handles SSO URL construction for seamless authentication
 */

/**
 * Builds a Gainsight SSO URL using SAML authentication
 * 
 * TODO To validate on final production environmnent, where all urls are open, and is not required validation if the user is logged in or not (global footer requirement).
 *
 * The SSO URL pattern allows users to access Gainsight community pages
 * without manual login. If they have a valid SAML session with Adobe IMS,
 * Gainsight automatically authenticates them and redirects to the target page.
 *
 * @param {string} returnUrl - Path within Gainsight (e.g., '/inbox/overview', '/members/username-12345')
 * @param {string} customer - Gainsight customer identifier (e.g., 'adobedx-en-sandbox')
 * @returns {string} Complete SSO URL with SAML authentication
 *
 * @throws {Error} If returnUrl or customer is missing
 *
 * @example
 * // Basic usage
 * buildGainsightSSOUrl('/inbox/overview', 'adobedx-en-sandbox')
 * // Returns: 'https://sso-us-west-2.api.insided.com/auth/saml?customer=adobedx-en-sandbox&returnUrl=/inbox/overview'
 *
 * @example
 * // User profile URL
 * buildGainsightSSOUrl('/members/john-doe-12345', 'adobedx-en-sandbox')
 * // Returns: 'https://sso-us-west-2.api.insided.com/auth/saml?customer=adobedx-en-sandbox&returnUrl=/members/john-doe-12345'
 */
export function buildGainsightSSOUrl(returnUrl, customer) {
  // Validate required parameters
  if (!returnUrl) {
    throw new Error('[Gainsight API] returnUrl is required for SSO URL construction');
  }

  if (!customer) {
    throw new Error('[Gainsight API] customer parameter is required for SSO URL construction');
  }

  // Gainsight SSO base URL (US West region)
  const ssoBaseUrl = 'https://sso-us-west-2.api.insided.com/auth/saml';

  // Build URL with query parameters
  const url = new URL(ssoBaseUrl);
  url.searchParams.set('customer', customer);
  url.searchParams.set('returnUrl', returnUrl);

  return url.href;
}

/**
 * Gainsight SSO Authentication Flow:
 *
 * 1. User clicks link with SSO URL (e.g., My community profile)
 * 2. Browser navigates to: https://sso-us-west-2.api.insided.com/auth/saml?customer=...&returnUrl=...
 * 3. Gainsight SSO service checks for existing SAML session
 * 4. If valid session exists:
 *    - Redirects immediately to returnUrl within Gainsight community
 * 5. If no session or expired:
 *    - Initiates SAML authentication with Adobe IMS
 *    - User may see brief loading screen (usually < 2 seconds)
 *    - After auth, redirects to returnUrl
 *
 * Benefits:
 * - Seamless single sign-on experience
 * - Gainsight handles all authentication complexity
 * - Works across all places where the global header is used **
 * 
 * */

/**
 * Gets Gainsight customer ID from configuration
 *
 * @returns {string|null} Customer ID or null if not configured
 */
export function getGainsightCustomerId() {
  try {
    // Use window.exlm.config if available (set by getConfig in scripts.js)
    const config = window.exlm?.config || {};
    return config.gainsightCustomer || null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Gainsight API] Error getting customer ID:', error);
    return null;
  }
}

/**
 * Checks if Gainsight platform is currently active
 *
 * @returns {boolean} True if Gainsight should be used, false for Khoros
 */
export function isGainsightActive() {
  try {
    const config = window.exlm?.config || {};
    return config.useGainsightCommunity === true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Gainsight API] Error checking platform status:', error);
    return false; // Default to Khoros on error
  }
}
