/**
 * Resolve the Coveo product facet value for header / secondary search redirects.
 *
 * EXLM-6173:
 * - Main docs hub (`theme` includes `docs-landing`) must not pre-filter by product —
 *   users search across Analytics, Platform, Commerce, etc. from that page.
 * - When `usetq` is true, prefer TQ / v2 product labels (`product`, `coveo-solution`)
 *   and ignore legacy `solution` (v1). Authors may keep a stale v1 value during migration.
 *
 * @param {(name: string) => string} getMeta - metadata reader (e.g. getMetadata)
 * @returns {string} product facet value, or '' when none should be applied
 */
export default function resolveSearchProductFilter(getMeta) {
  const theme = getMeta('theme') || '';
  const themes = theme
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  // docs-landing = multi-product docs hub. docs-solution-landing keeps product filter.
  if (themes.includes('docs-landing')) {
    return '';
  }

  /**
   * @param {string} [raw]
   * @returns {string}
   */
  const firstCsvValue = (raw) => {
    if (!raw || typeof raw !== 'string') return '';
    return raw.split(',')[0].trim();
  };

  /**
   * coveo-solution may be semicolon-joined after AEM decode.
   * @param {string} [raw]
   * @returns {string}
   */
  const firstSemicolonValue = (raw) => {
    if (!raw || typeof raw !== 'string') return '';
    return raw.split(';')[0].trim();
  };

  const useTq = (getMeta('usetq') || '').trim().toLowerCase() === 'true';
  if (useTq) {
    const fromProduct = firstCsvValue(getMeta('product'));
    if (fromProduct) return fromProduct;
    const fromCoveo = firstSemicolonValue(getMeta('coveo-solution'));
    if (fromCoveo) return fromCoveo;
    // usetq: do not fall back to legacy solution (v1)
    return '';
  }

  return firstCsvValue(getMeta('solution'));
}
