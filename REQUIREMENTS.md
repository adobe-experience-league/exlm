# 🧩 Feature: Premium Learning Recommended Content Block (EDS)

## 📖 Description

Create a new block **premium-learning-recommended-content** for Edge Delivery Services.

This block displays personalized learning recommendations based on a user's previous activity
and preference profile. It behaves similarly to **premium-learning-cards** and must only render
for signed-in users.

UI and layout must match the design provided in:

- `/images/recommended-learnings.png`

---

## 🎯 Objective

- Build a new EDS block based on existing project standards
- Block name must be: **premium-learning-recommended-content**
- Reuse structure, styling, and behavior from:

  - `premium-learning-cards.js` — block lifecycle, shimmer, error handling, auth guard
  - `browse-card.js` — card rendering via `buildCard()`
  - `premium-learning-cards.css` — import directly; reuse all existing class names
  - `responsive-list.js` — import and instantiate `ResponsiveList` for tab/dropdown switching; loads its own CSS internally

- Render cards with tab-based filtering (UI-only, no API re-fetch)
- Ensure UI matches the provided design reference

---

## 🎨 Design Reference (Figma / Image)

- Reference image: `/images/recommended-learnings.png`

### Design Requirements

- Section heading: **"Based on previous learnings"**
- Subtitle below heading: **"Recommended learnings based on your industry and strategies"**
- Tabs row (pill-style buttons) below heading/subtitle:
  - First tab: **"All"** (active by default)
  - Subsequent tabs: one per product from `api1.json → data.attributes.products[].name`
  - Example from mock: "Acrobat Sign", "Acrobat Services"
- Cards grid: **4 columns on desktop**, 2 on tablet, 1 on mobile
- Each card: thumbnail image, content type badge, title, metadata (duration, etc.)
- Match card layout, spacing, and alignment exactly from the image
- Maintain consistency with premium-learning-cards UI
- Hover/interaction states: follow premium-learning-cards as fallback

If any design detail is unclear:
→ Prefer **premium-learning-cards implementation** as fallback

---

## 🔐 Auth Requirement

- Block must only render for **signed-in users**
- Use `isSignedInUser()` from `../../scripts/auth/profile.js`
- If not signed in:
  - In UE author mode: show fallback content (same as premium-learning-cards)
  - On live pages: `block.remove()`
- Data is personalized — no unauthenticated fallback content

---

## 📦 Data Sources

Mock files:

- `/mock/api1.json` → `recommendationPreferences` (products + roles)
- `/mock/api2.json` → `learningObjects` (3 items in mock, up to 10 in production; **max 4 rendered per tab**)

These should be treated as the source of truth for development.

---

## 🔗 API Flow

### Step 1: recommendationPreferences

```
GET /users/{userId}/recommendationPreferences
```

Response shape (from mock):

```json
{
  "data": {
    "attributes": {
      "products": [{ "id": "...", "name": "Acrobat Sign" }, ...],
      "roles":    [{ "id": "...", "name": "Business User", "levels": ["ADVANCED"] }, ...]
    }
  }
}
```

- Extract `products[]` and `roles[]`
- Use to build query params for Step 2 AND to build tab labels

---

### Step 2: learningObjects/query

```
POST /learningObjects/query?page[limit]=10&sort=-recommendationScore&enforcedFields[learningObject]=products,roles,extensionOverrides,effectivenessData&include=instances.loResources.resources
```

Headers: `Content-Type: application/vnd.api+json`, `Accept: application/vnd.api+json`, `Authorization: oauth <token>`

Request body (JSON) — built dynamically from Step 1 response and authored `learningType`:

```json
{
  "filter.recommendationProducts": [{ "name": "<product-name>" }],
  "filter.recommendationRoles":    [{ "name": "<role-name>", "levels": ["<level>"] }],
  "filter.loTypes":                ["course"] | ["learningProgram"] | ["course", "learningProgram"],
  "filter.ignoreEnhancedLP":       false,
  "filter.learnerState":           ["notenrolled"],
  "filter.catalogIds":             ["208422"]
}
```

