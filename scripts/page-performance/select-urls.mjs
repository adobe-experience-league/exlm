function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function selectUrls(urls, { include = [], exclude = [], maxUrls, select, seed = 1 }) {
  const includeRe = include.map((p) => new RegExp(p));
  const excludeRe = exclude.map((p) => new RegExp(p));
  let filtered = urls.filter((u) => includeRe.length === 0 || includeRe.some((re) => re.test(u)));
  filtered = filtered.filter((u) => !excludeRe.some((re) => re.test(u)));

  if (filtered.length <= maxUrls) return filtered;
  if (select === 'first') return filtered.slice(0, maxUrls);
  if (select === 'stride') {
    const n = filtered.length;
    const k = maxUrls;
    const out = [];
    for (let i = 0; i < k; i += 1) {
      out.push(filtered[Math.floor((i * n) / k)]);
    }
    return out;
  }
  if (select === 'random') {
    const rng = mulberry32(Number(seed) || 1);
    const copy = [...filtered];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, maxUrls);
  }
  throw new Error(`Unknown select strategy: ${select}`);
}

export function applyPageQuery(url, query = {}) {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(query)) {
    if (!parsed.searchParams.has(key)) {
      parsed.searchParams.set(key, String(value));
    }
  }
  return parsed.toString();
}
