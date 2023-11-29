import { JWT } from './session-keys.js';

export function signIn() {
  window.adobeIMS?.signIn(); // eslint-disable-line
}

export function signOut() {
  sessionStorage.removeItem(JWT);
  window.adobeIMS?.signOut(); // eslint-disable-line
}
