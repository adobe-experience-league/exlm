# Header v2 rollout via domain allowlist

## Problem

`blocks/header/header.js` currently decides between the v1 (`ExlHeader`) and v2 (`header-v2.js`)
header using a page-metadata feature flag:

```js
if (isFeatureEnabled('isHeaderV2')) { ... }
```

This requires per-page (or bulk-metadata) authoring to toggle. Premium Learning already gates
itself by domain instead, via a config sheet published as `exlm-config.json` and read through a
private `getExlmConfig(key)` helper in `scripts/utils/premium-learning-utils.js`:

```js
const rawDomains = await getExlmConfig('plAllowedDomains');
const plAllowedDomains = rawDomains
  ? rawDomains
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
  : [];
if (!plAllowedDomains.includes(window.location.hostname)) return false;
```

We want header v2 to roll out the same way: enabled per-hostname via a config key
(`headerv2allowedDomains`), not a content-authored feature flag.

## Goals

- Replace the `isFeatureEnabled('isHeaderV2')` check in `header.js` with a domain-allowlist check
  against the `headerv2allowedDomains` key in `exlm-config.json`.
- Share the config-fetch and domain-parsing logic between Premium Learning and header v2 instead
  of duplicating it, since `getExlmConfig` is a generic config reader, not Premium-Learning-specific.
- Preserve existing Premium Learning behavior exactly (pure refactor on that side).

## Non-goals

- No change to the `isFeatureEnabled` / page-metadata feature-flag mechanism itself — other flags
  (`isEventsV2`, `isPremiumLearningEnabled`, `recMarqueeTargetHeading`,
  `isComponentImpressionEnabled`) are untouched.
- No new automated test harness — this repo has no existing unit tests for
  `premium-learning-utils.js`, `header.js`, or `feature-flag-utils.js`, so this follows existing
  convention (manual/browser verification) rather than introducing one.

## Design

### New module: `scripts/utils/exlm-config-utils.js`

Moves `fetchExlmConfig()` and `getExlmConfig(key)` out of `premium-learning-utils.js` (where they
are currently defined but not exported) into a new shared file, and adds one new exported helper
that centralizes the comma-separated domain-list parsing so it isn't duplicated across call sites:

```js
// module-level singleton, unchanged from current implementation
let exlmConfigPromise = null;

function fetchExlmConfig() {
  if (!exlmConfigPromise) {
    try {
      exlmConfigPromise = fetch(`${window.hlx.codeBasePath}/exlm-config.json`, {
        signal: AbortSignal.timeout(5000),
      })
        .then((res) => (res.ok ? res.json() : { data: [] }))
        .then(({ data = [] }) => new Map(data.map(({ key, value }) => [key, value])))
        .catch(() => new Map());
    } catch {
      exlmConfigPromise = Promise.resolve(new Map());
    }
  }
  return exlmConfigPromise;
}

export async function getExlmConfig(key) {
  const config = await fetchExlmConfig();
  return config.get(key) ?? null;
}

export async function isDomainAllowed(configKey, hostname = window.location.hostname) {
  const raw = await getExlmConfig(configKey);
  const domains = raw
    ? raw
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
    : [];
  return domains.includes(hostname);
}
```

### `scripts/utils/premium-learning-utils.js`

Pure refactor, no behavior change:

- Remove the local `fetchExlmConfig`/`getExlmConfig` definitions and the now-unused
  `exlmConfigPromise` state.
- Import `isDomainAllowed` from `./exlm-config-utils.js`.
- Replace the domain-check block in `isPLEligible` with:
  ```js
  if (!(await isDomainAllowed('plAllowedDomains'))) return false;
  ```

### `blocks/header/header.js`

- Remove the `isFeatureEnabled` import (no other use in this file) and the
  `scripts/utils/feature-flag-utils.js` dependency.
- Import `isDomainAllowed` from `../../scripts/utils/exlm-config-utils.js`.
- Change the `decorate()` branch condition:
  ```js
  export default async function decorate(headerBlock, options = {}) {
    if (await isDomainAllowed('headerv2allowedDomains')) {
      const { default: decorateV2 } = await import('./header-v2.js');
      return decorateV2(headerBlock, options);
    }
    const exlHeader = new ExlHeader(options);
    headerBlock.replaceChildren(exlHeader);
    return undefined;
  }
  ```

### Error handling

If `exlm-config.json` is unreachable, times out, or a key is absent, `getExlmConfig` already
resolves `null` (existing catch-to-empty-Map behavior is unchanged). `isDomainAllowed` then returns
`false`, so header v2 is skipped and the current v1 header renders. This is a fail-closed default —
a config outage degrades to the existing header, never to a broken one — matching the behavior
Premium Learning already depends on.

### Caching side effect

Because both call sites now resolve through the same module-level `exlmConfigPromise`, a page that
triggers both the header decision and Premium Learning gating fetches `exlm-config.json` once
instead of twice.

## Testing / verification

No unit test suite exists for the touched files. Verification is manual against a local dev
server:

1. Add a test hostname to `headerv2allowedDomains` in the authored `exlm-config` sheet.
2. Confirm `header-v2.js` loads and renders for that hostname.
3. Confirm a hostname **not** in the list still renders the current (v1) header.
4. Confirm Premium Learning gating (`plAllowedDomains`) still behaves identically (regression
   check on the shared refactor).
