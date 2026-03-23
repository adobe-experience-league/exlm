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
      { text: 'Get started with Adobe Experience Manager' },
      { text: 'Set up an Adobe Analytics report suite' },
      { text: 'Troubleshoot my Adobe Campaign delivery' },
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

export default brandConciergeConfig;
