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

const isDev = !['experienceleague.adobe.com'].includes(window.location.hostname);
// eslint-disable-next-line no-console
const log = (...args) => isDev && console.log('[BC]', ...args);
// eslint-disable-next-line no-console
const warn = (...args) => console.warn('[BC]', ...args);
// eslint-disable-next-line no-console
const error = (...args) => console.error('[BC]', ...args);

let cssLinkEl = null;
let drawerHandle = null;
let chatObserver = null;
let inputLabelIconObserver = null;

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

  drawerHandle = openDrawer({
    id: DIALOG_ID,
    ariaLabel: 'AI assistant',
    title: 'Ask',
    titleBadge: 'BETA',
    titleIcon: 'bc-ask-sparkles',
    content: mount,
    canExpand: true,
    triggerEl: trigger,
    onClose: () => trigger.setAttribute('aria-expanded', 'false'),
  });

  const { element: dialog } = drawerHandle;

  trigger.addEventListener('click', () => {
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    focusBcChatInputWhenReady(mount);
  });

  dialog.querySelector('.exl-dialog-header-expand')?.addEventListener('click', () => {
    focusBcChatInputWhenReady(mount);
  });

  return dialog;
}

// scroll the container to the bottom each time.
function watchChatHistory(mount) {
  const history = mount.querySelector('.chat-history');
  if (!history) return null;

  const observer = new MutationObserver(() => {
    history.scrollTo({ top: history.scrollHeight, behavior: 'smooth' });
  });

  observer.observe(history, { childList: true });
  return observer;
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

  const { stickySession = false, ...stylingConfigurations } = brandConciergeConfig;

  log('bootstrap called', { instanceName: ALLOY_INSTANCE_NAME, selector: MOUNT_SELECTOR });

  window.adobe.concierge.bootstrap({
    instanceName: ALLOY_INSTANCE_NAME,
    stylingConfigurations,
    selector: MOUNT_SELECTOR,
    stickySession,
  });
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
  chatObserver?.disconnect();
  chatObserver = null;
  inputLabelIconObserver?.disconnect();
  inputLabelIconObserver = null;
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
    const bcMount = document.getElementById('brand-concierge-mount');
    chatObserver = watchChatHistory(bcMount);
    patchBcSparkleIcons(bcMount);

    // Appended after bootstrap() so this <link> follows BC's injected <style> in document
    // order, giving our overrides cascade priority at equal specificity.
    cssLinkEl = document.createElement('link');
    cssLinkEl.rel = 'stylesheet';
    cssLinkEl.href = `${window.hlx.codeBasePath}/scripts/brand-concierge/brand-concierge.css`;
    document.head.append(cssLinkEl);
  } catch (e) {
    error('[BC] failed to initialise', e?.message || e);
    destroyBrandConcierge();
  }
}

export default initBrandConcierge;
