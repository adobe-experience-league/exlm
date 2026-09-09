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
