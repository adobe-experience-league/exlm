import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shardUrls, shardIndexes } from './shard.mjs';

describe('shardUrls', () => {
  it('splits round-robin so shards stay balanced', () => {
    const urls = ['a', 'b', 'c', 'd', 'e', 'f'];
    const shards = shardUrls(urls, 3);
    assert.deepEqual(shards, [
      ['a', 'd'],
      ['b', 'e'],
      ['c', 'f'],
    ]);
  });

  it('omits empty shards when there are more shards than urls', () => {
    const shards = shardUrls(['a', 'b'], 4);
    assert.deepEqual(shards, [['a'], ['b']]);
  });
});

describe('shardIndexes', () => {
  it('returns json-serializable indexes for a GHA matrix', () => {
    assert.deepEqual(shardIndexes(3), [0, 1, 2]);
  });
});