**`filter.loTypes` mapping** (from `learningType` authoring field):

| Authored value     | `filter.loTypes`                |
| ------------------ | ------------------------------- |
| `course`           | `["course"]`                    |
| `learningProgram`  | `["learningProgram"]`           |
| `both` _(default)_ | `["course", "learningProgram"]` |

**Payload field sources:**

| Payload field                   | Source                                            |
| ------------------------------- | ------------------------------------------------- |
| `filter.recommendationProducts` | `api1 → data.attributes.products[].name`          |
| `filter.recommendationRoles`    | `api1 → data.attributes.roles[].name` + `.levels` |
| `filter.loTypes`                | Mapped from authored `learningType` field         |
| `filter.ignoreEnhancedLP`       | Hardcoded `false`                                 |
| `filter.learnerState`           | Hardcoded `["notenrolled"]`                       |
| `filter.catalogIds`             | Hardcoded `["208422"]`                            |

---

## 🧠 Business Logic

1. Check `isSignedInUser()` — remove block if not signed in
2. Add shimmer loading state
3. `Promise.all([fetchPreferences(), fetchLanguagePlaceholders()])` in parallel
4. Build query params from Step 1 response
5. Fetch learningObjects with built params
6. Remove shimmer
7. Normalize API response into card model
8. Store all data in memory (module-level variables — single load, never re-fetch)
9. Build `tabsData` map: `{ 'All': allCards, 'Acrobat Sign': [...], ... }`
   - Tab labels = "All" + `api1 products[].name`
   - Filter condition: card's `products[].name` includes the tab's product name
10. Render tabs row
11. Render first **4 cards** for active tab ("All" by default)
12. Tab clicks: filter from in-memory `tabsData`, render first 4 — **no API calls**

---

## 🖥️ Block Requirements

### Block Name

`premium-learning-recommended-content`

### Files to Create

- `/blocks/premium-learning-recommended-content/premium-learning-recommended-content.js`
- `/blocks/premium-learning-recommended-content/premium-learning-recommended-content.css`

### Files to Modify (authoring registration)

- `component-models.json` — add field definitions for the block
- `component-definition.json` — register block in UE component palette
- `component-filters.json` — allow block in `"section"` containers

---

## ✍️ Authoring Configuration (UE / Universal Editor)

Every EDS block that is author-configurable must be registered in three JSON config files at the repo root. Follow the exact same pattern as `premium-learning-cards`.

---

### 1. `component-models.json`

Add a new entry with `"id": "premium-learning-recommended-content"` and the following fields:

| Field name     | Component type                         | Default value | Purpose                                           |
| -------------- | -------------------------------------- | ------------- | ------------------------------------------------- |
| `title`        | `text`                                 | `""`          | Block section heading text                        |
| `titleType`    | `select` (h1–h6)                       | `"h2"`        | Heading tag level                                 |
| `description`  | `richtext`                             | `""`          | Subtitle below heading                            |
| `learningType` | `select` (course/learningProgram/both) | `"both"`      | Controls `filter.loTypes` sent in API 2 POST body |

> **Note:** `learningType` is an authoring select field. The selected value is mapped to the `filter.loTypes` array in the API 2 POST payload — it is **not** a client-side filter. `course` → `["course"]`, `learningProgram` → `["learningProgram"]`, `both` → `["course", "learningProgram"]`.

**JSON entry to add** (append before the closing `]` of the top-level array):

