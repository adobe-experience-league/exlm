/** EXLM-5715 — Brand Concierge entry chrome from Launch / Target. */

export const BC_ENTRY_EVENT = 'exlm-bc-entry-ready';
export const BC_META_TYPE = 'brand-concierge';

export const BC_ENTRY_EXPERIENCES = {
  FLOATING_ASK_BUTTON: 'floating-ask-button',
  BOTTOM_ASK_BAR: 'bottom-ask-bar',
  HEADER_ASK_BUTTON: 'header-ask-button',
};

const VALID_EXPERIENCES = new Set(Object.values(BC_ENTRY_EXPERIENCES));
const DEFAULT_EXPERIENCE = BC_ENTRY_EXPERIENCES.FLOATING_ASK_BUTTON;
const DESKTOP_MQ = '(min-width: 1200px)';
const DEFAULT_WAIT_MS = 500;

let rawExperience = null;
let waitResolvers = [];
let viewportListenerAttached = false;
let bcReady = false;

function syncHeaderHost(experience) {
  const headerHost = document.querySelector('exl-header');
  if (!headerHost) return;
  if (experience) {
    headerHost.dataset.bcEntry = experience;
  } else {
    delete headerHost.dataset.bcEntry;
  }
}

/**
 * Header Ask (Mode C) is shown only after Brand Concierge init completes.
 * @param {boolean} [isReady]
 */
export function syncHeaderBcReady(isReady = true) {
  bcReady = isReady;
  const headerHost = document.querySelector('exl-header');
  if (!headerHost) return;
  if (isReady) {
    headerHost.dataset.bcReady = 'true';
  } else {
    delete headerHost.dataset.bcReady;
  }
}

function isDesktopViewport() {
  return window.matchMedia(DESKTOP_MQ).matches;
}

/**
 * Resolves the entry experience for the current viewport (mobile always control FAB).
 * @returns {string}
 */
export function resolveBcEntryExperience() {
  const candidate = VALID_EXPERIENCES.has(rawExperience) ? rawExperience : DEFAULT_EXPERIENCE;
  if (!isDesktopViewport()) return DEFAULT_EXPERIENCE;
  return candidate;
}

/**
 * @returns {string|null}
 */
export function getResolvedExperience() {
  return rawExperience;
}

/**
 * Applies dataset + host attributes for CSS-driven entry chrome visibility.
 * @param {string} [experience] - Defaults to resolveBcEntryExperience().
 */
export function applyBcEntryChrome(experience = resolveBcEntryExperience()) {
  const resolved = VALID_EXPERIENCES.has(experience) ? experience : DEFAULT_EXPERIENCE;
  const effective = isDesktopViewport() ? resolved : DEFAULT_EXPERIENCE;

  document.body.dataset.bcEntry = effective;
  syncHeaderHost(effective);
  document.body.classList.remove('bc-entry-pending');
}

function flushWaiters() {
  if (!waitResolvers.length) return;
  const resolvers = waitResolvers;
  waitResolvers = [];
  const experience = resolveBcEntryExperience();
  resolvers.forEach((resolve) => resolve(experience));
}

function storeExperience(experience) {
  if (!VALID_EXPERIENCES.has(experience)) return;
  // First valid Target assignment wins — ignore duplicate or late re-fires.
  if (rawExperience) return;
  rawExperience = experience;
  window.exlm = window.exlm || {};
  window.exlm.bcEntryExperience = experience;
  applyBcEntryChrome();
  flushWaiters();
}

function onBcEntryReady(event) {
  const { meta } = event?.detail || {};
  if (meta?.type !== BC_META_TYPE) return;
  const { experience } = meta;
  if (typeof experience !== 'string' || !VALID_EXPERIENCES.has(experience)) return;
  storeExperience(experience);
}

function onViewportChange() {
  applyBcEntryChrome();
}

/**
 * Header may finish decorating after Target fires; re-apply host attr so Ask CSS matches.
 */
function onHeaderLoaded() {
  if (!document.body.dataset.bcEntry && !rawExperience) return;
  syncHeaderHost(resolveBcEntryExperience());
  if (bcReady) syncHeaderBcReady(true);
}

function attachViewportListener() {
  if (viewportListenerAttached) return;
  viewportListenerAttached = true;
  window.matchMedia(DESKTOP_MQ).addEventListener('change', onViewportChange);
}

/**
 * Marks desktop pages while waiting for Target (reduces wrong-chrome flash).
 */
export function markBcEntryPending() {
  if (!isDesktopViewport()) return;
  document.body.classList.add('bc-entry-pending');
}

/**
 * Waits for Target experience or timeout; returns resolved experience for current viewport.
 * @param {number} [maxMs]
 * @returns {Promise<string>}
 */
export function waitForExperienceOrTimeout(maxMs = DEFAULT_WAIT_MS) {
  attachViewportListener();

  if (rawExperience && VALID_EXPERIENCES.has(rawExperience)) {
    return Promise.resolve(resolveBcEntryExperience());
  }

  return new Promise((resolve) => {
    const timerId = window.setTimeout(() => {
      waitResolvers = waitResolvers.filter((r) => r !== resolve);
      // Target silent — apply control FAB and clear pending chrome if nothing arrived.
      if (!document.body.dataset.bcEntry) {
        applyBcEntryChrome();
      }
      resolve(resolveBcEntryExperience());
    }, maxMs);

    waitResolvers.push((experience) => {
      window.clearTimeout(timerId);
      resolve(experience);
    });
  });
}

/** Clears entry variant state (e.g. destroyBrandConcierge). */
export function resetBcEntryVariant() {
  rawExperience = null;
  waitResolvers = [];
  bcReady = false;
  delete document.body.dataset.bcEntry;
  document.body.classList.remove('bc-entry-pending');
  syncHeaderHost(null);
  syncHeaderBcReady(false);
  if (window.exlm) delete window.exlm.bcEntryExperience;
}

document.addEventListener(BC_ENTRY_EVENT, onBcEntryReady);
document.addEventListener('header-loaded', onHeaderLoaded, true);
attachViewportListener();

if (window.location.search?.indexOf('martech=off') === -1) {
  markBcEntryPending();
}
