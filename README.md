# Experience League

Experience League site implementation on https://aem.live

## Environments

- Preview: https://main--exlm--adobe-experience-league.hlx.page/
- Live: https://main--exlm--adobe-experience-league.hlx.live/

## Getting started

> ensure you have nodejs 22. do this manually or install [nvm](https://github.com/nvm-sh/nvm) and run `nvm install` then `nvm use` on this directory and node 22 will be installed and used.

1. Clone or fork this repo (see note below on forking)
2. Create your brannch - (keep it < 18 chars to avoid domain length limits)
3. Install the [AEM CLI](https://github.com/adobe/aem-cli): `npm install -g @adobe/aem-cli`
4. Install dependencies `npm i`
5. Start Local Proxy: `npm run up` (opens your browser at `http://localhost:3000`)
6. Start coding!

### On forking this repo

If you want/need to fork this repository remember to add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the fork repository. Also please be sure to name the repo `exlm` for consistency.

### Content Source

The default content source is set in `fstab.yaml`, by default it's pointing to the main [exlm-converter](https://github.com/adobe-experience-league/exlm-converter) action.

The action is the entry point for all HTML delivered to https://aem.live services.

> while developing, and if you need to update the source HTML, you are free to deploy [exlm-converter](https://github.com/adobe-experience-league/exlm-converter) action to your own project on Adobe Runtime. (Remember to point your forked repon `fstab.yaml` to your own action).

## Helpful Commands

| Command           | Usage                                  |
| ----------------- | -------------------------------------- |
| `npm run up`      | Runs `aem up`                          |
| `npm run quality` | Code quality check: format and linting |
| `npm run format`  | Format code                            |
| `npm run lint`    | Run JS/CSS linters                     |

## Faceted-search block configuration

Blocks can call `createFacetedSearch` from `scripts/faceted-search/faceted-search.js` with a content type and optional
feature flags:

```js
await createFacetedSearch(block, {
  contentType: 'event',
  filters: true,
  sort: true,
  viewSwitcher: true,
  pagination: true,
});
```

All four flags default to `false`. Faceted search resolves labels, filter definitions, source settings, card behavior and
analytics internally by content type in `scripts/faceted-search/core/config.js`. `filters` controls the filter panel; source facets and URL
restoration remain available. Result counts remain enabled; keyword search is selected by the content preset. Without filters,
results use the full layout width. For playlists, omitting pagination or setting it to `false` renders all matching cards
at once; setting it to `true` enables 12-item pages. Events retain their configured source result limit without pagination.

The `event` preset uses Coveo. The `playlist` preset uses the localized playlists JSON index with English fallback, local
Product/Role/Experience Level filtering and 12-item pages. Cards use the shared browse-card renderer and
`browse-card playlist-card` styles, including the standard playlist badge, metadata, actions and click analytics.
Playlist keyword search is always enabled; filters, pagination, sorting and view switching use the block's feature flags. Keyword search
matches titles and descriptions and persists in the `q` query parameter. It now uses the
shared sidebar/mobile filter layout and pagination controls. Existing repeated `solution`, `role` and `level` query
parameters remain supported; `page` also supports shareable pagination and Back/Forward navigation.

The `perspective` preset (EXLM-6250) uses Coveo Headless with AQ scoped to Perspective, Product/Role/Author Type
filters, newest-first sort, and pagination — no list/grid switcher. Course presets land with EXLM-5958. Unsupported
content types throw an explicit error. The lower-level configuration API remains available for custom sources and
renderers.

Within faceted search, `components/cards.js` owns both card preparation/rendering and the result grid's loading, empty and
error states. It loads the browse-card painter and view switcher only when needed. `components/sort-control.js` contains
sorting controls, event sort rules and event grouping; `components/filters.js` contains filter UI and facet-value
presentation. Content-specific analytics callbacks are configured in `core/config.js`.

## Copilot PR review

[Copilot PR Review](.github/workflows/copilot-review.yaml) reviews non-draft PRs automatically, including fork PRs.
Findings appear as replyable inline threads in a formal advisory review authored by `github-actions[bot]`.
It uses trusted review skills, project guidance, and prior PR discussions; it does not execute PR code or run tests.

- **Setup:** Add the Actions secret `COPILOT_REVIEW_PAT`: a personal fine-grained PAT with **Copilot Requests:
  Read-only**, owned by a user with Copilot access. Merge workflow changes into the default branch to activate them.
- **Re-review:** Users with write, maintain, or admin access can post exactly `/copilot-review` as a new PR
  conversation comment; authorization completes before entering the review queue. Use **Reply** on inline findings;
  prior replies inform subsequent reviews. Disagreements
  appear in the review's **Discussion follow-up** section. Existing conversation comments are not converted.
- **Actions policy:** Before **November 2, 2026**, an administrator must configure **Settings > Actions > Policies**
  to explicitly allow `pull_request_target` for this workflow in affected public repositories.
  See [GitHub's policy notice](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target#default-policy-for-pull_request_target).
- **Limits:** Reviews consume the token owner's Copilot allowance. Large diffs or discussion context fail explicitly;
  findings are diff-only, not merge approvals, and semantic deduplication is not guaranteed. Exact current-revision
  Copilot findings are suppressed; unrelated threads and distinct findings on the same line are preserved.

## Local SignedIn Development

Use this only if you need sign-in to work locally for development purposes.

1. add this entry to `hosts` file (`/etc/hosts` on mac)
   `127.0.0.1 experienceleague-local.adobe.com`
   (you likely will need `sudo` to save this file)
2. run `npm run up-secure` (instead of `npm run up`)
   > you can use `npm run up-secure-prod` if you want to use production content.
3. Browser should automatically open at `https://experienceleague-local.adobe.com`
   > if asked to trust the certificate on the browser, do trust it. Might also need to allow runnig as admin (`sudo`)

> If you have a Windows machine, please add any learnings to this Doc. The current dev team uses MacOs.

## Visual Regression Testing (pixel-guard)

Every block/variation in the Sidekick Library gets screenshotted at multiple viewports and compared against a committed baseline to catch unintended visual changes. Tests run in Docker (via Playwright) so rendering is pixel-identical locally and in CI.

```sh
npm start                    # aem up + the visual test server, in one terminal
npm run test:visual:build    # one-time: build the Playwright Docker image
npm run test:visual          # run the suite
npm run test:visual:update   # accept current output as the new baselines
npm run test:visual:report   # open the last HTML report
```

New/changed blocks need specs regenerated first: `npm run test:visual:generate`, then `npm run test:visual:update` to commit baselines.

Full details (how it fits together, CI workflow, troubleshooting) are in [`tools/visual-tests/README.md`](tools/visual-tests/README.md).
