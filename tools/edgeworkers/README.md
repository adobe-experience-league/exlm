# Edge-assembled header spike

This prototype puts published header links in the initial HTTP response for **all visitors**, before JavaScript executes. It is not a full server-rendering implementation or an Akamai runtime emulator. Crawlers still decide what to fetch and index.

## Local simulation

Requires Node 22+, npm 10+, and the repository dependencies.

```sh
npm ci
npm run simulate:edge-header
curl -i http://127.0.0.1:3001/en/docs
```

By default, the server uses small offline fixtures modeled on the published `header-v2.plain.html` fragment. Inspect the response source for navigation links. JavaScript-disabled visual rendering remains a follow-up because the current global stylesheet hides the body until client initialization. The fixture deliberately does not load the complete Experience League application.

To exercise the real site, first start the existing EDS dev server in another terminal, then proxy it:

```sh
npm run up
# In a second terminal:
UPSTREAM=http://127.0.0.1:3000 npm run simulate:edge-header
```

Open the **simulator** URL on port 3001, not port 3000. Use paths such as `/en/docs` and `/fr/docs`. The simulator only binds to loopback. `UPSTREAM` is an operator-controlled origin; inbound paths cannot select another host. It proxies upstream responses but uses the local stylesheet and handoff helper. Run the EDS server from this checkout so upstream header modules also contain the handoff changes.

Options:

| Environment variable  | Default     | Purpose                                                                   |
| --------------------- | ----------- | ------------------------------------------------------------------------- |
| `PORT`                | `3001`      | Local listener                                                            |
| `UPSTREAM`            | unset       | EDS dev server origin; unset uses fixtures                                |
| `HEADER_VARIANT`      | `header-v2` | `header` or `header-v2`; match the existing client feature-flag selection |
| `EDGE_HEADER_ENABLED` | `1`         | Set to `0` to bypass assembly                                             |

Use your browser's Network panel to confirm that successful, matching-variant enhancement does **not** make a browser header-fragment request. Search, placeholders, profile, and other existing client requests still occur. With a variant or locale mismatch, the client retains its existing fetch behavior.

## Response and client contract

1. The EdgeWorker fetches the page using a same-host subrequest, preserving page cookies/authentication and the query string. Conditional and range headers are removed to obtain a complete representation.
2. For successful HTML GET responses, it fetches `/{lang}/global-fragments/{variant}.plain.html` **without visitor cookies or credentials**, falling back to English on failure. Only trusted, published fragments from this site are supported; this is not an untrusted HTML sanitizer.
3. Akamai's `HtmlRewritingStream` prepends a light-DOM `<nav data-exl-edge-nav>` to `body > header`. The header carries a duplicate-injection marker. Authoring `@...` href controls become non-link data attributes in the static response and are restored on a detached clone for client decoration.
4. Both existing header variants reuse a matching injected fragment. The static navigation is removed only after the interactive nav and styles successfully initialize. A decoration/CSS failure retains it in the DOM. No injected fragment means the existing fetch/decorate path.
5. This spike currently ensures source-HTML inclusion, not JavaScript-disabled visual rendering. The global stylesheet still hides the body until client initialization. Making the fallback visibly usable without JavaScript, addressing its expanded-menu layout, and measuring layout shift remain follow-up work.

The locale parser follows EDS and `/content/exl/global/{lang}/...` paths, including the existing `pt-BR`, `zh-CN`, and `zh-TW` aliases. English fallback links remain English until the existing decorators process them.

Fragment errors log explicitly and return the original page so the browser can use its existing client fetch path. Page subrequest failure returns 502. HEAD, non-HTML, non-200, fragment requests, and disabled assembly bypass rewriting. Non-read methods are rejected defensively; Property Manager must exclude them.

The assembled response is `private, no-store`. Stale body length, compression headers, validators, range headers, and intermediary cache controls are stripped; page security headers and cookies are retained. Fragment response cookies are never propagated. Akamai may cache page/fragment subrequests according to their property rules, but this prototype deliberately avoids caching the composed response or personalized output.

`X-ExL-Edge-Header` reports `assembled`, `bypass`, `fragment-unavailable`, or `invalid-config`. `assembled` means rewriting was selected, not that a page necessarily contained a matching header. A page without `body > header` stays structurally unchanged.

## Akamai setup

Before deploying, create an EdgeWorker ID with a resource tier supporting `responseProvider`, HTTP subrequests, and `html-rewriter`. On a **staging property**:

