/**
 * ExL Brand Concierge bootstrap configuration.
 * Passed as `stylingConfigurations` to window.adobe.concierge.bootstrap().
 */

/**
 * Reads resolved CSS custom property values from ExL's root styles.
 * This keeps BC's theme in sync with styles.css automatically — no manual
 * updates needed when ExL's design tokens change.
 * @param {string} name - CSS custom property name (e.g. '--non-spectrum-navy-blue').
 * @param {string} fallback - Value to use if the property is empty or unset.
 * @returns {string} The resolved value, or the fallback.
 */
const rootStyles = getComputedStyle(document.documentElement);

function exlVar(name, fallback) {
  return rootStyles.getPropertyValue(name).trim() || fallback;
}

/**
 * Derives a namespace key from the current URL path so that each ExL product
 * surface maintains its own conversation history in local storage.
 * @returns {string} A stable, URL-derived storage namespace.
 */
function getProductNamespace() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const key = segments.slice(0, 3).join('-');
  return key ? `exl-bc-${key}` : 'exl-bc';
}

const brandConciergeConfig = {
  // ── Bootstrap options ────────────────────────────────────────────────────
  // `stickySession` is destructured out in brand-concierge.js before the rest
  // of this object is forwarded to bootstrap() as `stylingConfigurations`.
  stickySession: false,

  // ── Metadata ─────────────────────────────────────────────────────────────
  metadata: {
    brandName: 'Experience League',
    version: '1.0.0',
    language: document.querySelector('html').lang || 'en-US',
    namespace: getProductNamespace(),
  },

  // ── UI strings ───────────────────────────────────────────────────────────
  text: {
    'welcome.heading': 'Not sure where to start?<br>Ask me anything about Adobe products.',
    'welcome.subheading': 'Type your question or pick a suggestion below.',
    'input.placeholder': 'Ask a question about Adobe products…',
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

  // ── Arrays ───────────────────────────────────────────────────────────────
  arrays: {
    // Welcome example cards. Supported fields: { text, image, backgroundColor }.
    // `image` and `backgroundColor` are optional.
    // Add product imagery URLs once confirmed with the design team.
    'welcome.examples': [
      { text: 'Get started with Adobe Experience Manager', backgroundColor: '#e0f2ff' },
      { text: 'Set up an Adobe Analytics report suite', backgroundColor: '#cef8e0' },
      { text: 'Troubleshoot my Adobe Campaign delivery', backgroundColor: '#f6ebff' },
      { text: 'Explain Adobe Target A/B testing', backgroundColor: '#ffeccc' },
    ],
    'feedback.positive.options': [
      'Helpful and relevant',
      'Clear and easy to understand',
      'Friendly and conversational tone',
      'Other',
    ],
    'feedback.negative.options': ['Not helpful or relevant', 'Confusing or unclear', 'Too formal or robotic', 'Other'],
  },

  // ── Theme ────────────────────────────────────────────────────────────────
  // CSS variable overrides. Philosophy: only set what diverges from BC defaults
  // or needs tuning for the compact dialog context.
  //
  // Submit button background/icon are in brand-concierge.css (need !important).
  theme: {
    // ── Typography ────────────────────────────────────────────────────────
    // Reads --body-font-family from styles.css so font changes propagate automatically.
    '--font-family': exlVar(
      '--body-font-family',
      '"Adobe Clean", adobe-clean, "Source Sans Pro", -apple-system, system-ui, "Segoe UI", roboto, ubuntu, "Trebuchet MS", "Lucida Grande", sans-serif',
    ),

    // ── Primary colour ────────────────────────────────────────────────────
    // Reads ExL design tokens so BC stays in sync when brand colours change.
    '--color-primary': exlVar('--non-spectrum-navy-blue', '#1473e6'),
    '--color-primary-hover': exlVar('--non-spectrum-dark-navy-blue', '#0265dc'),
    '--color-primary-alpha': exlVar('--non-spectrum-navy-blue-alpha', 'rgba(20, 115, 230, 0.25)'),

    // ── Buttons ───────────────────────────────────────────────────────────
    '--color-button-primary': exlVar('--non-spectrum-navy-blue', '#1473e6'),
    '--color-button-primary-hover': exlVar('--non-spectrum-dark-navy-blue', '#0265dc'),
    '--color-button-primary-border': exlVar('--non-spectrum-navy-blue', '#1473e6'),

    // ── Message bubbles ───────────────────────────────────────────────────
    '--color-message-user': exlVar('--non-spectrum-navy-blue', '#1473e6'),

    // ── Welcome screen ────────────────────────────────────────────────────
    // Show suggested questions above the input field.
    '--welcome-input-order': '3',
    '--welcome-cards-order': '2',
    '--welcome-padding': '12px 0',
    '--card-width': '300px',

    // ── Prompt pills ──────────────────────────────────────────────────────
    // Full-width pills with tighter spacing for the compact dialog.
    '--prompt-suggestions-button-width': '100%',
    '--prompt-suggestions-button-width-max': '100%',
    '--prompt-pill-container-list-gap': '8px',
    '--prompt-pill-padding': '10px 14px',

    // ── Input bar (scaled ~20% smaller than BC defaults) ─────────────────
    '--input-height': '52px', // default 64px
    '--input-max-height': '96px', // default 120px
    '--input-padding': '0 4px 0 10px', // tighter than default 0 8px 0 24px
    '--input-font-size': '13px', // default 18px (subheading)
    '--input-container-gap': '5px', // default 12px
    // Target input buttons specifically to avoid affecting carousel/scroll buttons.
    '--input-button-width': '36px', // default 44px (button-height-m)
    '--input-button-height': '36px', // default 44px (button-height-m)
    '--mic-button-icon-size': '18px', // default 24px
    '--submit-button-icon-size': '16px', // default 20px

    // ── Container padding ─────────────────────────────────────────────────
    // BC's 24px desktop padding is sized for full-page; halve for the dialog.
    '--container-padding-desktop': '8px',
    '--container-padding-mobile': '8px',
  },
};

export default brandConciergeConfig;
