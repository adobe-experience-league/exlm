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

| Command                   | Purpose                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `npm install`             | Install dev dependencies                                                              |
| `npm run up`              | Local dev (`aem up`); default `http://localhost:3000`                                 |
| `npm run up-secure`       | HTTPS local dev with signed-in flows (see [README](README.md); requires hosts + cert) |
| `npm run up-secure-stage` | Like `up-secure`, proxying stage content                                              |
| `npm run up-secure-prod`  | Like `up-secure`, proxying production content                                         |
| `npm run lint`            | ESLint + Stylelint                                                                    |
| `npm run lint:css:fix`    | Stylelint with `--fix`                                                                |
| `npm run format`          | Prettier write                                                                        |
| `npm run format:check`    | Prettier check                                                                        |
| `npm run quality`         | **CI gate**: format check + lint                                                      |

Install the AEM CLI globally if you prefer: `npm install -g @adobe/aem-cli`, then `aem up` matches `npm run up`.

### AI skills setup

This project ships with EDS skills for AI coding agents (Claude Code, Cursor, Copilot, etc.) pinned in [skills-lock.json](skills-lock.json). Restore them after cloning:

```bash
npx skills experimental_install
```

To update skills to the latest versions run `npm run setup:skills`, which re-runs the install and updates `skills-lock.json`.

### ExL dev team skills

