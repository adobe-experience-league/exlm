import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isPlaylistPath,
  hasPlaylistEmbedQueryParam,
  isAllowlistedParentOrigin,
  getParentOrigins,
  isPlaylistEmbedMode,
  buildPlaylistAttributionHref,
  originPatternToRegExp,
  PLAYLIST_EMBED_PARENT_ORIGIN_PATTERNS,
} from './playlist-embed-utils.js';
import {
  PLAYLIST_EMBED_PARAM,
  PLAYLIST_EMBED_BODY_CLASS,
  PLAYLIST_EMBED_PARENT_ORIGIN_PATTERNS as CONFIG_PATTERNS,
} from './playlist-embed-config.js';

describe('playlist-embed-config (externalized)', () => {
  it('exports stable param and body class', () => {
    assert.equal(PLAYLIST_EMBED_PARAM, 'embed');
    assert.equal(PLAYLIST_EMBED_BODY_CLASS, 'playlist-embed-mode');
  });
  it('keeps patterns in config module (not inline in utils)', () => {
    assert.ok(Array.isArray(CONFIG_PATTERNS));
    assert.equal(CONFIG_PATTERNS, PLAYLIST_EMBED_PARENT_ORIGIN_PATTERNS);
    assert.ok(CONFIG_PATTERNS.some((p) => p.includes('*')));
  });
  it('exports PLAYLIST_PATH_RE used by isPlaylistPath', async () => {
    const { PLAYLIST_PATH_RE } = await import('./playlist-embed-config.js');
    assert.equal(PLAYLIST_PATH_RE.test('/en/playlists/foo'), true);
    assert.equal(PLAYLIST_PATH_RE.test('/en/docs/foo'), false);
  });
});

describe('originPatternToRegExp / wildcards', () => {
  it('matches exact origins', () => {
    assert.equal(isAllowlistedParentOrigin('https://experience.adobe.com'), true);
    assert.equal(isAllowlistedParentOrigin('https://certification.adobe.com'), true);
    assert.equal(isAllowlistedParentOrigin('https://evil.example'), false);
  });
  it('matches experience-* stage hosts', () => {
    assert.equal(isAllowlistedParentOrigin('https://experience-stage.adobe.com'), true);
    assert.equal(isAllowlistedParentOrigin('https://experience-dev.adobe.com'), true);
    assert.equal(isAllowlistedParentOrigin('https://experience.evil.com'), false);
  });
  it('matches adobeio-static apex and subdomains but not spoof hosts', () => {
    assert.equal(isAllowlistedParentOrigin('https://adobeio-static.net'), true);
    assert.equal(isAllowlistedParentOrigin('https://ns.adobeio-static.net'), true);
    assert.equal(isAllowlistedParentOrigin('https://evil.adobeio-static.net.attacker.com'), false);
  });
  it('does not let * span labels', () => {
    const re = originPatternToRegExp('https://*.adobeio-static.net');
    assert.equal(re.test('https://a.b.adobeio-static.net'), false);
  });
});

describe('isPlaylistPath', () => {
  it('matches EDS playlist paths', () => {
    assert.equal(isPlaylistPath('/en/playlists/acrobat-sign-admin'), true);
    assert.equal(isPlaylistPath('/zh-hans/playlists/foo'), true);
    assert.equal(isPlaylistPath('/en/playlists/foo.html'), true);
  });
  it('rejects non-playlist paths', () => {
    assert.equal(isPlaylistPath('/en/docs/foo'), false);
    assert.equal(isPlaylistPath('/en/home'), false);
  });
});

describe('hasPlaylistEmbedQueryParam', () => {
  it('requires embed=1', () => {
    assert.equal(hasPlaylistEmbedQueryParam('?embed=1'), true);
    assert.equal(hasPlaylistEmbedQueryParam('?embed=true'), false);
    assert.equal(hasPlaylistEmbedQueryParam('?martech=off'), false);
  });
});

describe('getParentOrigins', () => {
  it('reads ancestorOrigins then referrer', () => {
    assert.deepEqual(getParentOrigins({ ancestorOrigins: ['https://experience.adobe.com'] }), [
      'https://experience.adobe.com',
    ]);
    assert.deepEqual(getParentOrigins({ referrer: 'https://experience-stage.adobe.com/foo' }), [
      'https://experience-stage.adobe.com',
    ]);
  });
});

describe('isPlaylistEmbedMode', () => {
  it('requires playlist path', () => {
    assert.equal(isPlaylistEmbedMode({ pathname: '/en/home', search: '?embed=1' }, {}), false);
  });
  it('true with embed=1 on playlist', () => {
    assert.equal(isPlaylistEmbedMode({ pathname: '/en/playlists/x', search: '?embed=1' }, {}), true);
  });
  it('true with allowlisted ancestor while framed', () => {
    assert.equal(
      isPlaylistEmbedMode(
        { pathname: '/en/playlists/x', search: '' },
        { ancestorOrigins: ['https://experience.adobe.com'], framed: true },
      ),
      true,
    );
  });
  it('true with wildcard stage parent while framed', () => {
    assert.equal(
      isPlaylistEmbedMode(
        { pathname: '/en/playlists/x', search: '' },
        { ancestorOrigins: ['https://experience-stage.adobe.com'], framed: true },
      ),
      true,
    );
  });
  it('false with allowlisted referrer when not framed', () => {
    assert.equal(
      isPlaylistEmbedMode(
        { pathname: '/en/playlists/x', search: '' },
        { referrer: 'https://experience.adobe.com/catalog', framed: false },
      ),
      false,
    );
  });
  it('false when no signal', () => {
    assert.equal(isPlaylistEmbedMode({ pathname: '/en/playlists/x', search: '' }, { referrer: '' }), false);
  });
});

describe('buildPlaylistAttributionHref', () => {
  it('strips embed and keeps video', () => {
    const href = buildPlaylistAttributionHref('https://experienceleague.adobe.com/en/playlists/x?embed=1&video=2');
    assert.equal(href.includes('embed='), false);
    assert.equal(href.includes('video=2'), true);
  });
});
