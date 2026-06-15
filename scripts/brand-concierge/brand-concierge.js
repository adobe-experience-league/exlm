// eslint-disable-next-line import/no-cycle
import { getConfig } from '../scripts.js';
import { loadScript, decorateIcon } from '../lib-franklin.js';
import { openDrawer } from '../dialog/dialog.js';
import brandConciergeConfig from './brand-concierge-config.js';

// Separate alloy instance avoids conflicting with the Launch-owned window.alloy.
const ALLOY_INSTANCE_NAME = 'alloyBC';
const MOUNT_SELECTOR = '#brand-concierge-mount';
const DIALOG_ID = 'bc-dialog';
const TRIGGER_ID = 'bc-trigger';
const HEADER_CLEAR_ID = 'bc-header-clear';
const PANEL_DISCLAIMER_ID = 'bc-panel-disclaimer';

/** Pixels from the bottom of `.chat-history` treated as “at bottom”. */
const SCROLL_BOTTOM_THRESHOLD = 32;
/** Space between the last chat message and the message input when scrolled to bottom. */
const CHAT_HISTORY_BOTTOM_GAP = 16;

/** Mutations inside these regions should not re-run question pinning / scroll alignment. */
const PIN_IGNORE_SELECTOR =
  '.citations-accordion, .citations-section, .citations-source-item, .citations-link, .bc-response-footer, .prompt-suggestions-container';

/** How long to hold scroll position after a new question (BC may auto-scroll to bottom). */
const SCROLL_AFTER_SUGGESTION_PIN_MS = 3500;
/** Retry cadence (ms) for re-applying scroll position while BC settles its DOM after a query. */
const SCROLL_PIN_RETRY_DELAYS_MS = [16, 50, 120, 250, 500, 1000, 1800];

const SUGGESTION_CLICK_SELECTOR =
  '.bc-prompt-suggestion-button, .bc-prompt-pill-button, .prompt-suggestions-container button, .widget-options-container button';

/** BC `onEvent` types (see mt enum in the web client bundle). */
const BC_EVENT_PROMPT_CLICKED = 'promptSuggestion:clicked';
const BC_EVENT_QUERY_SUBMITTED = 'query:submitted';
const BC_EVENT_RESPONSE_STARTED = 'response:started';

const SCROLL_EVENT_TYPES = new Set([BC_EVENT_PROMPT_CLICKED, BC_EVENT_QUERY_SUBMITTED, BC_EVENT_RESPONSE_STARTED]);

/** Brand Concierge web client transcript keys (see ChatTranscriptStorage in bc main.js). */
const BC_STORAGE_TRANSCRIPT_PREFIX = 'bc_chat_transcript_';
const BC_STORAGE_METADATA_KEY = 'bc_chat_metadata';

const PRIVACY_POLICY_URL = 'https://www.adobe.com/privacy/policy.html';
const GENERATIVE_AI_TERMS_URL = 'https://www.adobe.com/legal/licenses-terms/adobe-gen-ai-user-guidelines.html';

const isDev = !['experienceleague.adobe.com'].includes(window.location.hostname);
// eslint-disable-next-line no-console
const log = (...args) => isDev && console.log('[BC]', ...args);
// eslint-disable-next-line no-console
const warn = (...args) => console.warn('[BC]', ...args);
// eslint-disable-next-line no-console
const error = (...args) => console.error('[BC]', ...args);

let cssLinkEl = null;
let drawerHandle = null;
let inputLabelIconObserver = null;
let panelDisclaimerObserver = null;
let scrollToBottomWatcher = null;
let scrollAfterSuggestionObserver = null;
let scrollAfterSuggestionTimers = [];
let scrollPinCleanupTimerId = null;
let scrollPinRafId = null;
let scrollPinUserScrollCleanup = null;
let mountInteractionHandler = null;
let mountWithHandler = null;
let keyboardScrollHandler = null;
let keyboardScrollDialog = null;

/**
 * Removes persisted BC chat sessions from localStorage (transcript + metadata).
 * @param {{ broad?: boolean }} [options] - If broad, also remove any key containing `bc_chat`.
 */
