import { getConfig } from '../../scripts.js';

export default async function loadCoveoToken() {
  const { coveoToken } = getConfig();
  return coveoToken;
}
