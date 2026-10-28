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

const BC_CONTENT_KEY_MAP = {
  'ui.triggerAriaLabel': { placeholder: 'bc-ui-trigger-aria-label', fallback: 'Open AI assistant' },
  'ui.triggerAsk': { placeholder: 'bc-ui-trigger-ask', fallback: 'Ask a question…' },
  'ui.drawerAriaLabel': { placeholder: 'bc-ui-drawer-aria-label', fallback: 'AI assistant' },
  'ui.drawerTitle': { placeholder: 'bc-ui-drawer-title', fallback: 'Ask AI' },
  'ui.clearLabel': { placeholder: 'bc-ui-clear-label', fallback: 'Clear' },
  'ui.clearAriaLabel': { placeholder: 'bc-ui-clear-aria-label', fallback: 'Clear conversation' },
  'ui.bottomBar.label': { placeholder: 'bc-ui-bottom-bar-label', fallback: 'Ask AI' },
  'ui.bottomBar.expandAria': {
    placeholder: 'bc-ui-bottom-bar-expand-aria',
    fallback: 'Expand Ask AI ask bar',
  },
  'ui.bottomBar.openAria': { placeholder: 'bc-ui-bottom-bar-open-aria', fallback: 'Open Ask AI' },
  'ui.bottomBar.inputPlaceholder': {
    placeholder: 'bc-ui-bottom-bar-input-placeholder',
    fallback: 'Ask a question…',
  },
  'ui.bottomBar.inputAria': { placeholder: 'bc-ui-bottom-bar-input-aria', fallback: 'Ask a question' },
  'ui.bottomBar.sendAria': { placeholder: 'bc-ui-bottom-bar-send-aria', fallback: 'Send' },
  'ui.bottomBar.hideAria': { placeholder: 'bc-ui-bottom-bar-hide-aria', fallback: 'Hide ask bar' },
  'ui.bottomBar.hideLabel': { placeholder: 'bc-ui-bottom-bar-hide-label', fallback: 'Hide' },
  'ui.disclaimer.prefix': {
    placeholder: 'bc-ui-disclaimer-prefix',
    fallback: "Use of this AI chatbot is subject to Adobe's ",
  },
  'ui.disclaimer.privacyLabel': {
    placeholder: 'bc-ui-disclaimer-privacy-label',
    fallback: 'Privacy Policy',
  },
  'ui.disclaimer.middle': {
    placeholder: 'bc-ui-disclaimer-middle',
    fallback:
      ". Don't share sensitive data. AI responses are not your Content, may be inaccurate, and any offers provided are non-binding. ",
  },
  'ui.disclaimer.termsLabel': {
    placeholder: 'bc-ui-disclaimer-terms-label',
    fallback: 'Generative AI Terms',
  },
  'ui.disclaimer.suffix': { placeholder: 'bc-ui-disclaimer-suffix', fallback: '.' },
  'text.welcome.heading': {
    placeholder: 'bc-text-welcome-heading',
    fallback: 'Not sure where to start?<br>Ask me anything about Adobe products.',
  },
  'text.welcome.subheading': {
    placeholder: 'bc-text-welcome-subheading',
    fallback: 'Type your question or pick a suggestion below.',
  },
  'text.input.placeholder': { placeholder: 'bc-text-input-placeholder', fallback: 'Ask a question…' },
  'text.input.messageInput.aria': {
    placeholder: 'bc-text-input-message-input-aria',
    fallback: 'Message input',
  },
  'text.input.send.aria': { placeholder: 'bc-text-input-send-aria', fallback: 'Send message' },
  'text.input.mic.aria': { placeholder: 'bc-text-input-mic-aria', fallback: 'Voice input' },
  'text.card.aria.select': { placeholder: 'bc-text-card-aria-select', fallback: 'Select example message' },
  'text.carousel.prev.aria': { placeholder: 'bc-text-carousel-prev-aria', fallback: 'Previous cards' },
  'text.carousel.next.aria': { placeholder: 'bc-text-carousel-next-aria', fallback: 'Next cards' },
  'text.scroll.bottom.aria': { placeholder: 'bc-text-scroll-bottom-aria', fallback: 'Scroll to bottom' },
  'text.error.network': {
    placeholder: 'bc-text-error-network',
    fallback: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
  },
  'text.error.general': {
    placeholder: 'bc-text-error-general',
    fallback: "I'm sorry, something went wrong. Please try again in a moment.",
  },
  'text.loading.message': {
    placeholder: 'bc-text-loading-message',
    fallback: "Generating from Adobe's trusted resources",
  },
  'text.feedback.dialog.title.positive': {
    placeholder: 'bc-text-feedback-dialog-title-positive',
    fallback: 'Your feedback is appreciated',
  },
  'text.feedback.dialog.title.negative': {
    placeholder: 'bc-text-feedback-dialog-title-negative',
    fallback: 'Your feedback is appreciated',
  },
  'text.feedback.dialog.question.positive': {
    placeholder: 'bc-text-feedback-dialog-question-positive',
    fallback: 'What went well? Select all that apply.',
  },
  'text.feedback.dialog.question.negative': {
    placeholder: 'bc-text-feedback-dialog-question-negative',
    fallback: 'What went wrong? Select all that apply.',
  },
  'text.feedback.dialog.notes': { placeholder: 'bc-text-feedback-dialog-notes', fallback: 'Notes' },
  'text.feedback.dialog.submit': { placeholder: 'bc-text-feedback-dialog-submit', fallback: 'Submit' },
  'text.feedback.dialog.cancel': { placeholder: 'bc-text-feedback-dialog-cancel', fallback: 'Cancel' },
  'text.feedback.dialog.notes.placeholder': {
    placeholder: 'bc-text-feedback-dialog-notes-placeholder',
    fallback: 'Additional notes (optional)',
  },
  'text.feedback.toast.success': {
    placeholder: 'bc-text-feedback-toast-success',
    fallback: 'Thank you for the feedback.',
  },
  'text.feedback.thumbsUp.aria': {
    placeholder: 'bc-text-feedback-thumbs-up-aria',
    fallback: 'Thumbs up',
  },
  'text.feedback.thumbsDown.aria': {
    placeholder: 'bc-text-feedback-thumbs-down-aria',
    fallback: 'Thumbs down',
  },
  'arrays.welcome.examples.0': {
    placeholder: 'bc-welcome-examples-0',
    fallback: 'Where can I go to learn about AI on Experience League?',
  },
  'arrays.welcome.examples.1': {
    placeholder: 'bc-welcome-examples-1',
    fallback: 'Getting started with Experience Manager',
  },
  'arrays.welcome.examples.2': {
    placeholder: 'bc-welcome-examples-2',
    fallback: 'How do I set up my Workfront instance for my team?',
  },
  'arrays.welcome.examples.3': {
    placeholder: 'bc-welcome-examples-3',
    fallback: 'How do I get started with a journey in Adobe Journey Optimizer?',
  },
  'arrays.welcome.examples.4': {
    placeholder: 'bc-welcome-examples-4',
    fallback: 'What is CX Enterprise Coworker?',
  },
  'arrays.feedback.positive.options.0': {
    placeholder: 'bc-feedback-positive-options-0',
    fallback: 'Helpful and relevant',
  },
  'arrays.feedback.positive.options.1': {
    placeholder: 'bc-feedback-positive-options-1',
    fallback: 'Clear and easy to understand',
  },
  'arrays.feedback.positive.options.2': {
    placeholder: 'bc-feedback-positive-options-2',
    fallback: 'Friendly and conversational tone',
  },
  'arrays.feedback.positive.options.3': {
    placeholder: 'bc-feedback-positive-options-3',
    fallback: 'Other',
  },
  'arrays.feedback.negative.options.0': {
    placeholder: 'bc-feedback-negative-options-0',
    fallback: 'Not helpful or relevant',
  },
  'arrays.feedback.negative.options.1': {
    placeholder: 'bc-feedback-negative-options-1',
    fallback: 'Confusing or unclear',
  },
  'arrays.feedback.negative.options.2': {
    placeholder: 'bc-feedback-negative-options-2',
    fallback: 'Too formal or robotic',
  },
  'arrays.feedback.negative.options.3': {
    placeholder: 'bc-feedback-negative-options-3',
    fallback: 'Other',
  },
};