function clearBrandConciergeTranscriptStorage(options = {}) {
  const { broad = false } = options;
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (
      key &&
      (key === BC_STORAGE_METADATA_KEY ||
        key.startsWith(BC_STORAGE_TRANSCRIPT_PREFIX) ||
        (broad && key.includes('bc_chat')))
    ) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}

/**
 * BC renders inline SVG sparkles in several places; swap them for icons/bc-ask-sparkles.svg.
 */
function patchBcSparkleIcons(mount) {
  if (!mount) return;

  const run = () => {
    const sparkleSrc = `${window.hlx.codeBasePath}/icons/bc-ask-sparkles.svg`;
    const labelSvg = mount.querySelector('label.ai-chat-label svg');
    if (labelSvg) {
      const img = document.createElement('img');
      img.src = sparkleSrc;
      img.alt = '';
      img.width = 20;
      img.height = 20;
      img.setAttribute('aria-hidden', 'true');
      img.className = 'bc-input-label-sparkle';
      labelSvg.replaceWith(img);
    }

    mount
      .querySelectorAll('.bc-card__icon svg, .bc-prompt-pill-button__icon svg, .bc-prompt-suggestion-button__icon svg')
      .forEach((svg) => {
        /* In-chat follow-up suggestions: keep BC’s default icon (do not swap). */
        if (svg.closest('.chat-history') && svg.closest('.bc-prompt-suggestion-button')) {
          return;
        }
        const img = document.createElement('img');
        img.src = sparkleSrc;
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.className = 'bc-sparkle-img';
        svg.replaceWith(img);
      });
  };

  run();
  inputLabelIconObserver?.disconnect();
  inputLabelIconObserver = new MutationObserver(run);
  inputLabelIconObserver.observe(mount, { childList: true, subtree: true });
}

function buildPanelDisclaimer() {
  const disclaimer = document.createElement('p');
  disclaimer.id = PANEL_DISCLAIMER_ID;
  disclaimer.className = 'bc-panel-disclaimer';

  const privacyLink = document.createElement('a');
  privacyLink.href = PRIVACY_POLICY_URL;
  privacyLink.target = '_blank';
  privacyLink.rel = 'noopener noreferrer';
  privacyLink.textContent = 'Privacy Policy';

  const termsLink = document.createElement('a');
  termsLink.href = GENERATIVE_AI_TERMS_URL;
  termsLink.target = '_blank';
  termsLink.rel = 'noopener noreferrer';
  termsLink.textContent = 'Generative AI Terms';

  disclaimer.append(
    document.createTextNode("Use of this beta AI chatbot is subject to Adobe's "),
    privacyLink,
    document.createTextNode(
      ". Don't share sensitive data. AI responses are not your Content, may be inaccurate, and any offers provided are non-binding. ",
    ),
    termsLink,
    document.createTextNode('.'),
  );

  return disclaimer;
}

/**
 * Legal copy below the chat input (drawer + expanded); re-inserts if BC re-renders the panel.
 */
function installPanelDisclaimer(mount) {
  if (!mount) return;
  const inputSection = mount.querySelector('.input-section');
  if (!inputSection || inputSection.querySelector(`#${PANEL_DISCLAIMER_ID}`)) return;
  inputSection.append(buildPanelDisclaimer());
}

function watchPanelDisclaimer(mount) {
  installPanelDisclaimer(mount);
  panelDisclaimerObserver?.disconnect();
  panelDisclaimerObserver = new MutationObserver(() => installPanelDisclaimer(mount));
  panelDisclaimerObserver.observe(mount, { childList: true, subtree: true });
}

/**
 * Focus the BC message field once it exists (injected after web client bootstrap).
 */
function focusBcChatInputWhenReady(mount) {
  if (!mount) return;

  let timeoutId;
  let obs;

  const cleanup = () => {
    obs?.disconnect();
    if (timeoutId) window.clearTimeout(timeoutId);
  };

  const tryFocus = () => {
    const input = mount.querySelector('.chat-input--input');
    if (input && document.contains(input) && typeof input.focus === 'function') {
      input.focus({ preventScroll: true });
      cleanup();
      return true;
    }
    return false;
  };

  if (tryFocus()) return;

  obs = new MutationObserver(() => {
    tryFocus();
  });
  obs.observe(mount, { childList: true, subtree: true });
  timeoutId = window.setTimeout(cleanup, 8000);
}

