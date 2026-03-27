# Premium Learning Recommended Content — Block Requirements

## Overview

Displays personalized learning recommendations from Adobe Learning Manager (ALM/PrimeAPI v2) for signed-in users. Recommendations are surfaced as browse cards grouped by a "For you" tab and per-product tabs.

---

## Authored Block Inputs

| Row | Value            | Description                                              |
| --- | ---------------- | -------------------------------------------------------- |
| 1   | Heading HTML     | Block header title                                       |
| 2   | Description HTML | Block header subtitle                                    |
| 3   | Learning type    | `course`, `learningProgram`, or `both` (default: `both`) |

---

## Runtime Behavior

### Authentication Gate

- The block only renders for **signed-in users**.
- If the user is not signed in:
  - In **UE Author Mode** (`.html` URL or `window.hlx.aemRoot`): renders fallback content via `showFallbackContentInUEMode`.
  - Otherwise: the block is removed from the DOM.

### Data Flow (Two-Step API)

1. **Step 1 — GET** `/users/{userId}/recommendationPreferences`
   Retrieves the user's saved product and role preferences.

2. **Step 2 — POST** `/learningObjects/query`
   Queries learning objects using the preferences as filters. Fixed parameters:
   - `page[limit]`: 10
   - `sort`: `-recommendationScore`
   - `enforcedFields[learningObject]`: `products,roles,extensionOverrides,effectivenessData`
   - `include`: `instances.loResources.resources`
   - `filter.learnerState`: `['notenrolled']`
   - `filter.catalogIds`: `['208422']`
   - `filter.ignoreEnhancedLP`: `false`
   - `filter.loTypes`: derived from authored learning type

### Card Rendering

- A maximum of **4 cards** are rendered at a time (`MAX_CARDS = 4`).
- Cards are built via `buildCard` from the browse-card script.
- Raw API results are mapped to card data via `BrowseCardsPLAdaptor.mapResultsToCardsData`.

### Tabs

- A **"For you"** tab shows all recommended cards (label from `premiumLearningTabForYou` placeholder, default: `"For you"`).
- Additional tabs are created for each **product** from the user's preferences, filtered to cards matching that product.
- Tabs are rendered using `ResponsiveList`.
- If a tab has no results, a no-results message is shown (placeholders: `premiumLearningCardsRecsHeader`, `premiumLearningCardsRecsDescription`).

### Loading State

- A shimmer (`BrowseCardShimmer`) is shown while API calls are in flight and removed on success or error.

### Error Handling

- On any API failure: shimmer is removed, error is logged to console, and the block falls back to UE Author Mode content or is removed.

---

## Local Development Modes (`config.json`)

> `config.json` is git-ignored and only present in local dev environments.

### `localDev: true` — Mock mode

All API calls are bypassed. The block renders using static `api1` (preferences) and `api2` (learning objects) payloads defined directly in `config.json`.

### `localDevAuth: true` — Real API with config credentials

API calls are made as normal but authentication credentials are sourced from `config.json` instead of the browser session:

- `token` → used as the `Authorization: oauth <token>` header (replaces `getPLAccessToken()`)
- `userId` → used in the Step 1 URL path (replaces `getCookie('alm_user_id')`)
- The sign-in gate is bypassed (user treated as signed in).

This mode is intended for testing the full API flow locally without requiring a live browser session.

**`config.json` shape:**

```json
{
  "localDev": false,
  "localDevAuth": true,
  "userId": 12345678,
  "token": "<alm-access-token>",
  "api1": { ... },
  "api2": { ... }
}
```

> Only one mode should be active at a time. `localDev` takes precedence over `localDevAuth`.

---

## Placeholders

| Key                                   | Default fallback                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `premiumLearningTabForYou`            | `"For you"`                                                                                |
| `premiumLearningCardsRecsHeader`      | `"No Premium Learning recommended results."`                                               |
| `premiumLearningCardsRecsDescription` | `"Try searching for a specific product or role, or explore all Premium learning content."` |

---

## Constants

| Constant                     | Value             | Purpose                    |
| ---------------------------- | ----------------- | -------------------------- |
| `MAX_CARDS`                  | `4`               | Max cards rendered per tab |
| `RECOMMENDED_CATALOG_IDS`    | `['208422']`      | ALM catalog filter         |
| `RECOMMENDED_LEARNER_STATES` | `['notenrolled']` | Learner state filter       |
| `IGNORE_ENHANCED_LP`         | `false`           | Enhanced LP filter flag    |