function normalizeContentKey(key) {
  const mappedPath = Object.entries(BC_CONTENT_KEY_MAP).find(([, { placeholder }]) => placeholder === key)?.[0];
  if (mappedPath) return mappedPath;

  const arrayMatch = key.match(/^bc-(welcome-examples|feedback-positive-options|feedback-negative-options)-(\d+)$/);
  if (!arrayMatch) return key;

  const [, arrayName, index] = arrayMatch;
  const arrayPaths = {
    'welcome-examples': 'arrays.welcome.examples',
    'feedback-positive-options': 'arrays.feedback.positive.options',
    'feedback-negative-options': 'arrays.feedback.negative.options',
  };
  return `${arrayPaths[arrayName]}.${index}`;
}

const SHEET_BASE_PATH = window.hlx.codeBasePath;

const LOCALES = {
  en: { language: 'en-US' },
  es: { language: 'es-ES' },
};

export const SUPPORTED_LOCALES = new Set(Object.keys(LOCALES));

const brandConciergeSheetRequests = new Map();

/**
 * Fetches published UE key-value rows for the specified language.
 *
 * Expected row format:
 * [
 *   { Key: 'bc-ui-drawer-title', Text: 'Ask AI' },
 *   { Key: 'bc-text-input-placeholder', Text: 'Ask a question…' },
 *   { Key: 'bc-welcome-examples-0', Text: 'Example question' }
 * ]
 * @param {string} lang
 * @returns {Promise<Array<{key: string, value: string}>>}
 */