```json
{
  "id": "premium-learning-recommended-content",
  "fields": [
    {
      "component": "text",
      "valueType": "string",
      "name": "title",
      "value": "",
      "label": "Title",
      "description": "Sets the heading text for the Recommended Learning block."
    },
    {
      "component": "select",
      "valueType": "string",
      "name": "titleType",
      "value": "h2",
      "label": "Title Heading Type",
      "options": [
        { "name": "H1", "value": "h1" },
        { "name": "H2", "value": "h2" },
        { "name": "H3", "value": "h3" },
        { "name": "H4", "value": "h4" },
        { "name": "H5", "value": "h5" },
        { "name": "H6", "value": "h6" }
      ]
    },
    {
      "component": "select",
      "valueType": "string",
      "name": "learningType",
      "value": "both",
      "label": "Learning Type",
      "description": "Filter recommended learning objects by type. 'Course' shows only courses, 'Cohort' shows only cohorts/learning programs, 'Both' shows all types.",
      "options": [
        { "name": "Course", "value": "course" },
        { "name": "Cohort", "value": "learningProgram" },
        { "name": "Both", "value": "both" }
      ]
    },
    {
      "component": "select",
      "name": "cta1_Type",
      "value": "primary",
      "label": "CTA Type",
      "description": "'Primary' renders a filled blue CTA, 'Secondary' renders a white CTA with black border.",
      "valueType": "string",
      "options": [
        { "name": "Primary", "value": "primary" },
        { "name": "Secondary", "value": "secondary" }
      ]
    },
    {
      "component": "text",
      "valueType": "string",
      "name": "cta1_linkText",
      "value": "",
      "label": "CTA Text",
      "description": "Text to display inside the CTA button."
    },
    {
      "component": "text",
      "valueType": "string",
      "name": "cta1_link",
      "value": "",
      "label": "CTA Link",
      "description": "URL to open when the CTA button is clicked."
    }
  ]
}
```

---

### 2. `component-definition.json`

Add a new component entry inside the appropriate `"groups"` array — same group as `premium-learning-cards`. This registers the block in the UE component palette so authors can insert it on a page.

**JSON entry to add** (alongside the `premium-learning-cards` entry):

```json
{
  "title": "Premium Learning Recommended Content",
  "id": "premium-learning-recommended-content",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Premium Learning Recommended Content",
          "model": "premium-learning-recommended-content",
          "title": "Based on previous learnings",
          "titleType": "h2",
          "learningType": "both",
          "cta1_Type": "primary",
          "cta1_linkText": "",
          "cta1_link": ""
        }
      }
    }
  }
}
```

**`template` field defaults explained:**
| Template key | Default | Why |
|---|---|---|
| `name` | `"Premium Learning Recommended Content"` | Block display name in UE palette |
| `model` | `"premium-learning-recommended-content"` | Links to `component-models.json` entry |
| `title` | `"Based on previous learnings"` | Default heading from Figma design |
| `titleType` | `"h2"` | Matches Figma hierarchy |
| `learningType` | `"both"` | Show all types by default |
| `cta1_Type` | `"primary"` | Matches `premium-learning-cards` default |
| `cta1_linkText` | `""` | Author fills in |
| `cta1_link` | `""` | Author fills in |

---

### 3. `component-filters.json`

Add `"premium-learning-recommended-content"` to the `"section"` filter's `components` array. This controls which page containers the block can be dropped into.

**Where to add:** Inside the `"id": "section"` filter entry, alongside `"premium-learning-cards"`:

```json
"premium-learning-recommended-content"
```

**Why `"section"` only:**

- `premium-learning-cards` is also in `"section"` only — not in `profile-bottom-section`, `courses-section`, or other specialised containers
- This block is a personalised content block for signed-in users — it belongs on general pages in the same contexts as `premium-learning-cards`
- If it needs to appear in other containers (e.g., profile pages), add it to those filter lists too

---

### Authoring Config — Summary of Changes

| File                        | Change                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| `component-models.json`     | Add new entry `"id": "premium-learning-recommended-content"` with 6 fields   |
| `component-definition.json` | Add new component entry with template defaults into the correct group        |
| `component-filters.json`    | Add `"premium-learning-recommended-content"` to `"section"` components array |

---

## 🔁 Reusability Requirements

### JS — Import and reuse directly

