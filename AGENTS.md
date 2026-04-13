# AGENTS.md

This repository implements **Adobe Experience League** on **Edge Delivery Services** (AEM Sites as a Cloud Service). Use this file together with the [Adobe EDS boilerplate AGENTS.md](https://github.com/adobe/aem-boilerplate/blob/main/AGENTS.md) mindset: follow Adobe’s standards for fast, authorable, and maintainable experiences, while respecting the **project-specific** setup below.

For human-oriented onboarding, see [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md). Pull requests must follow [.github/pull_request_template.md](.github/pull_request_template.md).

## Project overview

- **Package**: `@adobe-experience-league/exlm` (see [package.json](package.json)).
- **Stack**: ES modules, block-scoped CSS, HTML decorated by project JS. Tooling is Node-based (lint/format); the **runtime** site does not rely on a bundler for block code.
- **Scale**: Large codebase—many blocks under `blocks/` and substantial shared logic under `scripts/` (auth, browse, search, rails, Adobe Target, Coveo-related flows, and more). **Prefer extending existing patterns** (similar blocks or `scripts/` modules) over introducing new conventions.

### Core library name

Imports use **`scripts/lib-franklin.js`**, not the boilerplate’s `aem.js`. It provides the same class of helpers (decorate blocks/sections, `loadCSS`, `loadScript`, placeholders, etc.). Treat it like upstream core: **avoid casual edits**; extend behavior via blocks, `scripts/scripts.js`, and `scripts/delayed.js` unless there is a strong, reviewed reason to change the library.

### Content pipeline

HTML is not only “folder + Markdown” in the default setup: **[fstab.yaml](fstab.yaml)** mounts the site from an **Adobe I/O Runtime** converter (`type: markup`, `suffix: '.md'`). The [README](README.md) describes **exlm-converter** as the content pipeline entry point and how to point `fstab.yaml` at your own deployed action when needed.

## Setup commands

**Requirements** (from [package.json](package.json)): Node `>=22`, npm `>=10`.

| Command                   | Purpose                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm install`             | Install dev dependencies                                                                                     |
| `npm run up`              | Local dev (`aem up`); default `http://localhost:3000`                                                        |
| `npm run up-secure`       | HTTPS local dev with signed-in flows (see [README](README.md); requires hosts + cert)                        |
| `npm run up-secure-stage` | Like `up-secure`, proxying stage content                                                                     |
| `npm run up-secure-prod`  | Like `up-secure`, proxying production content                                                                |
| `npm run lint`            | ESLint + Stylelint                                                                                           |
| `npm run lint:css:fix`    | Stylelint with `--fix`                                                                                       |
| `npm run format`          | Prettier write                                                                                               |
| `npm run format:check`    | Prettier check                                                                                               |
| `npm run quality`         | **CI gate**: format check + lint + `paths.json` / `paths.yaml` sync ([validate-paths.js](validate-paths.js)) |
| `npm run validate:paths`  | Ensure `paths.yaml` and `paths.json` match                                                                   |

Install the AEM CLI globally if you prefer: `npm install -g @adobe/aem-cli`, then `aem up` matches `npm run up`.

## Project structure (high level)

```
├── blocks/           # Block JS/CSS (and block-local assets)
├── styles/           # Global CSS (e.g. styles.css, lazy-styles.css, fonts)
├── scripts/          # Page bootstrap (scripts.js, delayed.js), lib-franklin.js, and feature modules
├── icons/            # SVG icons
├── head.html         # Head fragment
├── fstab.yaml        # Content mount / converter
├── paths.yaml        # Path config (must stay in sync with paths.json)
├── paths.json
└── component-*.json  # Universal Editor / authoring metadata
```

`scripts/` is not only two files: it contains many **domain modules** imported from blocks or loaded dynamically—search before adding parallel utilities.

## Code style

- **JavaScript**: ES modules; include `.js` extensions in imports; follow the repo’s ESLint (Airbnb-based) and Prettier setup. Run `npm run lint` before pushing.
- **CSS**: Stylelint with the standard config; scope selectors to the block (e.g. `.block-name .element`). Prefer mobile-first layout and breakpoints at **600px / 900px / 1200px** unless an existing pattern differs. Avoid confusing names like `{block}-container` on block internals when they collide with section wrappers.
- **HTML**: Semantic markup; meet accessibility expectations (headings, labels, focus). Follow EDS markup conventions for sections and blocks ([markup sections & blocks](https://www.aem.live/developer/markup-sections-blocks), [markup reference](https://www.aem.live/developer/markup-reference)).

This repo uses **CSS** for styling; there is no separate SCSS build step for blocks in this tree.

## Blocks

Each block should stay **self-contained** and export a default async `decorate(block)` (or equivalent pattern used in sibling blocks). The **initial authored structure** is the contract between authors and code—handle missing optional cells/rows defensively.

When changing structure or selectors, check **existing pages** and the [pull request template](.github/pull_request_template.md) test URL list.

### `scripts.js` critical path

`scripts/scripts.js` is on the critical path. **Do not add heavy top-level imports** there; load nonessential code with dynamic `import()` as done elsewhere in the file.

### LCP-related blocks

`LCP_BLOCKS` in `scripts/scripts.js` lists blocks that participate in LCP handling (currently includes `video-embed`, `marquee`, `article-marquee`, `personalized-content-placeholder`, `atomic-search`, `slides`). If you introduce or promote a block that is **above the fold** and affects LCP, update this list deliberately.

## Integrations and cross-cutting behavior

Agents should know these exist before “simplifying” the architecture:

- **Coveo / Atomic Search** — e.g. `initiateCoveoAtomicSearch` and the `atomic-search` block.
- **Feature flags** — `scripts/utils/feature-flag-utils.js` (and usages from `scripts.js`).
- **Locales and paths** — `getPathDetails()` and related helpers in `scripts/scripts.js` account for both EDS-style paths (`/en/...`) and AEM content paths (`/content/...`). Do not break language or path parsing when changing routing or links.

## Page loading phases

Progressive loading follows the same **eager / lazy / delayed** model as standard EDS projects: core decoration and first section work run early; header/footer and remaining sections load in the lazy phase; deferrable work belongs in **`scripts/delayed.js`** (and similar patterns). See `loadPage` flow in `scripts/scripts.js`.

## Testing and quality assurance

- Run **`npm run quality`** before opening a PR; CI runs the same via [.github/workflows/quality-action.yaml](.github/workflows/quality-action.yaml).
- If you change **`paths.yaml`**, update **`paths.json`** to match (or vice versa)—`validate-paths.js` enforces parity.
- For previews, use `curl` against the local dev server or published preview URLs; see [Keeping it 100](https://www.aem.live/developer/keeping-it-100) for performance expectations.

## Pull requests

- Include the **Jira issue** and **test URLs** as described in [.github/pull_request_template.md](.github/pull_request_template.md). Prefix paths with `$` so the branch preview base URL can be injected (see [.github/workflows/update-pr-description.yaml](.github/workflows/update-pr-description.yaml)).
- Use **`?martech=off`** on test URLs where the template suggests it to reduce martech noise while validating UI.

## Branch names

Keep branch names **short**: preview hostnames have length limits. The repo includes [check-branch-name.js](check-branch-name.js) to validate branch names against URL constraints. The [README](README.md) also recommends short names (e.g. under ~18 characters) for practical preview URLs.

## Environments and URLs

**GitHub**: `adobe-experience-league/exlm`.

Hosts evolve (`hlx.page` / `hlx.live` vs `aem.page` / `aem.live`). Treat these as the same **pattern** with different DNS:

| Environment               | URL pattern                                                                       |
| ------------------------- | --------------------------------------------------------------------------------- |
| Branch preview            | `https://{branch}--exlm--adobe-experience-league.aem.page/` (or `.hlx.page`)      |
| Production preview (main) | `https://main--exlm--adobe-experience-league.hlx.page/` (see [README](README.md)) |
| Production live           | `https://main--exlm--adobe-experience-league.hlx.live/`                           |

Always test against the URL your reviewers use in the PR template.

## Troubleshooting

- **EDS docs**: [https://www.aem.live/docs/](https://www.aem.live/docs/) and `site:www.aem.live` web search.
- **Unexpected HTML**: remember **`fstab.yaml`** points at a **converter**—HTML changes may require converter or authoring pipeline updates, not only this repo.
- **Paths errors**: re-run `npm run validate:paths` after editing `paths.yaml` / `paths.json`.
- **AI agents**: [Working with AI coding agents](https://www.aem.live/developer/ai-coding-agents) (Adobe).

## Security

- Do not commit secrets (API keys, tokens, passwords).
- All shipped JS runs in the browser—assume public inspection.
- Respect `.hlxignore` (and similar) for files that must not be served.

## Contributing

Follow [CONTRIBUTING.md](CONTRIBUTING.md): Adobe Code of Conduct, CLA for external contributors, and project review expectations. Use the PR template and keep commits aligned with team conventions described there.
