import { getConfig } from '../../scripts.js';
import { COVEO_TOKEN } from '../../session-keys.js';

export default async function loadCoveoToken() {
  const { coveoToken } = getConfig();
  sessionStorage.setItem(COVEO_TOKEN, coveoToken);
  return coveoToken;
}
