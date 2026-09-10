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
const DEFAULT_WAIT_MS = 5000;
/** QA override — `?bc-entry=floating-ask-button|bottom-ask-bar|header-ask-button` (aliases: fab, bottom, header). */
const BC_ENTRY_QUERY = 'bc-entry';
const QUERY_ALIASES = {
  [BC_ENTRY_EXPERIENCES.FLOATING_ASK_BUTTON]: BC_ENTRY_EXPERIENCES.FLOATING_ASK_BUTTON,
  [BC_ENTRY_EXPERIENCES.BOTTOM_ASK_BAR]: BC_ENTRY_EXPERIENCES.BOTTOM_ASK_BAR,
  [BC_ENTRY_EXPERIENCES.HEADER_ASK_BUTTON]: BC_ENTRY_EXPERIENCES.HEADER_ASK_BUTTON,
  fab: BC_ENTRY_EXPERIENCES.FLOATING_ASK_BUTTON,
  bottom: BC_ENTRY_EXPERIENCES.BOTTOM_ASK_BAR,
  header: BC_ENTRY_EXPERIENCES.HEADER_ASK_BUTTON,
};

let rawExperience = null;
let waitResolvers = [];
let viewportListenerAttached = false;
let bcReady = false;
/** @type {((experience: string) => void)|null} */
let onExperienceApplied = null;

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

/**
 * Optional hook for brand-concierge.js to mount variant-specific DOM after Target resolves
 * (covers late Target firing after init already fell back to control FAB).
 * @param {(experience: string) => void|null} callback
 */
export function setOnExperienceApplied(callback) {
  onExperienceApplied = callback;
}

function experienceFromQuery() {
  const raw = new URLSearchParams(window.location.search).get(BC_ENTRY_QUERY);
  if (!raw) return null;
  const mapped = QUERY_ALIASES[raw];
  if (mapped) return mapped;
  // eslint-disable-next-line no-console
  console.warn(`[BC entry] Ignoring invalid ?${BC_ENTRY_QUERY}=${raw}. Valid: ${[...VALID_EXPERIENCES].join(', ')}`);
  return null;
}

function storeExperience(experience) {
  if (!VALID_EXPERIENCES.has(experience)) return;
  // First valid assignment wins (query override or Target) — ignore duplicate or late re-fires.
  if (rawExperience) return;
  rawExperience = experience;
  window.exlm = window.exlm || {};
  window.exlm.bcEntryExperience = experience;
  applyBcEntryChrome();
  flushWaiters();
  onExperienceApplied?.(resolveBcEntryExperience());
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
  // Late mount for Mode B: Target may have assigned bottom-ask-bar while viewport was
  // <1200px (FAB only); crossing desktop must create the bar or CSS hides FAB with no entry.
  onExperienceApplied?.(resolveBcEntryExperience());
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
 * Parked until the BC Target activity is live — calling this with Target off hid
 * the control FAB for 5s. Re-enable with waitForExperienceOrTimeout() at launch.
 */
export function markBcEntryPending() {
  if (!isDesktopViewport()) return;
  document.body.classList.add('bc-entry-pending');
}

/**
 * Waits for Target experience or timeout; returns resolved experience for current viewport.
 * Parked until the BC Target activity is live. Init paints control immediately instead.
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

// `?bc-entry=` wins over Target (first assignment). Then paint chrome immediately so
// the control FAB is not hidden for 5s when Target is off. Late Target still swaps via
// storeExperience when no query override is present.
const queryExperience = experienceFromQuery();
if (queryExperience) storeExperience(queryExperience);
applyBcEntryChrome();