function shouldShowScrollToBottomButton(history) {
  if (!history) return false;
  const { scrollTop, scrollHeight, clientHeight } = history;
  if (scrollHeight - clientHeight <= 1) return false;
  return scrollHeight - scrollTop - clientHeight > SCROLL_BOTTOM_THRESHOLD;
}

function scrollChatHistoryToBottom(mount) {
  const history = mount?.querySelector('.chat-history');
  if (!history) return;
  history.scrollTo({ top: history.scrollHeight, behavior: 'smooth' });
}

/** Places the scroll button above the input and sets chat-history bottom padding (excludes gradient fade). */
function updateInputOverlayLayout(mount) {
  const history = mount?.querySelector('.chat-history');
  const inputSection = mount?.querySelector('.input-section');
  const inputContainer = mount?.querySelector('.input-container');
  if (!history || !inputSection || !inputContainer) return;

  const sectionRect = inputSection.getBoundingClientRect();
  const inputRect = inputContainer.getBoundingClientRect();

  const clearance = Math.ceil(sectionRect.bottom - inputRect.top + CHAT_HISTORY_BOTTOM_GAP);
  history.style.setProperty('--bc-chat-history-clearance', `${clearance}px`);

  const scrollBtn = mount.querySelector('.scroll-to-bottom');
  if (!scrollBtn) return;

  if (scrollBtn.parentElement !== inputSection) {
    inputSection.prepend(scrollBtn);
  }

  scrollBtn.style.bottom = '';
  scrollBtn.style.left = '';
  scrollBtn.style.right = '';
  scrollBtn.style.position = '';
}

function syncScrollToBottomButton(mount) {
  updateInputOverlayLayout(mount);

  const history = mount?.querySelector('.chat-history');
  const scrollBtn = mount?.querySelector('.scroll-to-bottom');
  if (!history || !scrollBtn) return;

  const inWelcomeState = mount.querySelector('.brand-concierge-container.initial-state');
  const visible = !inWelcomeState && shouldShowScrollToBottomButton(history);

  scrollBtn.classList.toggle('bc-scroll-to-bottom-visible', visible);
}

function getBrandConciergeMount() {
  return document.getElementById('brand-concierge-mount') || document.querySelector(MOUNT_SELECTOR);
}

function stopScrollPin() {
  if (scrollPinRafId) {
    window.cancelAnimationFrame(scrollPinRafId);
    scrollPinRafId = null;
  }
  scrollPinUserScrollCleanup?.();
  scrollPinUserScrollCleanup = null;
}

function clearScrollAfterSuggestionSchedule() {
  scrollAfterSuggestionTimers.forEach((id) => window.clearTimeout(id));
  scrollAfterSuggestionTimers = [];
  scrollAfterSuggestionObserver?.disconnect();
  scrollAfterSuggestionObserver = null;
  if (scrollPinCleanupTimerId !== null) {
    window.clearTimeout(scrollPinCleanupTimerId);
    scrollPinCleanupTimerId = null;
  }
  stopScrollPin();
}

function isInsidePinIgnoredRegion(node) {
  return node instanceof Element && !!node.closest(PIN_IGNORE_SELECTOR);
}

function mutationShouldTriggerExchangePin(mutation) {
  if (mutation.type !== 'childList') return false;
  if (isInsidePinIgnoredRegion(mutation.target)) return false;
  if ([...mutation.addedNodes, ...mutation.removedNodes].some((node) => isInsidePinIgnoredRegion(node))) {
    return false;
  }
  return true;
}

function getMessageScrollTopInHistory(history, messageEl) {
  return messageEl.getBoundingClientRect().top - history.getBoundingClientRect().top + history.scrollTop;
}

