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

/** keywordParam (e.g. 'q'): also mirrors the store keyword into the URL. */
export function bindFiltersToUrl(store, groupIds, { format = 'repeat', keywordParam = null, sortParam = null } = {}) {
  return store.subscribe(({ filters, keyword, sort }) => {
    const url = new URL(window.location.href);
    groupIds.forEach((id) => {
      url.searchParams.delete(id);
      if (!filters[id]?.length) return;
      if (format === 'comma') url.searchParams.set(id, filters[id].join(','));
      else filters[id].forEach((v) => url.searchParams.append(id, v));
    });
    if (keywordParam) {
      if (keyword) url.searchParams.set(keywordParam, keyword);
      else url.searchParams.delete(keywordParam);
    }
    if (sortParam) {
      if (sort) url.searchParams.set(sortParam, sort);
      else url.searchParams.delete(sortParam);
    }
    if (url.href !== window.location.href) window.history.pushState({}, '', url);
  });
}
