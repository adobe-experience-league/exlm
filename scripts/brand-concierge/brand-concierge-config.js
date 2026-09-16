/**
 * Reads a resolved CSS custom property from ExL's root styles, keeping BC's
 * theme in sync with styles.css without manual duplication.
 * @param {string} name - CSS custom property name, e.g. '--non-spectrum-navy-blue'.
 * @param {string} fallback - Value to use if the property is empty or unset.
 * @returns {string}
 */
const rootStyles = getComputedStyle(document.documentElement);

function exlVar(name, fallback) {
  return rootStyles.getPropertyValue(name).trim() || fallback;
}

/**
 * Derives a namespace key from the URL path so each ExL product surface
 * keeps its own conversation history in local storage.
 * @returns {string}
 */
function getProductNamespace() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const key = segments.slice(0, 3).join('-');
  return key ? `exl-bc-${key}` : 'exl-bc';
}

/**
 * Non-localizable Brand Concierge config. Localized strings (`ui`/`text`/`arrays`) and
 * `metadata.language` come per-locale from ./localization/<lang>.json and are merged in by
 * loadBrandConciergeConfig(); this base holds only values that can't live in a JSON sheet
 * (runtime-resolved CSS theme, session/behavior flags, namespace).
 */
const brandConciergeConfig = {
  // destructured out in brand-concierge.js before forwarding to bootstrap().
  stickySession: true,

  behavior: {
    chatTranscript: {
      enabled: true,
      maxSessions: 1,
      maxMessagesPerSession: 10,
      cleanupInterval: 24,
    },
  },

  metadata: {
    brandName: 'Experience League',
    version: '1.0.0',
    language: document.documentElement.lang || 'en-US',
    namespace: getProductNamespace(),
  },

  // CSS variable overrides forwarded to BC. Only set values that diverge from
  // BC defaults or need tuning for the compact dialog context.
  // spacing and sizing for pill/suggestion buttons are intentionally set only
  // in brand-concierge.css (with !important) to keep one authoritative source.
  theme: {
    '--font-family': exlVar(
      '--body-font-family',
      '"Adobe Clean", adobe-clean, "Source Sans Pro", -apple-system, system-ui, "Segoe UI", roboto, ubuntu, "Trebuchet MS", "Lucida Grande", sans-serif',
    ),

    '--color-primary': exlVar('--non-spectrum-navy-blue', '#1473e6'),
    '--color-primary-hover': exlVar('--non-spectrum-dark-navy-blue', '#0265dc'),
    '--color-primary-alpha': exlVar('--non-spectrum-navy-blue-alpha', 'rgba(20, 115, 230, 0.25)'),

    '--color-button-primary': exlVar('--non-spectrum-navy-blue', '#1473e6'),
    '--color-button-primary-hover': exlVar('--non-spectrum-dark-navy-blue', '#0265dc'),
    '--color-button-primary-border': exlVar('--non-spectrum-navy-blue', '#1473e6'),

    '--color-message-user': exlVar('--bc-user-bubble', '#e8e3f8'),

    '--main-container-background': '#ffffff',
    '--chat-container-background': '#ffffff',

    '--welcome-input-order': '4',
    '--welcome-cards-order': '2',
    '--welcome-padding': '12px 0',
    '--card-width': '300px',

    '--prompt-suggestions-button-width': '100%',
    '--prompt-suggestions-button-width-max': '100%',

    '--input-height': '52px',
    '--input-max-height': '96px',
    '--input-padding': '0 4px 0 10px',
    '--input-font-size': '14px',
    '--input-container-gap': '5px',
    '--input-button-width': '36px',
    '--input-button-height': '36px',
    '--submit-button-icon-size': '16px',

    '--container-padding-desktop': '8px',
    '--container-padding-mobile': '8px',
  },
};

const LOCALES_BASE_PATH = `${window.hlx.codeBasePath}/scripts/brand-concierge/localization`;

/**
 * Single registry of everything per-locale that isn't translated copy: the BCP-47 language tag
 * forwarded to the BC client/backend, and any Edge datastream override. Adding a locale only
 * needs a new entry here (plus its <lang>.json) — keeping language and datastream in one place
 * avoids the two structures silently drifting out of sync with each other.
 */
const LOCALES = {
  en: { language: 'en-US' },
  es: {
    language: 'es-ES',
    // Spanish Brand Concierge datastream (same IMS org as the default). Routes /es/ conversations
    // to the Spanish concierge/manifest instead of the default English datastream.
    datastreamId: '152f88b1-ef07-4afe-8a23-6c0e21c6f017',
  },
};
export const SUPPORTED_LOCALES = new Set(Object.keys(LOCALES));

/** lang -> Promise resolving that locale's { language, ui, text, arrays } sheet (deduped). */
const localeSheetCache = {};