function ensureExchangeScrollRoom(history, userMessageEl, userMessageCount) {
  const currentMin = parseInt(history.style.minHeight || '0', 10) || 0;
  if (userMessageCount < 2) {
    if (currentMin > 0) history.style.removeProperty('min-height');
    return;
  }
  if (!userMessageEl) return;

  const neededMinHeight = getMessageScrollTopInHistory(history, userMessageEl) + history.clientHeight;
  // Intentional one-way ratchet: min-height only grows to accommodate the latest exchange.
  // It resets only when userMessageCount < 2 (clear/re-bootstrap). Long sessions accumulate
  // a large value but BC refreshes the DOM on conversation clear, so it never persists.
  if (neededMinHeight > currentMin) {
    history.style.setProperty('min-height', `${Math.ceil(neededMinHeight)}px`);
  }
}

function resolveExchangeScrollTop(mount) {
  const history = mount?.querySelector('.chat-history');
  if (!history) return 0;

  const userMessages = history.querySelectorAll('.user-message');
  if (userMessages.length === 0) {
    history.style.removeProperty('min-height');
    return 0;
  }

  const userMessage = userMessages[userMessages.length - 1];
  ensureExchangeScrollRoom(history, userMessage, userMessages.length);

  const messageMarginTop = parseInt(window.getComputedStyle(userMessage).marginTop, 10) || 0;

  const offsetTop = getMessageScrollTopInHistory(history, userMessage);
  return Math.max(0, offsetTop - messageMarginTop);
}

/*
 * NOTE: The rAF loop in startScrollPin is intentional and cannot be replaced by the mutation
 * observer + retry timeouts alone. BC's streaming renderer resets scrollTop to the bottom on
 * every content chunk it appends — effectively on every frame. Without a matching rAF loop
 * our position is overwritten between mutation callbacks, and the question-pin never sticks.
 * The forced-layout cost (~3 layout reads per frame × 3.5 s) is accepted as
 * the minimum overhead required to hold scroll position against BC's own auto-scroll.
 */
function startScrollPin(mount) {
  stopScrollPin();
  const history = mount?.querySelector('.chat-history');
  if (!history) return;

  const end = Date.now() + SCROLL_AFTER_SUGGESTION_PIN_MS;
  const onUserScroll = (e) => {
    if (e.isTrusted) stopScrollPin();
  };
  history.addEventListener('scroll', onUserScroll, true);
  scrollPinUserScrollCleanup = () => history.removeEventListener('scroll', onUserScroll, true);

  const tick = () => {
    if (Date.now() > end) {
      stopScrollPin();
      return;
    }
    history.scrollTop = resolveExchangeScrollTop(mount);
    scrollPinRafId = window.requestAnimationFrame(tick);
  };
  tick();
}

function applyExchangeScrollTop(mount) {
  const history = mount?.querySelector('.chat-history');
  if (!history) return;
  history.scrollTop = resolveExchangeScrollTop(mount);
}

function scheduleScrollAfterSuggestion(mount) {
  const chatHistory = mount?.querySelector('.chat-history');
  if (!chatHistory) return;

  clearScrollAfterSuggestionSchedule();
  startScrollPin(mount);

  const run = () => {
    applyExchangeScrollTop(mount);
    syncScrollToBottomButton(mount);
  };

  run();
  SCROLL_PIN_RETRY_DELAYS_MS.forEach((delay) => {
    scrollAfterSuggestionTimers.push(window.setTimeout(run, delay));
  });

  scrollAfterSuggestionObserver = new MutationObserver((mutations) => {
    if (!mutations.some(mutationShouldTriggerExchangePin)) return;
    run();
  });
  scrollAfterSuggestionObserver.observe(chatHistory, { childList: true, subtree: true });
  scrollPinCleanupTimerId = window.setTimeout(clearScrollAfterSuggestionSchedule, SCROLL_AFTER_SUGGESTION_PIN_MS + 500);
}

function handleBrandConciergeClientEvent(event) {
  if (!event?.eventType || !SCROLL_EVENT_TYPES.has(event.eventType)) return;

  const mount = getBrandConciergeMount();
  if (!mount) return;

  // response:started intentionally re-pins: if a new response begins while the user is still
  // reading a previous answer we want to re-anchor to their most recent question, not leave
  // them watching the bottom of a growing history panel.
  scheduleScrollAfterSuggestion(mount);
}