| Import                                                                 | From                                               |
| ---------------------------------------------------------------------- | -------------------------------------------------- |
| `buildCard`                                                            | `../../scripts/browse-card/browse-card.js`         |
| `BrowseCardShimmer`                                                    | `../../scripts/browse-card/browse-card-shimmer.js` |
| `createTag`, `fetchLanguagePlaceholders`, `htmlToElement`, `getConfig` | `../../scripts/scripts.js`                         |
| `isSignedInUser`                                                       | `../../scripts/auth/profile.js`                    |
| `ResponsiveList`                                                       | `../../scripts/responsive-list/responsive-list.js` |

Reuse these **patterns verbatim** from `premium-learning-cards.js`:

- Block reset (`block.innerHTML = ''`, add classes)
- Auth guard (`isSignedInUser` check + UE fallback)
- Shimmer lifecycle (`addShimmer` / `removeShimmer`)
- `fetchAndRenderCards` structure
- Error catch → `block.remove()` in production, fallback in UE mode
- No-results rendering

### CSS — Maximum reuse via import + shared class names

```css
/* premium-learning-recommended-content.css */
@import '../premium-learning-cards/premium-learning-cards.css';
/* ^ This already imports browse-cards-block.css internally */
/* ResponsiveList loads responsive-list.css internally via loadCSS — no manual import needed */
```

**DOM must use the same class names** as `premium-learning-cards` so imported CSS applies:

- Block element → `browse-cards-block` + `premium-learning-cards-block` + `premium-learning-recommended-content-block`
- Header → `premium-learning-cards-block-header`
- Title → `premium-learning-cards-block-title`
- CTA → `premium-learning-cards-block-cta`
- Cards wrapper → `browse-cards-block-content`
- No-results → `premium-learning-cards-no-results`

**Tab UI is rendered entirely by `ResponsiveList`** — no custom tab DOM or CSS required:

- On desktop: renders `<div class="responsive-list"><ul><li data-tab-id="..." class="active">...</li></ul></div>`
- On mobile (< 1024px): automatically renders a `Dropdown` component instead
- Active state, underline, and spacing handled by `responsive-list.css` loaded internally

---

## 🧱 HTML Structure (target DOM)

```
div.premium-learning-recommended-content
  .browse-cards-block
  .premium-learning-cards-block
  .premium-learning-recommended-content-block

  ├── div.premium-learning-cards-block-header
  │     ├── div.premium-learning-cards-block-title
  │     │     └── h2 "Based on previous learnings"
  │     └── div.premium-learning-cards-block-cta  (optional, from authoring)

  ├── div.premium-learning-tabs-wrapper             ← ResponsiveList wrapper
  │     └── div.responsive-list                    ← rendered by ResponsiveList (desktop)
  │           └── ul
  │                 ├── li[data-tab-id="All"].active
  │                 ├── li[data-tab-id="Acrobat Sign"]
  │                 └── li[data-tab-id="Acrobat Services"]
  │     (on mobile < 1024px: renders Dropdown instead of ul)

  └── div.browse-cards-block-content
        ├── div  ← buildCard() output
        ├── div  ← buildCard() output
        └── div  ← buildCard() output
```

---

## 🔄 Data Mapping

Map each `api2.json → data[i]` to card model for `buildCard()`:

| Card field    | Source                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `id`          | `item.id`                                                                                                   |
| `title`       | `item.attributes.localizedMetadata[0]?.name ?? ''`                                                          |
| `description` | `item.attributes.localizedMetadata[0]?.overview ?? item.attributes.localizedMetadata[0]?.description ?? ''` |
| `image`       | `item.attributes.imageUrl ?? item.attributes.bannerUrl ?? ''`                                               |
| `contentType` | `item.attributes.loType` (`"course"` or `"learningProgram"`)                                                |
| `duration`    | `item.attributes.duration` (seconds)                                                                        |
| `tags`        | `item.attributes.tags ?? []`                                                                                |
| `products`    | `item.attributes.products?.map(p => p.name) ?? []`                                                          |
| `roles`       | `item.attributes.roles?.map(r => r.name) ?? []`                                                             |

