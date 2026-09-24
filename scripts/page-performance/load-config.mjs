import { readFile } from 'node:fs/promises';

const DEFAULTS = {
  include: [],
  exclude: [],
  maxUrls: 20,
  select: 'stride',
  withinType: 'hub',
  pageTypes: [],
  seed: 1,
  formFactors: ['mobile', 'desktop'],
  query: { martech: 'off' },
  shards: 4,
  concurrencyPerShard: 1,
  auditor: 'stub',
  artifactRetentionDays: 14,
  keepLastRuns: 5,
  fetchTimeoutMs: 30_000,
  maxSitemapBytes: 52_428_800,
  allowedHosts: [],
  sitemapConcurrency: 4,
};

function assertPageTypes(list) {
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('pageTypes must be a non-empty array when select is onePerType');
  }
  const ids = new Set();
  for (const type of list) {
    if (!type || typeof type.id !== 'string' || !type.id.trim()) {
      throw new Error('pageTypes[].id must be a non-empty string');
    }
    if (ids.has(type.id)) {
      throw new Error(`Duplicate pageTypes id: ${type.id}`);
    }
    ids.add(type.id);
    if (typeof type.match !== 'string' || !type.match.trim()) {
      throw new Error(`pageTypes[${type.id}].match must be a regex string`);
    }
    try {
      // eslint-disable-next-line no-new
      new RegExp(type.match);
    } catch {
      throw new Error(`Invalid regex in pageTypes[${type.id}].match`);
    }
  }
}

function assertRegexList(list, label) {
  if (!Array.isArray(list)) {
    throw new Error(`${label} must be an array of regex strings`);
  }
  for (const pattern of list) {
    if (typeof pattern !== 'string') {
      throw new Error(`${label} entries must be strings`);
    }
    try {
      // eslint-disable-next-line no-new
      new RegExp(pattern);
    } catch {
      throw new Error(`Invalid regex in ${label}: ${pattern}`);
    }
  }
}

export async function loadConfig(path) {
  const raw = await readFile(path, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${path}: ${err.message}`);
  }
  if (!parsed || typeof parsed.sitemapUrl !== 'string' || !parsed.sitemapUrl.trim()) {
    throw new Error(`sitemapUrl is required in ${path}`);
  }

  const parsedHasMaxUrls = Object.hasOwn(parsed, 'maxUrls');
  const cfg = {
    ...DEFAULTS,
    ...parsed,
    query: { ...DEFAULTS.query, ...(parsed.query || {}) },
  };

  if (!Number.isInteger(cfg.shards) || cfg.shards < 1) {
    throw new Error('shards must be an integer >= 1');
  }
  if (!Array.isArray(cfg.pageTypes)) {
    throw new Error('pageTypes must be an array');
  }
  if (!['hub', 'first', 'random'].includes(cfg.withinType)) {
    throw new Error('withinType must be hub, first, or random');
  }
  if (!['first', 'stride', 'random', 'onePerType'].includes(cfg.select)) {
    throw new Error('select must be first, stride, random, or onePerType');
  }
  if (cfg.select === 'onePerType') {
    assertPageTypes(cfg.pageTypes);
    if (!parsedHasMaxUrls) {
      cfg.maxUrls = cfg.pageTypes.length;
    }
  }
  if (!Number.isInteger(cfg.maxUrls) || cfg.maxUrls < 1) {
    throw new Error('maxUrls must be an integer >= 1');
  }
  if (!Number.isInteger(cfg.concurrencyPerShard) || cfg.concurrencyPerShard < 1) {
    throw new Error('concurrencyPerShard must be an integer >= 1');
  }
  if (!Number.isInteger(cfg.keepLastRuns) || cfg.keepLastRuns < 1) {
    throw new Error('keepLastRuns must be an integer >= 1');
  }
  if (!Number.isInteger(cfg.artifactRetentionDays) || cfg.artifactRetentionDays < 1 || cfg.artifactRetentionDays > 90) {
    throw new Error('artifactRetentionDays must be an integer between 1 and 90');
  }
  if (!Number.isInteger(cfg.sitemapConcurrency) || cfg.sitemapConcurrency < 1) {
    throw new Error('sitemapConcurrency must be an integer >= 1');
  }
  if (!Array.isArray(cfg.allowedHosts)) {
    throw new Error('allowedHosts must be an array of hostnames');
  }
  if (!['stub', 'lighthouse'].includes(cfg.auditor)) {
    throw new Error('auditor must be stub or lighthouse');
  }
  if (!Array.isArray(cfg.formFactors) || cfg.formFactors.length === 0) {
    throw new Error('formFactors must be a non-empty array');
  }
  const allowedFactors = new Set(['mobile', 'desktop']);
  for (const factor of cfg.formFactors) {
    if (!allowedFactors.has(factor)) {
      throw new Error(`Unsupported formFactor: ${factor}`);
    }
  }
  assertRegexList(cfg.include, 'include');
  assertRegexList(cfg.exclude, 'exclude');
  return cfg;
}
