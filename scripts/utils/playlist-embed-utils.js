import {
  PLAYLIST_EMBED_PARAM,
  PLAYLIST_EMBED_BODY_CLASS,
  PLAYLIST_EMBED_PARENT_ORIGIN_PATTERNS,
  PLAYLIST_PATH_RE,
} from './playlist-embed-config.js';

export { PLAYLIST_EMBED_PARAM, PLAYLIST_EMBED_BODY_CLASS, PLAYLIST_EMBED_PARENT_ORIGIN_PATTERNS, PLAYLIST_PATH_RE };

/**
 * Convert an origin pattern with optional single-label `*` wildcards to a RegExp.
 * `*` matches exactly one DNS label (no dots). Does not match across labels.
 * @param {string} pattern
 * @returns {RegExp}
 */
export function originPatternToRegExp(pattern) {
  const normalized = String(pattern || '')
    .trim()
    .replace(/\/$/, '');
  let source = '';
  [...normalized].forEach((ch) => {
    if (ch === '*') {
      source += '[^.]+';
    } else if (/[.+?^${}()|[\]\\]/.test(ch)) {
      source += `\\${ch}`;
    } else {
      source += ch;
    }
  });
  return new RegExp(`^${source}$`, 'i');
}

/**
 * @param {string} origin
 * @param {readonly string[]} [patterns]
 * @returns {boolean}
 */
export function isAllowlistedParentOrigin(origin = '', patterns = PLAYLIST_EMBED_PARENT_ORIGIN_PATTERNS) {
  if (!origin) return false;
  let normalized;
  try {
    normalized = new URL(origin).origin;
  } catch {
    normalized = String(origin).replace(/\/$/, '');
  }
  return patterns.some((pattern) => originPatternToRegExp(pattern).test(normalized));
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isPlaylistPath(pathname = '') {
  const path = pathname.split('?')[0].replace(/\.html$/i, '');
  return PLAYLIST_PATH_RE.test(path);
}

/**
 * @param {string} search - `location.search` or query string with/without `?`
 * @returns {boolean}
 */
export function hasPlaylistEmbedQueryParam(search = '') {
  const q = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(q).get(PLAYLIST_EMBED_PARAM) === '1';
}

/**
 * @param {{ ancestorOrigins?: ArrayLike<string>|string[], referrer?: string }} [info]
 * @returns {string[]}
 */
export function getParentOrigins(info = {}) {
  const { ancestorOrigins, referrer = '' } = info;
  if (ancestorOrigins && ancestorOrigins.length > 0) {
    return Array.from(ancestorOrigins).filter(Boolean);
  }
  if (!referrer) return [];
  try {
    return [new URL(referrer).origin];
  } catch {
    return [];
  }
}

function isFramed() {
  try {
    return typeof window !== 'undefined' && window.top !== window.self;
  } catch {
    return true;
  }
}

/**
 * @param {{ pathname?: string, search?: string }} [locationLike]
 * @param {{ ancestorOrigins?: ArrayLike<string>|string[], referrer?: string, framed?: boolean }} [parentInfo]
 * @returns {boolean}
 */
export function isPlaylistEmbedMode(locationLike, parentInfo) {
  const loc =
    locationLike ||
    (typeof window !== 'undefined'
      ? { pathname: window.location.pathname, search: window.location.search }
      : { pathname: '', search: '' });
  if (!isPlaylistPath(loc.pathname || '')) return false;
  if (hasPlaylistEmbedQueryParam(loc.search || '')) return true;

  const info =
    parentInfo ||
    (typeof window !== 'undefined'
      ? {
          ancestorOrigins: window.location.ancestorOrigins,
          referrer: document.referrer,
          framed: isFramed(),
        }
      : {});
  const framed = typeof info.framed === 'boolean' ? info.framed : isFramed();
  return framed && getParentOrigins(info).some((origin) => isAllowlistedParentOrigin(origin));
}

/**
 * Full ExL URL for attribution CTA: strip embed signaling only.
 * @param {string} href
 * @returns {string}
 */
export function buildPlaylistAttributionHref(href) {
  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://experienceleague.adobe.com';
  const url = new URL(href, base);
  url.searchParams.delete(PLAYLIST_EMBED_PARAM);
  return url.toString();
}