- Add the EdgeWorkers behavior referencing that ID, restricted to the intended Experience League hostname, HTML page paths, and GET/HEAD methods.
- Exclude assets, APIs, fragment paths, and any paths outside this spike. Do not enable SubWorkers on the page/fragment subrequest routes. Standard `httpRequest` subrequests do not invoke non-SubWorker EdgeWorkers.
- Configure `PMUSER_EXL_EDGE_HEADER` as a user-defined variable with string value `1` to enable injection. Default/off is anything else.
- Configure `PMUSER_EXL_HEADER_VARIANT` as `header-v2` or `header`, matching the browser's existing `isHeaderV2`/allowed-domain selection. This worker does not evaluate browser feature flags. Test both separately; mixed cohorts are not a production-ready use case.
- Ensure same-host page and fragment subrequests are served by Akamai and route to the correct origin. Arbitrary external preview hosts cannot be assumed to support EdgeWorkers subrequests.
- Configure public fragment caching and English fallback availability. Do not cache authenticated page responses publicly.
- Enable JavaScript logging for `responseProvider`, including Akamai's required multi-part response-header setup. Check request time, CPU/memory, fragment size, CSP, cache behavior, and compression on staging.

Property activation and EdgeWorker activation are separate operations. The workflow below does **not** modify Property Manager, DNS, permissions, or traffic routing.

## Bundle

```sh
npm run package:edge-header -- 0.1.0-local
tar -tzf tools/edgeworkers/dist/header.tgz
```

The bundle contains only `main.js`, `assembly.js`, and `bundle.json`. Node tooling, SDKs, dependencies, fixtures, and credentials are excluded. The whole tooling directory is excluded from EDS delivery.

The local adapter uses parse5 and **buffers** HTML; it does not prove Akamai streaming/chunk behavior, platform limits, edge cache behavior, or full application interactivity. Validate the real v1/v2 header, mobile menus, search, sign-in, and embedded community/legacy integrations before promotion.

## GitHub Actions

[The workflow](../../.github/workflows/edge-header.yaml) lints, checks formatting, and packages relevant PRs. Manual **Run workflow** runs the same checks and publishes an artifact; select `deploy_staging` to upload that exact artifact and activate it on **STAGING only**, waiting for activation completion.

GitHub requires the workflow to exist on the default branch for manual dispatch. Once available there, select the approved deployment ref and ensure the environment's branch restrictions permit it.

Create a GitHub environment named `akamai-staging`, restrict deployment branches, and configure required reviewers. Add these environment secrets:

- `AKAMAI_CLIENT_TOKEN`
- `AKAMAI_CLIENT_SECRET`
- `AKAMAI_ACCESS_TOKEN`
- `AKAMAI_HOST` (API hostname, without scheme)

Set environment variable `AKAMAI_EDGEWORKER_ID` to the pre-created numeric ID. Use a least-privilege EdgeWorkers API client. The official `akamai-edgegrid` SDK signs API requests. Credentials are never written into the bundle or a local credentials file.

The workflow does not enable production deployment. Successful linting and packaging do not establish that your account, ID, property, or credentials are configured correctly.

## Staging checks and rollback

1. Use Akamai staging routing for the configured hostname and fetch an HTML page using `curl`. Check the status, `X-ExL-Edge-Header`, absence of stale length/validators, and actual `<header>` anchors in the response. Existing robots directives are preserved: EDS preview hosts commonly send `X-Robots-Tag: noindex, nofollow`; use the intended crawlable production configuration when evaluating indexing, not a preview's indexing policy.
2. Repeat for a localized page, an unavailable localized fragment, a fragment failure, a redirect, and a non-HTML URL.
3. Disable browser JavaScript and inspect the visible navigation. Re-enable it, verify no duplicate header or browser fragment refetch, and test keyboard/mobile navigation, search, locale selection, and signed-in behavior.
4. Check Akamai logs, subrequest cache hits, response limits, timing, and layout shift. A fragment fetch adds latency on a cache miss; this spike does not claim a performance improvement.
5. To roll back, set `PMUSER_EXL_EDGE_HEADER` to `0` and activate the property, or remove the EdgeWorkers behavior entirely. Disabling injection still uses the worker's page proxy/no-store policy; removing the behavior restores the original delivery path. Reactivate a known-good EdgeWorker version if needed.

References: [Akamai HTML rewriter](https://techdocs.akamai.com/edgeworkers/docs/htmlrewriter), [HTTP subrequests](https://techdocs.akamai.com/edgeworkers/docs/http-request), [version upload](https://techdocs.akamai.com/edgeworkers/reference/post-versions), [activation](https://techdocs.akamai.com/edgeworkers/reference/post-activations).