function getBootstrapOptions() {
  const { stickySession = false, ...stylingConfigurations } = brandConciergeConfig;
  return {
    instanceName: ALLOY_INSTANCE_NAME,
    stylingConfigurations,
    selector: MOUNT_SELECTOR,
    stickySession,
    onEvent: handleBrandConciergeClientEvent,
  };
}

function onMountInteraction(event) {
  const mount = /** @type {Element} */ (event.currentTarget);
  if (!mount) return;

  if (event.target.closest('.citations-accordion, .citations-accordion-button, .citations-section')) {
    clearScrollAfterSuggestionSchedule();
    return;
  }

  if (event.target.closest(SUGGESTION_CLICK_SELECTOR)) {
    // BC_EVENT_PROMPT_CLICKED also triggers scheduleScrollAfterSuggestion for suggestion
    // clicks, but SUGGESTION_CLICK_SELECTOR covers widget-options buttons and any click
    // paths that do not fire a BC onEvent (e.g. keyboard-activated clicks on some builds).
    scheduleScrollAfterSuggestion(mount);
  }
}

function removeQuestionPinHandlers() {
  if (mountInteractionHandler && mountWithHandler) {
    mountWithHandler.removeEventListener('click', mountInteractionHandler, true);
  }
  mountInteractionHandler = null;
  mountWithHandler = null;
  clearScrollAfterSuggestionSchedule();
}

function installQuestionPinHandlers(mount) {
  removeQuestionPinHandlers();
  if (!mount) return;

  mountInteractionHandler = onMountInteraction;
  mountWithHandler = mount;
  mount.addEventListener('click', mountInteractionHandler, true);
}

function rafDebounce(fn) {
  let id = null;
  const debounced = () => {
    if (!id)
      id = window.requestAnimationFrame(() => {
        id = null;
        fn();
      });
  };
  debounced.cancel = () => {
    if (id) {
      window.cancelAnimationFrame(id);
      id = null;
    }
  };
  return debounced;
}

/**
 * Shows BC’s scroll-to-bottom control only when `.chat-history` overflows and the
 * user is not already at the bottom; re-evaluates on scroll, resize, and content changes.
 */
