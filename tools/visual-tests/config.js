export const OVERLAY = {
  imageRoot: '/tools/visual-tests/blocks',
};

export const VIEWPORTS = [
  {
    width: '320px', height: '568px', label: 'Mobile', icon: 'device-phone',
  },
  {
    width: '768px', height: '1024px', label: 'Tablet', icon: 'device-tablet',
  },
  {
    width: '1024px', height: '768px', label: 'Desktop', icon: 'device-desktop',
  },
  {
    width: '1440px', height: '900px', label: 'Large', icon: 'device-desktop', default: true,
  },
];

// Sidekick Library configuration
export const SIDEKICK_CONFIG = {
  JSONPath: '/tools/sidekick/library.json',
  templatesPath: '/tools/sidekick/blocks/',
};

// Blocks that fetch live data from Coveo. Coveo's index changes over time, so screenshotting
// its real response would make these visual tests flaky. Listed blocks get their Coveo calls
// replayed from a committed HAR fixture (see record-coveo-har.js) instead of hitting the network.
export const COVEO_MOCKED_BLOCKS = ['curated-cards'];

// Glob patterns identifying Coveo traffic (search results + auth token), used to scope
// page.routeFromHAR() replay in generated specs for COVEO_MOCKED_BLOCKS.
export const COVEO_ROUTE_GLOBS = ['**/rest/search/v2**', '**/api/action/coveo-token**'];

// Same traffic, as a regex, for filtering what record-coveo-har.js captures into the HAR file.
export const COVEO_HAR_URL_FILTER = /\/rest\/search\/v2|\/api\/action\/coveo-token/;