async function fetchBrandConciergeJson(lang) {
  if (!brandConciergeSheetRequests.has(lang)) {
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
          const rowKey = row?.Key ?? row?.key;
          const key = typeof rowKey === 'string' ? rowKey.trim() : '';
          const prompt = row?.['Default prompts'] ?? row?.['Default Prompts'];

          if (!key && prompt != null && String(prompt).trim()) {
            const promptRow = {
              key: `arrays.welcome.examples.${promptIndex}`,
              value: prompt,
              isLegacyPromptRow: true,
            };
            promptIndex += 1;
            return promptRow;
          }

          return {
            key: rowKey,
            value: row?.Text ?? row?.value ?? prompt,
          };
        });
      })
      .catch((err) => {
        brandConciergeSheetRequests.delete(lang);
        throw err;
      });

    brandConciergeSheetRequests.set(lang, request);
  }

  return brandConciergeSheetRequests.get(lang);
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

  let promptIndex = 0;

  rows.forEach((row) => {
    let key = normalizeContentKey(String(row?.key ?? '').trim());
    let value = row?.value;

    // Support legacy spreadsheets containing only "Default prompts".
    if (!key && row?.['Default prompts'] != null) {
      value = row['Default prompts'];
      key = `arrays.welcome.examples.${promptIndex}`;
      promptIndex += 1;
    }

    if (!key || value == null) return;

    const normalizedValue = String(value);

    // Ignore blank scalar values so locale fallbacks remain intact.
    // Preserve whitespace in nonblank values.
    if ((key.startsWith('ui.') || key.startsWith('text.')) && !normalizedValue.trim()) {
      return;
    }

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

function getDefaultContentConfig() {
  const defaultRows = Object.entries(BC_CONTENT_KEY_MAP).map(([key, { fallback }]) => ({
    key,
    value: fallback,
  }));
  return rowsToConfig(defaultRows);
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
    const englishRows = await fetchBrandConciergeJson('en');
    const englishSheet = rowsToConfig(englishRows);
    const defaults = getDefaultContentConfig();
    const englishArrays = mergeLocaleArrays(defaults.arrays, englishSheet.arrays);
    if (englishRows.some((row) => row.isLegacyPromptRow) && englishSheet.arrays['welcome.examples']?.length) {
      englishArrays['welcome.examples'] = englishSheet.arrays['welcome.examples'];
    }

    english = {
      ui: deepMerge(defaults.ui, englishSheet.ui),
      text: {
        ...defaults.text,
        ...englishSheet.text,
      },
      arrays: englishArrays,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[BC] English UE spreadsheet failed to load; skipping mount', err?.message || err);
    return null;
  }

  let locale = english;
  let appliedKey = 'en';

  if (key !== 'en') {
    try {
      const localeRows = await fetchBrandConciergeJson(key);
      const localized = rowsToConfig(localeRows);

      // Apply localized chrome only for registered locales.
      // Allow other languages to supply localized welcome prompts.
      if (SUPPORTED_LOCALES.has(key)) {
        locale = localized;
        appliedKey = key;
      } else {
        locale = {
          ...english,
          arrays: localized.arrays,
        };
      }
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
