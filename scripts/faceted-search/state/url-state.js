export function readFiltersFromUrl(groupIds, { format = 'repeat', sanitize = (v) => v } = {}) {
  const params = new URL(window.location.href).searchParams;
  return Object.fromEntries(
    groupIds.map((id) => {
      const raw = format === 'comma' ? (params.get(id) || '').split(',') : params.getAll(id);
      return [id, raw.map((v) => sanitize(v.trim())).filter(Boolean)];
    }),
  );
}

export function readKeywordFromUrl(param = 'q', sanitize = (v) => v) {
  return sanitize((new URL(window.location.href).searchParams.get(param) || '').trim());
}

export function readSearchStateFromUrl(
  groupIds,
  { keywordParam = null, sortParam = null, pageParam = null, sanitize = (value) => value, ...options } = {},
) {
  const params = new URL(window.location.href).searchParams;
  const page = pageParam ? Number(params.get(pageParam)) : 1;
  return {
    filters: readFiltersFromUrl(groupIds, { ...options, sanitize }),
    keyword: keywordParam ? readKeywordFromUrl(keywordParam, sanitize) : '',
    sort: sortParam ? sanitize(params.get(sortParam) || '') : '',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function writeSearchStateToUrl(
  { filters, keyword, sort, page },
  groupIds,
  { format = 'repeat', keywordParam = null, sortParam = null, pageParam = null } = {},
) {
  const url = new URL(window.location.href);
  groupIds.forEach((id) => {
    url.searchParams.delete(id);
    if (!filters[id]?.length) return;
    if (format === 'comma') url.searchParams.set(id, filters[id].join(','));
    else filters[id].forEach((value) => url.searchParams.append(id, value));
  });
  const values = [
    [keywordParam, keyword],
    [sortParam, sort],
    [pageParam, page > 1 ? String(page) : ''],
  ];
  values.forEach(([param, value]) => {
    if (!param) return;
    if (value) url.searchParams.set(param, value);
    else url.searchParams.delete(param);
  });
  if (url.href !== window.location.href) window.history.pushState({}, '', url);
}

/** keywordParam (e.g. 'q'): also mirrors the store keyword into the URL. */
export function bindFiltersToUrl(store, groupIds, options = {}) {
  return store.subscribe((state) => writeSearchStateToUrl(state, groupIds, options));
}