function watchScrollToBottomButton(mount) {
  scrollToBottomWatcher?.cleanup();
  scrollToBottomWatcher = null;
  if (!mount) return;

  let history = null;
  let historyResizeObserver = null;
  let historyContentObserver = null;
  let debouncedHistoryUpdate = null;
  let scrollBtnStyleObserver = null;
  let inputAreaResizeObserver = null;

  const update = () => syncScrollToBottomButton(mount);

  // Scroll-only update: .input-section and .input-container are position:absolute bottom:0
  // and don't move during scroll, so skip the getBoundingClientRect calls in
  // updateInputOverlayLayout — only the button visibility needs re-evaluating.
  const scrollUpdate = () => {
    const scrollBtn = mount.querySelector('.scroll-to-bottom');
    if (!history || !scrollBtn) return;
    const inWelcomeState = mount.querySelector('.brand-concierge-container.initial-state');
    scrollBtn.classList.toggle(
      'bc-scroll-to-bottom-visible',
      !inWelcomeState && shouldShowScrollToBottomButton(history),
    );
  };
  const debouncedScrollUpdate = rafDebounce(scrollUpdate);

  const attachInputAreaObserver = () => {
    inputAreaResizeObserver?.disconnect();
    const inputSection = mount.querySelector('.input-section');
    if (!inputSection) return;
    inputAreaResizeObserver = new ResizeObserver(update);
    inputAreaResizeObserver.observe(inputSection);
  };

  const attachScrollButtonObserver = () => {
    scrollBtnStyleObserver?.disconnect();
    const scrollBtn = mount.querySelector('.scroll-to-bottom');
    if (!scrollBtn) return;

    if (!scrollBtn.dataset.exlScrollBound) {
      scrollBtn.dataset.exlScrollBound = 'true';
      scrollBtn.addEventListener('click', () => {
        clearScrollAfterSuggestionSchedule();
        scrollChatHistoryToBottom(mount);
        scrollBtn.blur();
        update();
      });
    }

    scrollBtnStyleObserver = new MutationObserver(() => {
      const inWelcomeState = mount.querySelector('.brand-concierge-container.initial-state');
      const shouldShow = !inWelcomeState && history && shouldShowScrollToBottomButton(history);
      if (shouldShow && !scrollBtn.classList.contains('bc-scroll-to-bottom-visible')) {
        update();
      }
    });
    scrollBtnStyleObserver.observe(scrollBtn, {
      attributes: true,
      attributeFilter: ['style', 'hidden', 'class'],
    });
  };

  const attachHistory = () => {
    const nextHistory = mount.querySelector('.chat-history');
    if (nextHistory === history) {
      if (!scrollBtnStyleObserver) attachScrollButtonObserver();
      if (!inputAreaResizeObserver) attachInputAreaObserver();
      return;
    }

    history?.removeEventListener('scroll', debouncedScrollUpdate);
    debouncedScrollUpdate.cancel();
    historyResizeObserver?.disconnect();
    historyContentObserver?.disconnect();
    debouncedHistoryUpdate?.cancel();

    history = nextHistory;
    if (!history) {
      attachScrollButtonObserver();
      attachInputAreaObserver();
      update();
      return;
    }

    history.addEventListener('scroll', debouncedScrollUpdate, { passive: true });
    historyResizeObserver = new ResizeObserver(update);
    historyResizeObserver.observe(history);
    debouncedHistoryUpdate = rafDebounce(update);
    historyContentObserver = new MutationObserver(debouncedHistoryUpdate);
    historyContentObserver.observe(history, { childList: true, subtree: true });
    attachScrollButtonObserver();
    attachInputAreaObserver();
    update();
  };

  const mountObserver = new MutationObserver(attachHistory);
  mountObserver.observe(mount, { childList: true, subtree: true });
  window.addEventListener('resize', update, { passive: true });
  attachHistory();

  scrollToBottomWatcher = {
    cleanup: () => {
      mountObserver.disconnect();
      window.removeEventListener('resize', update);
      history?.removeEventListener('scroll', debouncedScrollUpdate);
      debouncedScrollUpdate.cancel();
      historyResizeObserver?.disconnect();
      historyContentObserver?.disconnect();
      debouncedHistoryUpdate?.cancel();
      scrollBtnStyleObserver?.disconnect();
      inputAreaResizeObserver?.disconnect();
    },
  };
}

/**
 * Resets the assistant to the first-use welcome state: clears transcript storage and re-runs bootstrap.
 * The BC client calls reinitialize() when bootstrap is invoked again after the first load.
 */
async function clearBrandConciergeConversation() {
  const concierge = window.adobe?.concierge;
  if (typeof concierge?.bootstrap !== 'function') {
    warn('Clear: concierge bootstrap not available');
    return;
  }

  try {
    if (typeof concierge.clearAllSessions === 'function') {
      concierge.clearAllSessions();
    } else if (typeof concierge.clearHistory === 'function') {
      concierge.clearHistory();
    }
  } catch (e) {
    warn('Clear: optional concierge clear API failed (continuing)', e?.message || e);
  }

  clearBrandConciergeTranscriptStorage({ broad: false });

  try {
    await concierge.bootstrap(getBootstrapOptions());
  } catch (e) {
    warn('Clear: first re-bootstrap failed; retrying after broader storage cleanup', e?.message || e);
    clearBrandConciergeTranscriptStorage({ broad: true });
    await concierge.bootstrap(getBootstrapOptions());
  }

  const bcMount = getBrandConciergeMount();
  scrollToBottomWatcher?.cleanup();
  watchScrollToBottomButton(bcMount);
  installQuestionPinHandlers(bcMount);
  patchBcSparkleIcons(bcMount);
  panelDisclaimerObserver?.disconnect();
  panelDisclaimerObserver = null;
  watchPanelDisclaimer(bcMount);
  focusBcChatInputWhenReady(bcMount);
}

function removeKeyboardScrollHandler() {
  if (keyboardScrollHandler && keyboardScrollDialog) {
    keyboardScrollDialog.removeEventListener('keydown', keyboardScrollHandler, true);
  }
  keyboardScrollHandler = null;
  keyboardScrollDialog = null;
}

