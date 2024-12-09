import { getMetadata } from '../lib-franklin.js';

export default function isFeatureEnabled(name) {
  return getMetadata('feature-flags')
    .split(',')
    .map((t) => t.toLowerCase().trim())
    .includes(name);
}
