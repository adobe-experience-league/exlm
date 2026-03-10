// eslint-disable-next-line import/no-cycle
import { getConfig } from '../scripts.js';
import { loadScript, decorateIcon } from '../lib-franklin.js';
import brandConciergeConfig from './brand-concierge-config.js';

// separate alloy instance to avoid conflicting with the Launch-owned window.alloy.
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

// reference held so destroyBrandConcierge can clean up on SPA navigation.
let cssLinkEl = null;

/**
 * builds and mounts the BC trigger button, dialog shell, and header.
 * uses the native <dialog> + showModal() pattern (same as image-modal.js).
 */
function createMountPoint() {
  if (document.getElementById(DIALOG_ID)) return;

  const trigger = document.createElement('button');
  trigger.id = TRIGGER_ID;
  trigger.setAttribute('aria-label', 'Open AI assistant');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', DIALOG_ID);

  const triggerIcon = document.createElement('span');
  triggerIcon.className = 'icon icon-concierge-icon';
  const triggerLabel = document.createElement('span');
  triggerLabel.textContent = 'Ask';
  trigger.append(triggerIcon, triggerLabel);
  // decorateIcon() → <img> preserves the brand icon's fixed colours on hover.
  decorateIcon(triggerIcon);

  const dialog = document.createElement('dialog');
  dialog.id = DIALOG_ID;
  dialog.setAttribute('aria-label', 'AI assistant');

  const header = document.createElement('div');
  header.className = 'exl-bc-header';

  const headerIcon = document.createElement('span');
  headerIcon.className = 'icon icon-concierge-icon';
  decorateIcon(headerIcon);

  const headerTitle = document.createElement('span');
  headerTitle.className = 'exl-bc-header-title';
  headerTitle.textContent = 'Concierge';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'exl-bc-header-close';
  closeBtn.setAttribute('aria-label', 'Close AI assistant');
  const closeIcon = document.createElement('span');
  closeIcon.className = 'icon icon-close';
  closeBtn.append(closeIcon);
  decorateIcon(closeIcon);

  header.append(headerIcon, headerTitle, closeBtn);

  const mount = document.createElement('div');
  mount.id = 'brand-concierge-mount';

  dialog.append(header, mount);
  document.body.append(trigger, dialog);

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

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });

  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
  });
}

/**
 * configures the AEP Web SDK alloy instance and registers an Edge Network
 * session before BC bootstrap fires.
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

  await window[ALLOY_INSTANCE_NAME]('sendEvent', {});
}

/** calls window.adobe.concierge.bootstrap() after the Web Client loads. */
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
 * injects the AEP Web SDK queue stub so alloy() calls before alloy.min.js
 * loads are queued and replayed automatically.
 *
 * Replaces (not appends to) window.__alloyNS — appending would cause the CDN
 * alloy.min.js to re-initialise the Launch-owned window.alloy, which has no
 * .q queue and throws.
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
 * removes the BC dialog, trigger, and stylesheet from the DOM.
 * call on client-side navigation to prevent UI persistence across page transitions.
 */
export function destroyBrandConcierge() {
  document.getElementById(DIALOG_ID)?.remove();
  document.getElementById(TRIGGER_ID)?.remove();
  cssLinkEl?.remove();
  cssLinkEl = null;
}

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

    // append after bootstrap() so our <link> comes after BC's injected <style>
    // in document order, giving our overrides cascading priority.
    cssLinkEl = document.createElement('link');
    cssLinkEl.rel = 'stylesheet';
    cssLinkEl.href = `${window.hlx.codeBasePath}/scripts/brand-concierge/brand-concierge.css`;
    document.head.append(cssLinkEl);
  } catch (e) {
    error('Web Client failed to load', bcWebClientUrl, e);
  }
}

export default initBrandConcierge;