function fetchLocaleSheet(lang) {
  if (!localeSheetCache[lang]) {
    localeSheetCache[lang] = fetch(`${LOCALES_BASE_PATH}/${lang}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Brand Concierge locale '${lang}' -> ${res.status}`);
        return res.json();
      })
      .catch((err) => {
        // Don't cache failures — a transient network blip shouldn't permanently break this locale.
        delete localeSheetCache[lang];
        throw err;
      });
  }
  return localeSheetCache[lang];
}

function objectValues(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? Object.values(value) : value;
}

/**
 * Array keys whose entries must be wrapped as `{ text }` to match the shape
 * fetchDefaultPromptsOverride() builds (and BC's bootstrap() expects), so the welcome cards
 * render the same whether prompts come from the sheet override or this config fallback.
 */
const ARRAYS_NEEDING_TEXT_WRAPPER = new Set(['welcome.examples']);

function normalizeLocaleArrays(arrays) {
  return Object.fromEntries(
    Object.entries(arrays || {}).map(([key, value]) => {
      const list = objectValues(value);
      const needsWrapper = ARRAYS_NEEDING_TEXT_WRAPPER.has(key) && Array.isArray(list);
      return [key, needsWrapper ? list.map((text) => ({ text })) : list];
    }),
  );
}

/** Recursive merge: `over` wins; nested plain objects merge per-field, arrays/scalars replace. */
function deepMerge(base, over) {
  if (!over) return base;
  const out = { ...base };
  Object.entries(over).forEach(([key, value]) => {
    const baseVal = base?.[key];
    const bothPlainObjects =
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      baseVal &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal);
    out[key] = bothPlainObjects ? deepMerge(baseVal, value) : value;
  });
  return out;
}

/**
 * @param {string | null} pageLangKey - The requested locale key, but only when that locale's own
 * content actually applied (see loadBrandConciergeConfig()); `null` otherwise (unsupported locale,
 * or a supported one whose sheet fetch failed), so metadata.language falls through to
 * `brandConciergeConfig.metadata.language` (`document.documentElement.lang`) rather than
 * mislabeling English fallback content as a locale it isn't.
 */
function buildBrandConciergeConfig(en, locale, pageLangKey) {
  return {
    ...brandConciergeConfig,
    ui: deepMerge(en.ui, locale.ui),
    text: { ...en.text, ...locale.text },
    arrays: normalizeLocaleArrays({ ...en.arrays, ...locale.arrays }),
    metadata: {
      ...brandConciergeConfig.metadata,
      language: LOCALES[pageLangKey]?.language || brandConciergeConfig.metadata.language,
    },
  };
}

/**
 * Loads the BC config for a path language, layering the locale's localization sheet over the
 * English base. English is always fetched as the fallback base, so a partial locale sheet
 * degrades per-field rather than dropping keys. Falls back to English for unknown/failed locales.
 * Returns `null` if the English base sheet itself can't be loaded, so the caller can skip mounting
 * gracefully rather than render a widget with no copy (single-point-of-failure guard).
 * @param {string} [lang] - Path language from getPathDetails().lang (e.g. 'en', 'es').
 * @returns {Promise<(typeof brandConciergeConfig & { ui: object }) | null>}
 */
export async function loadBrandConciergeConfig(lang) {
  const key = (lang || 'en').toLowerCase();
  const [englishResult, localeResult] = await Promise.allSettled([
    fetchLocaleSheet('en'),
    key !== 'en' && SUPPORTED_LOCALES.has(key) ? fetchLocaleSheet(key) : Promise.resolve(null),
  ]);
  if (englishResult.status !== 'fulfilled') {
    // eslint-disable-next-line no-console
    console.warn(
      '[BC] English localization sheet failed to load; skipping mount',
      englishResult.reason?.message || englishResult.reason,
    );
    return null;
  }
  const en = englishResult.value;
  let locale = en;
  let appliedKey = 'en';
  if (localeResult.status === 'fulfilled' && localeResult.value) {
    locale = localeResult.value;
    appliedKey = key;
  } else if (localeResult.status === 'rejected') {
    // eslint-disable-next-line no-console
    console.warn(
      `[BC] Locale sheet '${key}' failed; using English`,
      localeResult.reason?.message || localeResult.reason,
    );
  }
  // Only trust `key` for metadata.language when that locale's own content actually applied.
  // Otherwise (unsupported locale, or a supported one whose sheet fetch failed) pass null so
  // buildBrandConciergeConfig falls through to the page's own document language instead of
  // mislabeling English fallback content as a locale it isn't.
  return buildBrandConciergeConfig(en, locale, appliedKey === key ? key : null);
}

/**
 * @param {string} [lang] - Path language, e.g. 'en', 'es'.
 * @param {string} fallback - Default datastream id used when the locale has no override.
 * @returns {string}
 */
export function getBrandConciergeDatastreamId(lang, fallback) {
  const key = (lang || 'en').toLowerCase().split('-')[0];
  return LOCALES[key]?.datastreamId ?? fallback;
}

export default brandConciergeConfig;
