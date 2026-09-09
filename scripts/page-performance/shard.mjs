export function shardUrls(urls, shardCount) {
  if (!urls.length) return [];
  const n = Math.min(shardCount, urls.length);
  const shards = Array.from({ length: n }, () => []);
  urls.forEach((url, i) => {
    shards[i % n].push(url);
  });
  return shards;
}

export function shardIndexes(count) {
  return Array.from({ length: count }, (_, i) => i);
}
