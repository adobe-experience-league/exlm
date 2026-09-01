# Visual Test Suite

Automated visual regression testing for AEM Edge Delivery Services blocks. Every block variation in the Sidekick Library is rendered at multiple viewports and screenshotted; the screenshot is compared against a committed baseline image (or a Figma export) to catch unintended visual changes.

Stack: [Playwright](https://playwright.dev/) for browser automation/screenshot diffing, a small Express server for triggering runs from the browser, and GitHub Actions for CI.

## How it fits together

```
tools/
├── sidekick/
│   ├── config.json          # Sidekick plugin registration ("Sidekick Library")
│   └── library.html         # Hosts the Sidekick Library UI used to render each block
├── visual-overlay/
│   └── index.js             # "Toggle Overlay" button — ghosts the Figma baseline over the live block
└── visual-tests/
    ├── config.js             # Shared VIEWPORTS list + Sidekick Library paths
    ├── generate-visual-tests.js  # Scans the library and generates one *.spec.js per block
    ├── figma-util.js         # Downloads Figma frames to use as baseline snapshots
    ├── server.js             # Express API used by the in-browser "Run Test" button
    ├── start-visual-test-server.js  # Spawns server.js (used by `npm start`)
    └── blocks/
        └── <block-name>/
            ├── <block-name>.spec.js               # Generated Playwright spec
            ├── config.js                          # Optional FIGMA_CONFIG for baseline import
            └── <block-name>.spec.js-snapshots/    # Committed baseline PNGs
```

Tests run against the local AEM dev server (`aem up`, `http://localhost:3000`) via `tools/sidekick/library.html`, which renders each block/variation in an iframe — the same view authors use in the Sidekick Library plugin.

## How a test works

Each generated spec (e.g. [`blocks/cards/cards.spec.js`](blocks/cards/cards.spec.js)) does the following, once per viewport:

1. Navigate to `/tools/sidekick/library.html?plugin=blocks&path=<template>&index=<variation>&vtest=true`. The `vtest=true` flag puts the library UI into a stripped-down "vtest mode" (see [`visual-test.js`](visual-test.js)) that hides chrome and lets the block render at full width.
2. Wait for the `sidekick-library` component, then reach into its shadow DOM/iframe to find the `block-renderer` iframe and the rendered block element.
3. Wait briefly for layout to settle, force `overflow: visible`/`max-height: none` so nothing is clipped, then resize the viewport to the block's actual bounding-box height.
4. Take a clipped screenshot of just the block (`clip: box`) and compare it with `expect(screenshot).toMatchSnapshot(...)`.

Snapshot comparison is intentionally strict (`tools/visual-tests/blocks/**/config.js` values aside, these are hardcoded in the generator):

| Option              | Value | Meaning                                |
| ------------------- | ----- | -------------------------------------- |
| `maxDiffPixels`     | 50    | absolute pixel count allowed to differ |
| `threshold`         | 0.05  | per-pixel color tolerance              |
| `maxDiffPixelRatio` | 0.005 | 0.5% of total pixels may differ        |

Viewports come from `VIEWPORTS` in [`config.js`](config.js): Mobile (320×568), Tablet (768×1024), Desktop (1024×768), Large (1440×900, default).

### Baselines: generated screenshot vs. Figma design

Snapshots live in `blocks/<name>/<name>.spec.js-snapshots/`. There are two ways they get there:

- **Playwright-generated**: run `npm run test:visual:update` once, review the output, commit it as the source of truth.
- **Figma-sourced**: add a `config.js` next to the spec exporting `FIGMA_CONFIG` (see [`blocks/cards/config.js`](blocks/cards/config.js)) with a `figmaUrl` (or legacy `figmaFile`/`figmaNode`) per named export, then run `npm run test:visual:figma`. [`figma-util.js`](figma-util.js) calls the Figma REST API (needs `FIGMA_ACCESS_TOKEN` in the environment/`.env`) and downloads the frame straight into the snapshots folder under the exact filename Playwright expects — so the "baseline" is the design, not a previously rendered screenshot.

### Regenerating specs

Specs aren't hand-written. `npm run test:visual:generate` runs [`generate-visual-tests.js`](generate-visual-tests.js) inside the same Docker container used for tests (needs `aem up` running so it has a library to scan), which:

1. Launches headless Chromium, opens the Sidekick Library, and walks its shadow DOM to enumerate every block and variation registered in the library.
2. Groups them by block name and writes one `blocks/<block>/<block>.spec.js` file with a test per variation × viewport.

Re-run this whenever a block or its variations change in the library so the specs stay in sync. It's a code generator — don't hand-edit the generated spec files; edit the template/library content or the generator instead.

### Authoring-time helpers

- **`visual-test.js`** — injected into the Sidekick Library iframe. Adds a server-status indicator and a "Run Test" button next to the block toolbar so an author can trigger the Playwright run for the block they're currently viewing without leaving the browser (calls the Express server below), then shows the HTML report in a modal.
- **`visual-overlay/index.js`** — adds a "Toggle Overlay" button that ghosts the matching baseline image (from the snapshots folder, picked by current viewport) over the live block at an adjustable opacity, for eyeballing drift against the Figma design directly in the library.

### Local test server

`npm run test:visual:server` (or `npm start`, which runs it alongside `aem up` via `concurrently`) starts [`server.js`](server.js): an Express app on port 3001+ (auto-increments if busy, writes the chosen port to `port.txt`) exposing:

- `GET /api/health` — used to detect whether the server is already running.
- `POST /api/run-visual-test` — runs `npm run test:visual:block -- tools/visual-tests/blocks/<component>` for the requested block (component name is validated against `^[a-z0-9-]+$`).
- `GET /playwright-report/*` — serves the last HTML report, so the "Run Test" button in the library can show results in an iframe.

This server only needs to be running if you want the in-browser "Run Test" button; it's not required in CI.

## Running the tests

Playwright tests and snapshots only ever run inside Docker — this keeps font rendering pixel-identical between every machine and CI, so there's no separate "local CLI" path to fall out of sync. All commands below are `npm` scripts defined in the root [`package.json`](../../package.json).

The GitHub Actions runner uses `mcr.microsoft.com/playwright:v1.53.1-jammy` so fonts render identically between CI and local runs; `tools/visual-tests/docker-compose.yml` + `tools/visual-tests/Dockerfile` reproduce that same image locally (the build context is still the repo root, since the image needs the whole repo copied in):

```sh
# one-time
npm i

# start the AEM dev server (needed as the container's BASE_URL target)
npm start

# in another terminal
npm run test:visual:build   # build the image
npm run test:visual         # run the suite in the container
npm run test:visual:update  # run with --update-snapshots

# open the last HTML report
npm run test:visual:report
```

`tools/visual-tests/playwright.config.ts` points `testDir` at its own directory, skips booting `aem up` itself when `DOCKER=true` (the container reaches the host's `aem up` instead), and writes reports/results/snapshots under `tools/visual-tests/`.

The compose file mounts `blocks/`, `test-results/`, and `playwright-report/` back onto the host so generated baselines/reports survive after the `--rm` container exits, and adds `host.docker.internal` so the container can reach the `aem up` dev server running on the host. `tools/visual-tests/docker-entrypoint.sh` proxies container ports 3000/3001 to `host.docker.internal`, since the Sidekick Library hardcodes `localhost` URLs that would otherwise resolve inside the container instead of the host.

## Adding a new block/variation to the suite

1. Make sure the block and its variations are registered in the Sidekick Library (`tools/sidekick/library/...`).
2. Run `npm run test:visual:generate` to (re)generate `blocks/<block>/<block>.spec.js`.
3. Either:
   - run `npm run test:visual:update` and review/commit the generated PNGs, or
   - add a `config.js` with `FIGMA_CONFIG` next to the new spec and run `npm run test:visual:figma` to pull baselines from Figma.
4. Run `npm run test:visual` and confirm it's green before committing the snapshots.

## CI/CD

Two workflows under [`.github/workflows/`](../../.github/workflows/):

### `main.yaml` — Build

Runs on every push: checkout, Node 22, `npm ci`, `npm run lint` (ESLint + Stylelint). Pure code-quality gate, no visual tests.

### `visual-tests.yaml` — Visual Tests

Runs on pull requests targeting `main` or any `visual-test*` branch. Steps:

1. Checks out the repo inside the **same Playwright container image** used for local Docker runs (`mcr.microsoft.com/playwright:v1.53.1-jammy`), so CI and local Docker baselines are pixel-identical — no browser install step needed, it's baked into the image.
2. `npm ci`, then installs `@adobe/aem-cli` globally (needed since the Playwright config drives `aem up` as the local dev server).
3. Runs `npx playwright test --reporter=html,json` with `continue-on-error: true` so later steps (artifact upload, PR comment) still run on failure.
4. Uploads the HTML report as an artifact (always, 7-day retention) and, on failure only, the `test-results/` folder containing failure screenshots/traces/videos (3-day retention).
5. Posts (or updates) a single PR comment summarizing pass/fail counts, a collapsible per-test table (failures first), and a link to download the report — see the `github-script` step in [`visual-tests.yaml`](../../.github/workflows/visual-tests.yaml) for the exact formatting logic.
6. Explicitly fails the job (`exit 1`) if tests failed — this happens _after_ the report/comment steps so those artifacts are always available even on failure.

To debug a CI failure: open the PR comment for the failed-test table, download the "playwright-report" artifact for full HTML diffs/traces, or the "test-results" artifact for raw failure screenshots.

## Troubleshooting

- **"Run Test" button greyed out in the library** — the visual test server isn't running; start it with `npm run test:visual:server` or `npm start`.
- **Tests time out waiting for `sidekick-library`/iframe** — confirm `aem up` is serving on `http://localhost:3000` and the block/variation path used in the spec still exists in the library.
- **Local pass, CI fail (or vice versa) on font/pixel differences** — make sure Docker is actually being used (`npm run test:visual`); it's the same container image CI uses, so a bare/non-Docker run is unsupported and not expected to match.
- **Figma download fails** — check `FIGMA_ACCESS_TOKEN` is set and the `figmaUrl` in `config.js` contains a `node-id` query param.
- **Docker not running** — `npm run test:visual*` and the pre-commit hook all require Docker to be installed and running; there is no local-CLI fallback.
