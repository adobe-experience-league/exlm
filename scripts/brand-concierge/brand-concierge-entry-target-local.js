/**
 * Local dev only — simulates Launch / Target custom code for EXLM-5715.
 * Fires `exlm-bc-entry-ready` the same way Launch rules do in production.
 *
 * Timing (mirrors prod):
 *   scripts.js loadLazy → loadMartech(...) → this module (localhost only)
 *   → short delay (Launch/Target latency) → dispatch event
 *   → later (~3s) delayed.js loads brand-concierge.js
 *
 * So the event is available before BC init, just like Target after martech.
 * Loaded from scripts.js on localhost only (real Launch handles previews / prod).
 */

import {
  BC_ENTRY_EVENT,
  BC_ENTRY_EXPERIENCES,
  BC_META_TYPE,
  getResolvedExperience,
} from './brand-concierge-entry-target.js';

const VALID_EXPERIENCES = new Set(Object.values(BC_ENTRY_EXPERIENCES));
/** Local QA default: Mode B bottom ask bar (override via ?bc-entry=). */
const LOCAL_TARGET_DEFAULT = BC_ENTRY_EXPERIENCES.BOTTOM_ASK_BAR;
const LOCAL_EXPERIENCE_QUERY = 'bc-entry';
const LOCAL_TARGET_ACTIVITY = 'EXLM BC Entry Variants';
/**
 * Approximate Launch → Target decision latency after martech starts.
 * Keep well under delayed.js (~3s) + waitForExperienceOrTimeout (5s) so the
 * happy path resolves before BC init's wait, matching typical prod timing.
 */
const LOCAL_TARGET_DELAY_MS = 250;

function isLocalDevHost() {
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function resolveLocalTargetExperience() {
  const fromQuery = new URLSearchParams(window.location.search).get(LOCAL_EXPERIENCE_QUERY);
  if (fromQuery) {
    if (VALID_EXPERIENCES.has(fromQuery)) return fromQuery;
    // eslint-disable-next-line no-console
    console.warn(
      `[BC entry local] Ignoring invalid ?${LOCAL_EXPERIENCE_QUERY}=${fromQuery}; ` +
        `using ${LOCAL_TARGET_DEFAULT}. Valid: ${[...VALID_EXPERIENCES].join(', ')}`,
    );
  }
  return LOCAL_TARGET_DEFAULT;
}

function dispatchBcEntryReady(experience) {
  document.dispatchEvent(
    new CustomEvent(BC_ENTRY_EVENT, {
      detail: {
        meta: {
          type: BC_META_TYPE,
          experience,
          activity: LOCAL_TARGET_ACTIVITY,
        },
      },
    }),
  );
}

/**
 * Fire after loadMartech (this module is imported immediately after that call),
 * without waiting for header — same window as prod Target vs delayed BC init.
 * Header Ask chrome is re-synced via entry-target's header-loaded listener.
 */
export default function simulateLocalBcEntryTarget() {
  if (!isLocalDevHost()) return;

  const experience = resolveLocalTargetExperience();
  window.setTimeout(() => {
    if (getResolvedExperience()) return;
    dispatchBcEntryReady(experience);
  }, LOCAL_TARGET_DELAY_MS);
}
