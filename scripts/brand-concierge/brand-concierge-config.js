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

/** lang -> Promise resolving that locale's { language, ui, text, arrays } sheet (deduped). */
const localeSheetCache = {};

function fetchLocaleSheet(lang) {
  if (!localeSheetCache[lang]) {
    localeSheetCache[lang] = fetch(`${LOCALES_BASE_PATH}/${lang}.json`).then((res) => {
      if (!res.ok) throw new Error(`Brand Concierge locale '${lang}' -> ${res.status}`);
      return res.json();
    });
  }
  return localeSheetCache[lang];
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
 * Loads the BC config for a path language, layering the locale's localization sheet over the
 * English base. English is always fetched as the fallback base, so a partial locale sheet
 * degrades per-field rather than dropping keys. Falls back to English for unknown/failed locales.
 * @param {string} [lang] - Path language from getPathDetails().lang (e.g. 'en', 'es').
 * @returns {Promise<typeof brandConciergeConfig & { ui: object }>}
 */
export async function loadBrandConciergeConfig(lang) {
  const key = (lang || 'en').toLowerCase();
  const en = await fetchLocaleSheet('en');
  let locale = en;
  if (key !== 'en') {
    try {
      locale = await fetchLocaleSheet(key);
    } catch {
      locale = en;
    }
  }
  return {
    ...brandConciergeConfig,
    ui: deepMerge(en.ui, locale.ui),
    text: { ...en.text, ...locale.text },
    arrays: { ...en.arrays, ...locale.arrays },
    metadata: {
      ...brandConciergeConfig.metadata,
      language: locale.language || brandConciergeConfig.metadata.language,
    },
  };
}

/**
 * Per-locale Brand Concierge Edge datastream overrides. This is routing config, not translation,
 * so it is kept out of the localization sheets and out of the config forwarded to the BC web
 * client. Same IMS org as the default datastream.
 */
const BC_DATASTREAMS = {
  es: '3098f7cc-36bb-4965-bea3-6e80fc59571e',
};

/**
 * @param {string} [lang] - Path language, e.g. 'en', 'es'.
 * @param {string} fallback - Default datastream id used when the locale has no override.
 * @returns {string}
 */
export function getBrandConciergeDatastreamId(lang, fallback) {
  return BC_DATASTREAMS[(lang || 'en').toLowerCase()] ?? fallback;
}

export default brandConciergeConfig;
