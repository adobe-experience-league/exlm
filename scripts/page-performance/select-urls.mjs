function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function filterUrls(urls, { include = [], exclude = [] }) {
  const includeRe = include.map((p) => new RegExp(p));
  const excludeRe = exclude.map((p) => new RegExp(p));
  let filtered = urls.filter((u) => includeRe.length === 0 || includeRe.some((re) => re.test(u)));
  return filtered.filter((u) => !excludeRe.some((re) => re.test(u)));
}

function pathnameKey(url) {
  try {
    return new URL(url).pathname.replace(/\/+$/, '') || '/';
  } catch {
    return url;
  }
}

function pickFromType(matches, withinType, seed) {
  if (!matches.length) return null;
  if (withinType === 'first') return matches[0];
  if (withinType === 'random') {
    const rng = mulberry32(Number(seed) || 1);
    return matches[Math.floor(rng() * matches.length)];
  }
  let best = matches[0];
  let bestLen = pathnameKey(best).length;
  for (let i = 1; i < matches.length; i += 1) {
    const len = pathnameKey(matches[i]).length;
    if (len < bestLen) {
      best = matches[i];
      bestLen = len;
    }
  }
  return best;
}

export function selectOnePerType(filtered, { pageTypes = [], maxUrls, withinType = 'hub', seed = 1 } = {}) {
  const used = new Set();
  const byType = [];
  const cap = Number.isInteger(maxUrls) && maxUrls > 0 ? maxUrls : pageTypes.length;
  for (const type of pageTypes) {
    if (byType.length >= cap) break;
    const re = new RegExp(type.match);
    const matches = filtered.filter((u) => !used.has(u) && re.test(u));
    if (!matches.length) continue;
    const url = pickFromType(matches, withinType, seed);
    used.add(url);
    byType.push({ id: type.id, url });
  }
  return { urls: byType.map((t) => t.url), byType };
}

export function selectUrlPlan(urls, cfg) {
  const filtered = filterUrls(urls, cfg);
  const { maxUrls, select, seed = 1 } = cfg;

  if (select === 'onePerType') {
    return selectOnePerType(filtered, cfg);
  }

  let picked = filtered;
  if (filtered.length > maxUrls) {
    if (select === 'first') {
      picked = filtered.slice(0, maxUrls);
    } else if (select === 'stride') {
      const n = filtered.length;
      const k = maxUrls;
      picked = [];
      for (let i = 0; i < k; i += 1) {
        picked.push(filtered[Math.floor((i * n) / k)]);
      }
    } else if (select === 'random') {
      const rng = mulberry32(Number(seed) || 1);
      const copy = [...filtered];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      picked = copy.slice(0, maxUrls);
    } else {
      throw new Error(`Unknown select strategy: ${select}`);
    }
  }

  return { urls: picked, byType: [] };
}

export function selectUrls(urls, cfg) {
  return selectUrlPlan(urls, cfg).urls;
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
