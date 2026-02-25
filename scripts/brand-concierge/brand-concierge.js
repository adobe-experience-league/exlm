// eslint-disable-next-line import/no-cycle
import { getConfig } from '../scripts.js';
import { loadScript, decorateIcon } from '../lib-franklin.js';
import brandConciergeConfig from './brand-concierge-config.js';

// Use a separate named instance to avoid conflicting with the alloy instance
// already initialised by the ExL Launch DTM bundle (window.alloy).
const ALLOY_INSTANCE_NAME = 'alloyBC';
const MOUNT_SELECTOR = '#brand-concierge-mount';
const DIALOG_ID = 'bc-dialog';
const TRIGGER_ID = 'bc-trigger';

// Only log in non-production environments to avoid console noise in prod.
const isDev = !['experienceleague.adobe.com'].includes(window.location.hostname);
// eslint-disable-next-line no-console
const log = (...args) => isDev && console.log('[BC]', ...args);
// eslint-disable-next-line no-console
const warn = (...args) => console.warn('[BC]', ...args);
// eslint-disable-next-line no-console
const error = (...args) => console.error('[BC]', ...args);

// Holds a reference to the injected stylesheet so destroyBrandConcierge can
// remove it and prevent a resource leak on SPA navigation.
let cssLinkEl = null;

/**
 * Builds the BC shell: a fixed floating trigger button and a <dialog> that
 * contains the BC mount point. BC bootstraps inside the mount as normal;
 * the dialog is just a lightweight wrapper that handles open/close.
 *
 * Follows the same native <dialog> + showModal() pattern used elsewhere in
 * the ExL codebase (image-modal.js, signup-flow-dialog.js, etc.).
 */
function createMountPoint() {
  if (document.getElementById(DIALOG_ID)) return;

  // ── Floating trigger button ────────────────────────────────────────────
  const trigger = document.createElement('button');
  trigger.id = TRIGGER_ID;
  trigger.setAttribute('aria-label', 'Open AI assistant');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', DIALOG_ID);
  // Chat bubble icon (inline SVG, no external dependency)
  trigger.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
    </svg>
    <span>Ask AI</span>`;

  // ── Dialog shell ───────────────────────────────────────────────────────
  const dialog = document.createElement('dialog');
  dialog.id = DIALOG_ID;
  dialog.setAttribute('aria-label', 'AI assistant');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'bc-dialog-close';
  closeBtn.setAttribute('aria-label', 'Close AI assistant');
  closeBtn.setAttribute('aria-controls', DIALOG_ID);
  const closeIcon = document.createElement('span');
  closeIcon.className = 'icon icon-close';
  closeBtn.append(closeIcon);
  decorateIcon(closeIcon);

  const mount = document.createElement('div');
  mount.id = 'brand-concierge-mount';

  dialog.append(closeBtn, mount);
  document.body.append(trigger, dialog);

  // ── Event wiring ───────────────────────────────────────────────────────
  trigger.addEventListener('click', () => {
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
  });

  const closeDialog = () => {
    dialog.close();
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  };

  closeBtn.addEventListener('click', closeDialog);

  // Click on the backdrop (dialog itself, not its content) closes it.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });

  // Sync aria-expanded when dialog is dismissed via Escape key.
  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Configures and initialises the AEP Web SDK (alloy) instance.
 * Both the configure() and the initial sendEvent() are awaited so the Edge
 * Network session is fully registered before the BC bootstrap call fires.
 */
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

  // Await the initial interact so the Edge Network session is registered and
  // BC runtime can match the correct concierge for this surface before bootstrap.
  await window[ALLOY_INSTANCE_NAME]('sendEvent', {});
}

/**
 * Calls window.adobe.concierge.bootstrap() after the Web Client script has loaded.
 * `stickySession` is pulled from the config so it lives in one place.
 * The top-level `stickySession` key is stripped before passing the rest of the
 * config object as `stylingConfigurations`.
 */
function bootstrapWebClient() {
  if (typeof window.adobe?.concierge?.bootstrap !== 'function') {
    warn('bootstrap not available — confirm the datastream is enabled for Brand Concierge');
    return;
  }
  // Separate the bootstrap-level option from the styling payload.
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
 * Injects the AEP Web SDK queue stub so alloy() calls made before
 * alloy.min.js finishes loading are queued and replayed automatically.
 *
 * We intentionally REPLACE (not append to) window.__alloyNS so that when
 * the CDN alloy.min.js loads it only initialises our `alloyBC` instance.
 * Appending would cause alloy.min.js to also attempt to re-initialise the
 * Launch-owned `window.alloy` instance which has no `.q` queue and throws.
 *
 * Timing assumption: this function runs inside delayed.js, by which point the
 * Launch DTM bundle has fully initialised `window.alloy`. Replacing __alloyNS
 * is therefore safe — the freshly-loaded alloy.min.js only needs to set up `alloyBC`.
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

/**
 * Removes the Brand Concierge dialog, trigger button, and stylesheet from the
 * DOM. Call this on client-side navigation to prevent the widget and its
 * styles from persisting across page transitions.
 *
 * Note: the alloyBC Web SDK instance does not expose a public destroy API and
 * will remain on window; only the UI elements are torn down here.
 */
export function destroyBrandConcierge() {
  document.getElementById(DIALOG_ID)?.remove();
  document.getElementById(TRIGGER_ID)?.remove();
  cssLinkEl?.remove();
  cssLinkEl = null;
}

/**
 * Brand Concierge integration entry point.
 * Loads the AEP Web SDK and BC Web Client, then bootstraps the chat UI.
 *
 * Called from scripts/delayed.js. Can also be imported directly:
 *   import { initBrandConcierge } from '../scripts/brand-concierge/brand-concierge.js';
 */
export async function initBrandConcierge() {
  const { bcAlloySdkUrl, bcDatastreamId, bcOrgId, bcWebClientUrl, bcEdgeDomain } = getConfig();

  createMountPoint();
  injectAlloyStub();

  log('loading Web SDK (alloyBC instance)', { bcEdgeDomain, bcDatastreamId });
  await loadScript(bcAlloySdkUrl);
  await configureWebSdk(bcDatastreamId, bcOrgId, bcEdgeDomain);
  log('Web SDK configured');

  log('loading Web Client', bcWebClientUrl);
  try {
    await loadScript(bcWebClientUrl);
    log('Web Client loaded — calling bootstrap');
    bootstrapWebClient();

    // BC injects its own <style> inside #brand-concierge-mount during bootstrap().
    // Appending our <link> to <head> after bootstrap() ensures it comes later in
    // document order than BC's injected <style>, so our overrides win the cascade.
    cssLinkEl = document.createElement('link');
    cssLinkEl.rel = 'stylesheet';
    cssLinkEl.href = `${window.hlx.codeBasePath}/scripts/brand-concierge/brand-concierge.css`;
    document.head.append(cssLinkEl);
  } catch (e) {
    error('Web Client failed to load', bcWebClientUrl, e);
  }
}

export default initBrandConcierge;
