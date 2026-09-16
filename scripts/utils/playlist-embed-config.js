/**
 * Playlist product-embed allowlist (data only).
 * Keep host patterns here — matching logic lives in playlist-embed-utils.js.
 *
 * Patterns:
 * - Exact origin: `https://experience.adobe.com`
 * - Single-label wildcard: `https://*.adobeio-static.net`, `https://experience-*.adobe.com`
 *
 * Note: CSP `frame-ancestors` only allows a leftmost `*` DNS label
 * (`https://*.example.com`), not mid-label wildcards. FE may use mid-label
 * patterns for chrome detection; keep CSP host list explicit in the headers runbook.
 */

/** Query param that forces chrome-less playlist embed (`?embed=1`). */
export const PLAYLIST_EMBED_PARAM = 'embed';

/** Body class applied in product-iframe / embed mode. */
export const PLAYLIST_EMBED_BODY_CLASS = 'playlist-embed-mode';

/** Playlist URL path gate (EDS + AEM-style paths). Cheap sync check before dynamic import. */
export const PLAYLIST_PATH_RE = /\/playlists(\/|$)/i;

/**
 * Parent origins allowed to trigger chrome-less mode when framed
 * (without requiring `?embed=1`). Align with product hosts CXO embeds from.
 */
export const PLAYLIST_EMBED_PARENT_ORIGIN_PATTERNS = Object.freeze([
  'https://experience.adobe.com',
  'https://experience-*.adobe.com',
  'https://certification.adobe.com',
  'https://adobeio-static.net',
  'https://*.adobeio-static.net',
]);