/**
 * Intercepts keyboard scroll keys on the dialog so they scroll `.chat-history` instead of
 * the page behind. PageUp/PageDown are intercepted unconditionally; ArrowUp/ArrowDown are
 * intercepted only when focus is outside a text input (where they move the cursor).
 */
function installKeyboardScrollHandler(dialog, mount) {
  removeKeyboardScrollHandler();

  keyboardScrollHandler = (e) => {
    if (e.key !== 'PageUp' && e.key !== 'PageDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

    const activeEl = document.activeElement;

    // Arrow keys are bypassed when focus is in an editable control so cursor/option
    // movement is unaffected. Page keys are NOT bypassed — intentional: they always
    // scroll chat-history, never the textarea behind.
    if (
      (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
      (activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'SELECT' ||
        activeEl?.isContentEditable)
    )
      return;

    const isPageKey = e.key === 'PageUp' || e.key === 'PageDown';

    // Page keys always suppress document scroll — showModal() traps focus but does not
    // consume keyboard events, so unconsumed PageUp/PageDown scroll the page behind.
    // Arrow keys are only prevented when we will actually scroll, so any ARIA widget inside
    // the dialog that checks e.defaultPrevented for its own navigation is not broken.
    if (isPageKey) e.preventDefault();

    const history = mount.querySelector('.chat-history');
    if (!history || history.scrollHeight <= history.clientHeight) return;

    if (!isPageKey) e.preventDefault();

    const scrollAmount = isPageKey ? history.clientHeight * 0.85 : 60;
    const direction = e.key === 'ArrowUp' || e.key === 'PageUp' ? -1 : 1;

    history.scrollBy({ top: direction * scrollAmount, behavior: isPageKey ? 'smooth' : 'auto' });
  };

  keyboardScrollDialog = dialog;
  dialog.addEventListener('keydown', keyboardScrollHandler, true);
}

function createMountPoint() {
  if (document.getElementById(DIALOG_ID)) return document.getElementById(DIALOG_ID);

  const trigger = document.createElement('button');
  trigger.id = TRIGGER_ID;
  trigger.setAttribute('aria-label', 'Open AI assistant');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', DIALOG_ID);

  const triggerIcon = document.createElement('span');
  triggerIcon.className = 'icon icon-bc-ask-sparkles';
  const triggerAsk = document.createElement('span');
  triggerAsk.className = 'bc-trigger-ask';
  triggerAsk.textContent = 'Ask a question';
  trigger.append(triggerIcon, triggerAsk);
  const betaBadge = document.createElement('span');
  betaBadge.className = 'bc-trigger-beta';
  betaBadge.textContent = 'BETA';
  const sendIcon = document.createElement('span');
  sendIcon.className = 'icon icon-bc-message-send bc-trigger-send';
  sendIcon.setAttribute('aria-hidden', 'true');
  trigger.append(betaBadge, sendIcon);
  decorateIcon(triggerIcon);
  decorateIcon(sendIcon);
  document.body.append(trigger);

  const mount = document.createElement('div');
  mount.id = 'brand-concierge-mount';

  const clearBtn = document.createElement('button');
  clearBtn.id = HEADER_CLEAR_ID;
  clearBtn.type = 'button';
  clearBtn.className = 'exl-dialog-header-clear';
  clearBtn.textContent = 'Clear';
  clearBtn.setAttribute('aria-label', 'Clear conversation');

  drawerHandle = openDrawer({
    id: DIALOG_ID,
    ariaLabel: 'AI assistant',
    title: 'Ask',
    titleBadge: 'BETA',
    titleIcon: 'bc-ask-sparkles',
    content: mount,
    canExpand: true,
    beforeExpandButton: clearBtn,
    triggerEl: trigger,
    onClose: () => trigger.setAttribute('aria-expanded', 'false'),
  });

  const { element: dialog } = drawerHandle;
  installKeyboardScrollHandler(dialog, mount);

  trigger.addEventListener('click', () => {
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    focusBcChatInputWhenReady(mount);
  });

  dialog.querySelector('.exl-dialog-header-expand')?.addEventListener('click', () => {
    focusBcChatInputWhenReady(mount);
  });

  clearBtn.addEventListener('click', () => {
    clearBrandConciergeConversation().catch((e) => warn('Clear conversation failed', e?.message || e));
  });

  return dialog;
}

async function configureWebSdk(bcDatastreamId, bcOrgId, bcEdgeDomain) {
  await window[ALLOY_INSTANCE_NAME]('configure', {
    defaultConsent: 'in',
    edgeDomain: bcEdgeDomain,
    edgeBasePath: 'ee',
    datastreamId: bcDatastreamId,
    orgId: bcOrgId,
    idMigrationEnabled: false,
    thirdPartyCookiesEnabled: false,
  });

  await window[ALLOY_INSTANCE_NAME]('sendEvent', {});
}

function bootstrapWebClient() {
  if (typeof window.adobe?.concierge?.bootstrap !== 'function') {
    warn('bootstrap not available — confirm the datastream is enabled for Brand Concierge');
    return;
  }

  log('bootstrap called', { instanceName: ALLOY_INSTANCE_NAME, selector: MOUNT_SELECTOR });

  window.adobe.concierge.bootstrap(getBootstrapOptions());
}

/**
 * Queues alloy() calls made before alloy.min.js loads.
 *
 * Replaces (not appends to) window.__alloyNS — appending would re-initialise the
 * Launch-owned window.alloy, which has no .q and throws.
 */
function injectAlloyStub() {
  if (window[ALLOY_INSTANCE_NAME]) return;

  // eslint-disable-next-line no-underscore-dangle
  window.__alloyNS = [ALLOY_INSTANCE_NAME];

  window[ALLOY_INSTANCE_NAME] = (...args) =>
    new Promise((resolve, reject) => {
      window[ALLOY_INSTANCE_NAME].q.push([resolve, reject, args]);
    });
  window[ALLOY_INSTANCE_NAME].q = [];
}

/** Call on SPA navigation to prevent the UI persisting across page transitions. */
export function destroyBrandConcierge() {
  scrollToBottomWatcher?.cleanup();
  scrollToBottomWatcher = null;
  removeKeyboardScrollHandler();
  removeQuestionPinHandlers();
  inputLabelIconObserver?.disconnect();
  inputLabelIconObserver = null;
  panelDisclaimerObserver?.disconnect();
  panelDisclaimerObserver = null;
  drawerHandle?.destroy();
  drawerHandle = null;
  document.getElementById(TRIGGER_ID)?.remove();
  cssLinkEl?.remove();
  cssLinkEl = null;
}

export async function initBrandConcierge() {
  const { bcAlloySdkUrl, bcDatastreamId, bcOrgId, bcWebClientUrl, bcEdgeDomain } = getConfig();

  createMountPoint();
  injectAlloyStub();

  try {
    log('[BC] loading Web SDK (alloyBC instance)', { bcEdgeDomain, bcDatastreamId });
    await loadScript(bcAlloySdkUrl);
    await configureWebSdk(bcDatastreamId, bcOrgId, bcEdgeDomain);
    log('[BC] Web SDK configured');

    log('[BC] loading Web Client', bcWebClientUrl);
    await loadScript(bcWebClientUrl);
    log('[BC] Web Client loaded — calling bootstrap');
    bootstrapWebClient();
    log('[BC] bootstrapWebClient called');
    const bcMount = getBrandConciergeMount();
    watchScrollToBottomButton(bcMount);
    installQuestionPinHandlers(bcMount);
    patchBcSparkleIcons(bcMount);
    watchPanelDisclaimer(bcMount);

    // Appended after bootstrap() so this <link> follows BC's injected <style> in document
    // order, giving our overrides cascade priority at equal specificity.
    cssLinkEl = document.createElement('link');
    cssLinkEl.rel = 'stylesheet';
    cssLinkEl.href = `${window.hlx.codeBasePath}/scripts/brand-concierge/brand-concierge.css`;
    document.head.append(cssLinkEl);

    /* Later scripts may append fixed layers; keep the trigger button last in body stacking order. */
    const triggerEl = document.getElementById(TRIGGER_ID);
    if (triggerEl) document.body.append(triggerEl);
  } catch (e) {
    error('[BC] failed to initialise', e?.message || e);
    destroyBrandConcierge();
  }
}

export default initBrandConcierge;
