export const OVERLAY = {
  imageRoot: '/tools/visual-tests/blocks',
};

export const VIEWPORTS = [
  {
    width: '320px',
    height: '568px',
    label: 'Mobile',
    icon: 'device-phone',
  },
  {
    width: '768px',
    height: '1024px',
    label: 'Tablet',
    icon: 'device-tablet',
  },
  {
    width: '1024px',
    height: '768px',
    label: 'Desktop',
    icon: 'device-desktop',
  },
  {
    width: '1440px',
    height: '900px',
    label: 'Large',
    icon: 'device-desktop',
    default: true,
  },
];

// Sidekick Library configuration
export const SIDEKICK_CONFIG = {
  JSONPath: '/tools/sidekick/library.json',
  templatesPath: '/tools/sidekick/blocks/',
};

// Blocks that are too dynamic to snapshot reliably and are skipped by generate-visual-tests.js.
//   atomic-search:  Coveo Atomic web components loaded from Coveo's CDN; layout depends on
//                   remote scripts and shadow-DOM hydration timing.
//   browse-courses: renders up to 1000 cards (screenshots >50k px tall) with interactive
//                   filters; slow and fragile, better covered by functional tests.
export const EXCLUDED_BLOCKS = ['atomic-search', 'browse-courses'];

// Blocks that fetch live data from Coveo. Coveo's index changes over time, so screenshotting
// its real response would make these visual tests flaky. Listed blocks get their Coveo calls
// replayed from a committed HAR fixture (see record-coveo-har.js) instead of hitting the network.
export const COVEO_MOCKED_BLOCKS = [
  'curated-cards',
  'events-search',
  'featured-cards',
  'tabbed-cards',
  'upcoming-event-v2',
];

// Regex identifying Coveo traffic (search results + auth token), used by record-coveo-har.js
// to filter what it captures into the HAR file.
export const COVEO_HAR_URL_FILTER = /\/rest\/search\/v2|\/api\/action\/coveo-token/;

// Hosts the block iframe may load from during a visual test. Anything else (IMS, martech,
// Qualtrics, video players, remote thumbnails) is stubbed so it can't change the pixels.
// Remote images/iframes are replaced by a flat grey placeholder; other requests are aborted.
export const THIRD_PARTY_ALLOWED_HOSTS = [
  'localhost',
  '127.0.0.1',
  'host.docker.internal',
  // Sidekick Library UI that hosts the block iframe
  'www.aem.live',
  'www.hlx.live',
];

// "Now" for blocks without a Coveo HAR (mocked blocks use the HAR recording time instead).
export const SNAPSHOT_FIXED_TIME = '2026-01-15T12:00:00Z';

// Elements that mean a block is still loading. The test waits until none of these is visible
// inside the block before taking the snapshot.
export const DEFAULT_LOADING_SELECTORS = [
  '[class*="shimmer"]:not([class*="shimmer-hide"])',
  '[class*="skeleton"]',
  '.is-filter-loading',
  '.inline-survey-loading',
];

// Extra block-specific loading indicators: { hidden: '<selector that must disappear>' }.
export const BLOCK_SNAPSHOT_READY_SELECTORS = {};

// Elements to make invisible inside the block iframe before the snapshot (e.g. floating widgets).
export const BLOCK_SNAPSHOT_HIDE_SELECTORS = {};

// Last-resort fixed delay (ms) for a block after all readiness checks pass. Prefer adding a
// readiness selector above; only use this when a block has no observable "done" state.
export const BLOCK_SNAPSHOT_EXTRA_WAIT = {};