Custom skills for the Experience League **development team** ship from [AdobeEXL/exl-dev-ai](https://github.com/AdobeEXL/exl-dev-ai) and are pinned in [skills-lock.json](skills-lock.json) alongside Adobe EDS skills. Refresh with `npm run setup:skills`.

## Project structure (high level)

```
├── blocks/           # Block JS/CSS (and block-local assets)
├── styles/           # Global CSS (e.g. styles.css, lazy-styles.css, fonts)
├── scripts/          # Page bootstrap (scripts.js, delayed.js), lib-franklin.js, and feature modules
├── icons/            # SVG icons
├── head.html         # Head fragment
├── fstab.yaml        # Content mount / converter
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
- For previews, use `curl` against the local dev server or published preview URLs; see [Keeping it 100](https://www.aem.live/developer/keeping-it-100) for performance expectations.

### Block visual regression tests

The [visual-test suite](tools/visual-tests/README.md) uses Playwright to render Sidekick Library block variations and compare screenshots with committed PNG baselines. Use the repository's Docker commands for local generation, testing, and snapshot updates, not bare host Playwright runs: the [Dockerfile](tools/visual-tests/Dockerfile) and [CI workflow](.github/workflows/visual-tests.yaml) use the same Playwright `v1.53.1-jammy` image to keep browser and font rendering consistent.

Key files:

- [config.js](tools/visual-tests/config.js): viewports, library paths, excluded blocks, Coveo mocking, and per-block readiness/hide settings.
- [generate-visual-tests.js](tools/visual-tests/generate-visual-tests.js): discovers library variations and generates specs. **Do not hand-edit generated specs.**
- [spec-helpers.js](tools/visual-tests/spec-helpers.js): shared rendering, network stubbing, readiness checks, and screenshot comparison.
- [playwright.config.ts](tools/visual-tests/playwright.config.ts): Chromium project, snapshot paths, reports, and pinned `en-US` locale / `UTC` timezone.
- [blocks/](tools/visual-tests/blocks/): generated specs, committed baselines, and Coveo HAR fixtures.

#### Adding a block or variation

1. Make sure the block implementation and representative authored variations are available in the **served Sidekick Library**, not just in `blocks/`. Open `http://localhost:3000/tools/sidekick/library.html?plugin=blocks` and verify that the block appears and each variation renders. The library uses `/tools/sidekick/library.json` and examples under `/tools/sidekick/blocks/` (see `SIDEKICK_CONFIG`); these can come from the mounted content source rather than checked-in files. If absent, arrange the content registration/preview before generating tests.
2. Check `EXCLUDED_BLOCKS` in [config.js](tools/visual-tests/config.js). The generator currently skips `atomic-search` and `browse-courses`; do not remove an exclusion without addressing why that block cannot be snapshotted reliably. There is no separate include list: library discovery determines which blocks get specs.
3. With Docker running and dependencies available, start the host dev server and build the test image:

   ```sh
   # Keep this running in a separate terminal.
   npm start

   # Run from the repository root in another terminal.
   curl -f http://localhost:3000/tools/sidekick/library.json
   npm run test:visual:build
   ```

   `npm start` starts both `aem up` on port 3000 and the visual-test API used by the library's Run Test button. For CLI-only runs, an existing `npm run up` server on port 3000 is sufficient. Docker must be able to reach it through `host.docker.internal`. Rebuild the image when image-baked dependencies or tooling change; the visual-tests directory itself is bind-mounted.

4. Generate the selected block's spec, then create its baselines. Replace `accordion` throughout with the library block slug:

   ```sh
   npm run test:visual:generate:block -- accordion
   npm run test:visual:update -- tools/visual-tests/blocks/accordion/accordion.spec.js
   npm run test:visual:block -- tools/visual-tests/blocks/accordion/accordion.spec.js
   npm run test:visual:report
   ```

   For a Coveo-backed block, configure and record its fixture as described below **before** creating baselines. The generator creates one test per library variation and configured viewport: Mobile (320x568), Tablet (768x1024), Desktop (1024x768), and Large (1440x900). Regenerate after adding, removing, or reordering library variations; variation indexes are part of screenshot names.

5. Inspect the generated spec and every new/changed baseline. Baselines live under `tools/visual-tests/blocks/<block>/<block>.spec.js-snapshots/`, named `<block>-<variationIndex>-<ViewportLabel>.png`. Include the generated spec, intentional baseline changes, any required HAR fixture, and related configuration changes in the PR. Remove obsolete snapshots only after verifying that their variation was intentionally removed or renamed.

#### Updating snapshots and diagnosing failures

- For existing tests, **run the scoped comparison first** with `npm run test:visual:block -- tools/visual-tests/blocks/accordion/accordion.spec.js`. Inspect expected/actual/diff images before updating. Fix regressions rather than accepting them as new baselines.
- Use the scoped `test:visual:update` command above only for verified intentional visual changes. Rerun the comparison **without** `--update-snapshots` afterward. Do not blanket-update unrelated blocks or relax comparison tolerances to make failures pass.
- To regenerate all specs, use `npm run test:visual:generate`; to validate the full suite, use `npm run test:visual`. Unscoped `npm run test:visual:update` updates the entire suite and should be reserved for an explicitly intended suite-wide baseline refresh.
- Local HTML reports are in [playwright-report/](tools/visual-tests/playwright-report/); structured results and failure images are in [test-results/](tools/visual-tests/test-results/). Inspect these locally; do not commit generated reports or transient results.

#### Keeping a block deterministic

The shared helper stubs sign-in and third-party traffic, freezes time and animations, and waits for decoration, loading indicators, fonts, images, network idle, and stable layout. These are isolated visual checks, not live integration or signed-in functional tests.

- If loading is not detected, add a block entry to `BLOCK_SNAPSHOT_READY_SELECTORS` in [config.js](tools/visual-tests/config.js), for example `'<block>': { hidden: '.my-loading-indicator' }`. The `hidden` selector must disappear or become invisible before capture; it is not a selector for content that should appear.
- `BLOCK_SNAPSHOT_HIDE_SELECTORS` maps a block slug to an array of selectors made invisible during capture. Use only for genuinely nondeterministic nonessential elements, not to hide regressions. `BLOCK_SNAPSHOT_EXTRA_WAIT` maps a slug to milliseconds and is a last resort; prefer observable readiness.
- For blocks fetching Coveo data, add the slug to `COVEO_MOCKED_BLOCKS`, generate its spec, then record a fixture using the running dev server:

  ```sh
  # Example for a Coveo-backed block; replace curated-cards with the target slug.
  docker compose -f tools/visual-tests/docker-compose.yml run --rm playwright \
    node tools/visual-tests/record-coveo-har.js curated-cards
  ```

  The recorder visits the generated variation URLs and writes `tools/visual-tests/blocks/<block>/<block>.har`. Inspect fixtures for credentials or sensitive data before committing; header redaction is not a substitute for review. Refresh the fixture when its canned responses need to change, then review and update that block's baselines. Mocked blocks use the HAR recording time; other blocks use `SNAPSHOT_FIXED_TIME`.

#### CI expectations

[Visual Tests](.github/workflows/visual-tests.yaml) runs automatically on PR updates, including drafts, in the main repository. Four shards feed a merged **Visual Tests** check; watch that final check, not just individual shard outcomes. Same-repository PRs receive an updated results comment; fork PRs run tests without posting it. Use the report and diff artifacts to investigate failures and **Re-run all jobs** to rerun CI. CI runs committed specs/baselines; it does not generate or approve new baselines for you.

### Self-review before commit

Before running `git add` / `git commit`, **run the `code-review` skill on your staged changes**. This applies to everyone — AI agents and humans driving an AI assistant.

- **How to run it**: in Cursor / Claude Code / Copilot Chat, type `/code-review` in the AI panel. The skill operates in **self-review mode** on uncommitted changes in the working directory and checks lint compliance, EDS patterns, performance, accessibility, secrets, CSS scoping, and `eslint-disable` justifications.
- **Prerequisite**: the skill ships with this repo via `skills-lock.json` — run `npx skills experimental_install` once after cloning to install it.
- **AI agents (Cursor, Claude Code, Copilot, etc.)**: do not run `git commit` without first invoking `/code-review` on the staged diff and resolving any blocking findings.
- **Manual fallback** (no AI tool available): review `git diff --staged` for the common issues called out under _Code style_ — debug `console.*`, unscoped CSS selectors, `!important` without justification, hardcoded config, secrets, CSS-in-JS, and changes to `scripts/lib-franklin.js`.

This is a **soft** convention — the husky `pre-commit` hook only prints a reminder and never blocks. Hard enforcement remains `lint-staged` + `npm run quality` in CI.

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
- **AI agents**: [Working with AI coding agents](https://www.aem.live/developer/ai-coding-agents) (Adobe).

## Security

- Do not commit secrets (API keys, tokens, passwords).
- All shipped JS runs in the browser—assume public inspection.
- Respect `.hlxignore` (and similar) for files that must not be served.

## Contributing

Follow [CONTRIBUTING.md](CONTRIBUTING.md): Adobe Code of Conduct, CLA for external contributors, and project review expectations. Use the PR template and keep commits aligned with team conventions described there.
