import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyPageQuery, selectUrls } from './select-urls.mjs';

const URLS = [
  'https://demo.example/en/home',
  'https://demo.example/en/docs',
  'https://demo.example/en/search',
  'https://demo.example/fr/home',
  'https://demo.example/en/events',
  'https://demo.example/en/playlists',
];

describe('selectUrls', () => {
  it('filters with include and exclude regex from config', () => {
    const selected = selectUrls(URLS, {
      include: ['/en/'],
      exclude: ['/search'],
      maxUrls: 50,
      select: 'first',
    });
    assert.deepEqual(selected, [
      'https://demo.example/en/home',
      'https://demo.example/en/docs',
      'https://demo.example/en/events',
      'https://demo.example/en/playlists',
    ]);
  });

  it('caps with first', () => {
    const selected = selectUrls(URLS, {
      include: [],
      exclude: [],
      maxUrls: 2,
      select: 'first',
    });
    assert.deepEqual(selected, URLS.slice(0, 2));
  });

  it('samples evenly with stride', () => {
    const selected = selectUrls(URLS, {
      include: [],
      exclude: [],
      maxUrls: 3,
      select: 'stride',
    });
    assert.equal(selected.length, 3);
    assert.equal(selected[0], URLS[0]);
    assert.equal(selected[1], URLS[2]);
    assert.equal(selected[2], URLS[4]);
  });

  it('picks one hub URL per page type and skips missing types', () => {
    const urls = [
      'https://demo.example/en/docs/experience-manager/using/home',
      'https://demo.example/en/docs',
      'https://demo.example/en/playlists/getting-started-with-aem',
      'https://demo.example/en/playlists',
      'https://demo.example/en/perspectives/why-edge-delivery',
      'https://demo.example/en/search',
      'https://demo.example/en/home',
    ];
    const selected = selectUrls(urls, {
      include: ['/en/'],
      exclude: ['/search'],
      select: 'onePerType',
      withinType: 'hub',
      maxUrls: 8,
      pageTypes: [
        { id: 'home', match: '/en/home(/|$)' },
        { id: 'playlists', match: '/en/playlists(/|$)' },
        { id: 'perspectives', match: '/en/perspectives(/|$)' },
        { id: 'courses', match: '/en/courses(/|$)' },
        { id: 'docs', match: '/en/docs(/|$)' },
      ],
    });
    assert.deepEqual(selected, [
      'https://demo.example/en/home',
      'https://demo.example/en/playlists',
      'https://demo.example/en/perspectives/why-edge-delivery',
      'https://demo.example/en/docs',
    ]);
  });

  it('caps onePerType at maxUrls in pageTypes order', () => {
    const selected = selectUrls(
      ['https://demo.example/en/home', 'https://demo.example/en/docs', 'https://demo.example/en/playlists'],
      {
        include: [],
        exclude: [],
        select: 'onePerType',
        withinType: 'hub',
        maxUrls: 2,
        pageTypes: [
          { id: 'home', match: '/en/home(/|$)' },
          { id: 'docs', match: '/en/docs(/|$)' },
          { id: 'playlists', match: '/en/playlists(/|$)' },
        ],
      },
    );
    assert.deepEqual(selected, ['https://demo.example/en/home', 'https://demo.example/en/docs']);
  });

  it('random with the same seed is stable', () => {
    const a = selectUrls(URLS, { include: [], exclude: [], maxUrls: 3, select: 'random', seed: 7 });
    const b = selectUrls(URLS, { include: [], exclude: [], maxUrls: 3, select: 'random', seed: 7 });
    assert.deepEqual(a, b);
    assert.equal(a.length, 3);
  });
});

describe('applyPageQuery', () => {
  it('adds martech=off when missing', () => {
    assert.equal(
      applyPageQuery('https://demo.example/en/home', { martech: 'off' }),
      'https://demo.example/en/home?martech=off',
    );
  });

  it('does not override an existing martech value', () => {
    assert.equal(
      applyPageQuery('https://demo.example/en/home?martech=off', { martech: 'off' }),
      'https://demo.example/en/home?martech=off',
    );
  });
});
