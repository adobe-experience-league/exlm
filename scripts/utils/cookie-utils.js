export function getCookie(cookieName) {
  const nameEQ = `${cookieName}=`;
  const cookies = decodeURIComponent(document.cookie).split(';');
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
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} expiresInSeconds - Expiration time in seconds (default: 1 day = 86400 seconds)
 */
export function setCookie(name, value, expiresInSeconds = 86400) {
  const expires = new Date();
  expires.setTime(expires.getTime() + expiresInSeconds * 1000);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; expires=${expires.toUTCString()}; path=/${secure}; SameSite=Lax`;
}

/**
 * Delete a cookie by name
 * @param {string} name - Cookie name
 */
export function deleteCookie(name) {
  setCookie(name, '', -1);
}
