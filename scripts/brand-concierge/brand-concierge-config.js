/**
 * Reads a resolved CSS custom property from ExL's root styles.
 * @param {string} name
 * @param {string} fallback
 * @returns {string}
 */
const rootStyles = getComputedStyle(document.documentElement);

function exlVar(name, fallback) {
  return rootStyles.getPropertyValue(name).trim() || fallback;
}

/**
 * Creates a product-specific namespace for conversation history.
 * @returns {string}
 */
function getProductNamespace() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const key = segments.slice(0, 3).join('-');
  return key ? `exl-bc-${key}` : 'exl-bc';
}

const brandConciergeConfig = {
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

const SHEET_BASE_PATH = window.hlx.codeBasePath;

const LOCALES = {
  en: { language: 'en-US' },
  es: { language: 'es-ES' },
};

export const SUPPORTED_LOCALES = new Set(Object.keys(LOCALES));

const ueSheetCache = new Map();

/**
 * Fetches published UE key-value rows for the specified language.
 *
 * Expected row format:
 * [
 *   { key: 'ui.drawerTitle', value: 'Ask AI' },
 *   { key: 'text.input.placeholder', value: 'Ask a question…' },
 *   { key: 'arrays.welcome.examples.0', value: 'Example question' }
 * ]
 * @param {string} lang
 * @returns {Promise<Array<{key: string, value: string}>>}
 */

async function fetchUeSheet(lang) {
  if (!ueSheetCache.has(lang)) {
    const request = fetch(`${SHEET_BASE_PATH}/${lang}/brand-concierge.json`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Brand Concierge UE sheet '${lang}' -> ${res.status}`);
        }

        return res.json();
      })
      .then((response) => {
        // EDS spreadsheet responses contain rows inside `data`.
        const rows = Array.isArray(response) ? response : response?.data;

        if (!Array.isArray(rows)) {
          throw new Error(`Brand Concierge UE sheet '${lang}' must contain a data array`);
        }

        // Older prompt-only sheets have no key column; map their prompts to welcome examples.
        let promptIndex = 0;
        return rows.map((row) => {
          const key = typeof row?.key === 'string' ? row.key.trim() : '';
          const prompt = row?.['Default prompts'];

          if (!key && prompt != null && String(prompt).trim()) {
            const promptRow = {
              key: `arrays.welcome.examples.${promptIndex}`,
              value: prompt,
            };
            promptIndex += 1;
            return promptRow;
          }

          return {
            key: row?.key,
            value: row?.value ?? prompt,
          };
        });
      })
      .catch((err) => {
        ueSheetCache.delete(lang);
        throw err;
      });

    ueSheetCache.set(lang, request);
  }

  return ueSheetCache.get(lang);
}

/**
 * Sets a value at a nested object path.
 * @param {object} target
 * @param {string[]} path
 * @param {*} value
 */
function setNestedValue(target, path, value) {
  let current = target;

  path.forEach((segment, index) => {
    if (index === path.length - 1) {
      current[segment] = value;
      return;
    }

    if (!current[segment] || typeof current[segment] !== 'object' || Array.isArray(current[segment])) {
      current[segment] = {};
    }

    current = current[segment];
  });
}

/**
 * Converts UE key-value rows into the Brand Concierge configuration shape.
 *
 * ui keys become nested objects.
 * text keys retain their dotted suffixes.
 * welcome examples become [{ text: '...' }] entries; other arrays remain strings.
 *
 * @param {Array<{key: string, value: string}>} rows
 * @returns {{ui: object, text: object, arrays: object}}
 */
export function rowsToConfig(rows) {
  const config = {
    ui: {},
    text: {},
    arrays: {},
  };

  rows.forEach((row) => {
    const key = String(row?.key ?? '').trim();
    const value = row?.value;

    if (!key || value == null) return;

    const normalizedValue = String(value);

    if (key.startsWith('ui.')) {
      setNestedValue(config.ui, key.slice(3).split('.'), normalizedValue);
      return;
    }

    if (key.startsWith('text.')) {
      config.text[key.slice(5)] = normalizedValue;
      return;
    }

    if (key.startsWith('arrays.')) {
      if (!normalizedValue.trim()) return;

      const arrayKey = key.slice(7);
      const lastDot = arrayKey.lastIndexOf('.');

      if (lastDot === -1) return;

      const name = arrayKey.slice(0, lastDot);
      const indexString = arrayKey.slice(lastDot + 1);

      if (!/^\d+$/.test(indexString)) return;

      const index = Number(indexString);

      config.arrays[name] ??= [];
      config.arrays[name][index] = name === 'welcome.examples' ? { text: normalizedValue } : normalizedValue;
    }
  });

  return config;
}

/**
 * Recursively merges plain objects. Locale values override English values.
 * @param {object} base
 * @param {object} override
 * @returns {object}
 */
function deepMerge(base, override) {
  const result = { ...base };

  Object.entries(override || {}).forEach(([key, value]) => {
    const baseValue = result[key];

    const bothPlainObjects =
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue);

    result[key] = bothPlainObjects ? deepMerge(baseValue, value) : value;
  });

  return result;
}

/**
 * Merges arrays by index so missing translated prompts fall back to English.
 * @param {object} englishArrays
 * @param {object} localeArrays
 * @returns {object}
 */
function mergeLocaleArrays(englishArrays = {}, localeArrays = {}) {
  const result = {};

  const keys = new Set([...Object.keys(englishArrays), ...Object.keys(localeArrays)]);

  keys.forEach((key) => {
    const english = englishArrays[key] || [];
    const localized = localeArrays[key] || [];
    const length = Math.max(english.length, localized.length);

    result[key] = Array.from({ length }, (_, index) => localized[index] ?? english[index]).filter(
      (entry) => entry !== undefined,
    );
  });

  return result;
}

/**
 * Merges English and locale UE content into the active configuration.
 * @param {object} english
 * @param {object} locale
 * @param {string|null} pageLangKey
 * @returns {object}
 */
function buildBrandConciergeConfig(english, locale, pageLangKey) {
  return {
    ...brandConciergeConfig,
    ui: deepMerge(english.ui, locale.ui),
    text: {
      ...english.text,
      ...locale.text,
    },
    arrays: mergeLocaleArrays(english.arrays, locale.arrays),
    metadata: {
      ...brandConciergeConfig.metadata,
      language: LOCALES[pageLangKey]?.language || brandConciergeConfig.metadata.language,
    },
  };
}

/**
 * Loads published UE labels and prompts for the requested language.
 * English is the fallback for missing locale keys.
 * @param {string} [lang]
 * @returns {Promise<object|null>}
 */
export async function loadBrandConciergeConfig(lang) {
  const key = (lang || 'en').toLowerCase().split('-')[0];

  let english;

  try {
    const englishRows = await fetchUeSheet('en');
    english = rowsToConfig(englishRows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[BC] English UE spreadsheet failed to load; skipping mount', err?.message || err);

    return null;
  }

  let locale = english;
  let appliedKey = 'en';

  if (key !== 'en' && SUPPORTED_LOCALES.has(key)) {
    try {
      const localeRows = await fetchUeSheet(key);
      locale = rowsToConfig(localeRows);
      appliedKey = key;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[BC] UE spreadsheet '${key}' failed; using English`, err?.message || err);
    }
  }

  return buildBrandConciergeConfig(english, locale, appliedKey === key ? key : null);
}

/**
 * Returns the locale-specific datastream or the default fallback.
 * @param {string} lang
 * @param {string} fallback
 * @returns {string}
 */
export function getBrandConciergeDatastreamId(lang, fallback) {
  const key = (lang || 'en').toLowerCase().split('-')[0];
  return LOCALES[key]?.datastreamId ?? fallback;
}

export default brandConciergeConfig;
