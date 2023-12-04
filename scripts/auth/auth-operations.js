import { COVEO_TOKEN, JWT } from './session-keys.js';

export function signIn() {
  sessionStorage.removeItem(COVEO_TOKEN);
  window.adobeIMS?.signIn();
}

export function signOut() {
  sessionStorage.removeItem(JWT);
  sessionStorage.removeItem(COVEO_TOKEN);
  window.adobeIMS?.signOut();
}
