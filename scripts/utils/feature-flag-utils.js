import { getMetadata } from '../lib-franklin.js';

export default function isFeatureEnabled(name) {
  return getMetadata('feature-flags')
    .split(',')
    .map((t) => t.trim())
    .includes(name);
}
