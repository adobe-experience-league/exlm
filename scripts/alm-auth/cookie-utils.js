/**
 * ALM Cookie Utilities
 * Handles cookie operations for ALM authentication tokens
 */

/**
 * Set a cookie with expiration
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Days until expiration (default 7)
 */
export function setALMCookie(name, value, days = 7) {
  const now = new Date();
  const expiryDate = new Date();
  expiryDate.setTime(now.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${expiryDate.toUTCString()}`;
  
  // Get domain for cookie sharing across subdomains
  const { hostname } = window.location;
  // For localhost, don't set domain. For production, set to root domain
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const domain = isLocalhost ? '' : `;domain=${hostname}`;
  
  // Only use Secure flag on HTTPS (not on localhost/HTTP)
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? ';Secure' : '';
  
  document.cookie = `${name}=${value};${expires};path=/${domain};SameSite=Lax${secureFlag}`;
  
  // Verify cookie was set
  setTimeout(() => {
    const cookieExists = document.cookie.split(';').some((c) => c.trim().startsWith(`${name}=`));
    if (!cookieExists) {
      /* eslint-disable-next-line no-console */
      console.warn(`[ALM Auth] Cookie ${name} was not set`);
    }
  }, 100);
}

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export function getALMCookie(name) {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i += 1) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length);
    }
  }
  
  return null;
}

/**
 * Delete a cookie by name
 * @param {string} name - Cookie name
 */
export function deleteALMCookie(name) {
  const { hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const domain = isLocalhost ? '' : `;domain=${hostname}`;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/${domain}`;
}