---

## 🧩 Tabs Behavior

- Tabs built from `api1.json → data.attributes.products[]`
- "All" tab always first
- Use **`ResponsiveList`** from `../../scripts/responsive-list/responsive-list.js` — it handles all tab rendering, styling, active state, and mobile dropdown automatically
- `items` array: `Object.keys(tabsData).map(label => ({ value: label, title: label }))`
- `defaultSelected: 'All'`
- `onInitCallback`: render initial cards for "All" tab into `browse-cards-block-content`
- `onSelectCallback(label)`: filter from in-memory `tabsData[label]`, re-render `browse-cards-block-content` with first 4 cards; show no-results if empty
- On desktop: renders horizontal `ul > li` tabs with `.active` underline
- On mobile (< 1024px): automatically switches to `Dropdown`; switches back on resize
- **Never trigger an API call on tab selection**

---

## ⚠️ Edge Cases

Follow same handling as `premium-learning-cards.js`:

| Scenario                    | Handling                                          |
| --------------------------- | ------------------------------------------------- |
| Not signed in               | Remove block (live) / show fallback (UE mode)     |
| `api1` fetch failure        | `console.error` + `block.remove()` or UE fallback |
| `api2` fetch failure        | Same                                              |
| Empty `api2.data[]`         | Show no-results container                         |
| Tab filter yields 0 cards   | Show no-results container                         |
| Missing `localizedMetadata` | Nullish chain → empty string                      |
| Missing `imageUrl`          | Fallback: `bannerUrl ?? ''`                       |
| Missing `products`/`roles`  | Default to `[]`                                   |

---

## 🚫 Do NOT

- Do not introduce frameworks
- Do not rewrite existing logic that can be imported/reused
- Do not duplicate CSS that already exists in `premium-learning-cards.css`
- Do not call API on tab click
- Do not ignore design reference
- Do not make the block visible to unauthenticated users

---

## 🧪 Expected Output

**Block files:**

1. Complete `premium-learning-recommended-content.js`
2. Minimal `premium-learning-recommended-content.css` — one `@import` line (`premium-learning-cards.css`); `ResponsiveList` loads its own CSS internally
3. Proper EDS block initialization (`export default async function decorate(block)`)
4. Signed-in user auth guard
5. Two-step API fetch with shimmer loading
6. In-memory tab filtering via `ResponsiveList` callbacks (no re-fetch, no custom tab JS)
7. Error + empty-state handling (aligned with `premium-learning-cards`)
8. UI aligned with `/images/recommended-learnings.png`

**Authoring config changes:** 9. `component-models.json` — new entry `"id": "premium-learning-recommended-content"` with 6 authoring fields (title, titleType, description, learningType, cta1_Type, cta1_linkText, cta1_link) 10. `component-definition.json` — new component entry in the correct group with template defaults 11. `component-filters.json` — `"premium-learning-recommended-content"` added to `"section"` components list

---

## 🧠 Assumptions

- Block name is `premium-learning-recommended-content` (overrides earlier draft name `previous-learnings`)
- Tabs are driven by `api1.json → data.attributes.products[]` — confirmed from Figma screenshot
- Auth is required — data is personalized, matches premium-learning-cards behavior
- `buildCard()` is called as-is with normalized card data — no modification to browse-card.js
- `premium-learning-cards.css` is imported directly to avoid CSS duplication
- `ResponsiveList` is used for all tab/dropdown UI — no `tabs.css` or `tabs.js` pattern needed
- **4 cards max rendered per tab** — `Math.min(4, filteredCards.length)`
- CSS variables follow existing design tokens — no new tokens introduced
- Branch name must be ≤ 18 chars (e.g., `exlm-plr` or `exlm-rec-learn`)
- `learningType` authoring field filters cards client-side by `item.attributes.loType` — no API re-fetch
