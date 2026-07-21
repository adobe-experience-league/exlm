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

  text: {
    'welcome.heading': 'Not sure where to start?<br>Ask me anything about Adobe products.',
    'welcome.subheading': 'Type your question or pick a suggestion below.',
    'input.placeholder': 'Ask a question…',
    'input.messageInput.aria': 'Message input',
    'input.send.aria': 'Send message',
    'input.mic.aria': 'Voice input',
    'card.aria.select': 'Select example message',
    'carousel.prev.aria': 'Previous cards',
    'carousel.next.aria': 'Next cards',
    'scroll.bottom.aria': 'Scroll to bottom',
    'error.network': "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
    'error.general': "I'm sorry, something went wrong. Please try again in a moment.",
    'loading.message': "Generating from Adobe's trusted resources",
    'feedback.dialog.title.positive': 'Your feedback is appreciated',
    'feedback.dialog.title.negative': 'Your feedback is appreciated',
    'feedback.dialog.question.positive': 'What went well? Select all that apply.',
    'feedback.dialog.question.negative': 'What went wrong? Select all that apply.',
    'feedback.dialog.notes': 'Notes',
    'feedback.dialog.submit': 'Submit',
    'feedback.dialog.cancel': 'Cancel',
    'feedback.dialog.notes.placeholder': 'Additional notes (optional)',
    'feedback.toast.success': 'Thank you for the feedback.',
    'feedback.thumbsUp.aria': 'Thumbs up',
    'feedback.thumbsDown.aria': 'Thumbs down',
  },

  arrays: {
    'welcome.examples': [
      { text: 'Where can I go to learn about AI on Experience League?' },
      { text: 'Getting started with Experience Manager' },
      { text: 'Set up an Adobe Analytics report suite' },
      { text: 'Explain Adobe Target A/B testing' },
    ],
    'feedback.positive.options': [
      'Helpful and relevant',
      'Clear and easy to understand',
      'Friendly and conversational tone',
      'Other',
    ],
    'feedback.negative.options': ['Not helpful or relevant', 'Confusing or unclear', 'Too formal or robotic', 'Other'],
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

/**
 * English chrome strings (trigger button, drawer, clear control, legal disclaimer).
 * These render from ExL's own code in brand-concierge.js (not forwarded to the BC web
 * client), so they live here alongside the client-facing `text`/`arrays` above and are
 * threaded through as `config.ui`. 'BETA' is intentionally left untranslated (brand term).
 */
const BC_UI_EN = {
  triggerAriaLabel: 'Open AI assistant',
  triggerAsk: 'Ask a question',
  drawerAriaLabel: 'AI assistant',
  drawerTitle: 'Ask',
  clearLabel: 'Clear',
  clearAriaLabel: 'Clear conversation',
  disclaimer: {
    prefix: "Use of this beta AI chatbot is subject to Adobe's ",
    privacyLabel: 'Privacy Policy',
    middle:
      ". Don't share sensitive data. AI responses are not your Content, may be inaccurate, and any offers provided are non-binding. ",
    termsLabel: 'Generative AI Terms',
    suffix: '.',
  },
};

/**
 * Per-locale overlays merged onto the English base by resolveBrandConciergeConfig().
 * Keyed by getPathDetails().lang (e.g. 'es' for /es/... paths). Translations are
 * review-pending — legal disclaimer copy in particular needs sign-off before launch.
 */
const BC_LOCALES = {
  es: {
    language: 'es-ES',
    // Spanish Brand Concierge datastream (same IMS org as the default). Routes /es/ conversations
    // to the Spanish concierge/manifest instead of the default English datastream.
    datastreamId: '3098f7cc-36bb-4965-bea3-6e80fc59571e',
    ui: {
      triggerAriaLabel: 'Abrir el asistente de IA',
      triggerAsk: 'Hacer una pregunta',
      drawerAriaLabel: 'Asistente de IA',
      drawerTitle: 'Preguntar',
      clearLabel: 'Borrar',
      clearAriaLabel: 'Borrar conversación',
      disclaimer: {
        prefix: 'El uso de este chatbot de IA en versión beta está sujeto a la ',
        privacyLabel: 'Política de privacidad',
        middle:
          ' de Adobe. No comparta datos confidenciales. Las respuestas de la IA no son su Contenido, pueden ser inexactas y cualquier oferta proporcionada no es vinculante. ',
        termsLabel: 'Términos de IA generativa',
        suffix: '.',
      },
    },
    text: {
      'welcome.heading': '¿No sabe por dónde empezar?<br>Pregúnteme lo que quiera sobre los productos de Adobe.',
      'welcome.subheading': 'Escriba su pregunta o elija una sugerencia a continuación.',
      'input.placeholder': 'Haga una pregunta…',
      'input.messageInput.aria': 'Campo de mensaje',
      'input.send.aria': 'Enviar mensaje',
      'input.mic.aria': 'Entrada de voz',
      'card.aria.select': 'Seleccionar mensaje de ejemplo',
      'carousel.prev.aria': 'Tarjetas anteriores',
      'carousel.next.aria': 'Tarjetas siguientes',
      'scroll.bottom.aria': 'Desplazarse hasta abajo',
      'error.network':
        'Lo sentimos, en este momento tenemos problemas de conexión. Vuelva a intentarlo en unos instantes.',
      'error.general': 'Lo sentimos, se ha producido un error. Vuelva a intentarlo en unos instantes.',
      'loading.message': 'Generando a partir de los recursos fiables de Adobe',
      'feedback.dialog.title.positive': 'Agradecemos sus comentarios',
      'feedback.dialog.title.negative': 'Agradecemos sus comentarios',
      'feedback.dialog.question.positive': '¿Qué salió bien? Seleccione todas las opciones aplicables.',
      'feedback.dialog.question.negative': '¿Qué salió mal? Seleccione todas las opciones aplicables.',
      'feedback.dialog.notes': 'Notas',
      'feedback.dialog.submit': 'Enviar',
      'feedback.dialog.cancel': 'Cancelar',
      'feedback.dialog.notes.placeholder': 'Notas adicionales (opcional)',
      'feedback.toast.success': 'Gracias por sus comentarios.',
      'feedback.thumbsUp.aria': 'Me gusta',
      'feedback.thumbsDown.aria': 'No me gusta',
    },
    arrays: {
      'welcome.examples': [
        { text: '¿Dónde puedo aprender sobre la IA en Experience League?' },
        { text: 'Primeros pasos con Experience Manager' },
        { text: 'Configurar un conjunto de informes de Adobe Analytics' },
        { text: 'Explicar las pruebas A/B de Adobe Target' },
      ],
      'feedback.positive.options': [
        'Útil y relevante',
        'Claro y fácil de entender',
        'Tono cercano y conversacional',
        'Otro',
      ],
      'feedback.negative.options': [
        'Poco útil o irrelevante',
        'Confuso o poco claro',
        'Demasiado formal o robótico',
        'Otro',
      ],
    },
  },
};

/**
 * Resolves the BC config for a given path language, layering any locale overlay onto the
 * English base. English (and any unknown lang) returns the base config plus English `ui`.
 * Pure function — the caller supplies `lang` (from getPathDetails().lang) so this module
 * stays free of a scripts.js import and its cyclic dependency.
 * @param {string} [lang] - Path language, e.g. 'en', 'es'.
 * @returns {typeof brandConciergeConfig & { ui: typeof BC_UI_EN }}
 */
export function resolveBrandConciergeConfig(lang) {
  const overlay = BC_LOCALES[(lang || 'en').toLowerCase()];
  if (!overlay) {
    return { ...brandConciergeConfig, ui: BC_UI_EN };
  }
  return {
    ...brandConciergeConfig,
    ui: { ...BC_UI_EN, ...overlay.ui },
    text: { ...brandConciergeConfig.text, ...overlay.text },
    arrays: { ...brandConciergeConfig.arrays, ...overlay.arrays },
    metadata: {
      ...brandConciergeConfig.metadata,
      ...(overlay.language ? { language: overlay.language } : {}),
    },
    // Locale-specific Edge datastream, consumed in brand-concierge.js; falls back to the
    // default bcDatastreamId when a locale defines none.
    ...(overlay.datastreamId ? { datastreamId: overlay.datastreamId } : {}),
  };
}

export default brandConciergeConfig;
