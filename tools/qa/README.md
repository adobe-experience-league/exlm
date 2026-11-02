# Advisory QA pilot

This is the deterministic testing/reporting foundation, **not an AI test generator**.
PR test execution uses no Jira or model credentials. A separate connectivity workflow
can verify Jira connectivity with a repository secret. Jira acceptance criteria
and GitHub Copilot test generation are not yet integrated.

## Verify the Jira connection

Configure these repository-level Actions settings:

| Setting          | Type     | Purpose                                                     |
| ---------------- | -------- | ----------------------------------------------------------- |
| `JIRA_PAT_PR_QA` | Secret   | Jira Server/Data Center PAT, sent as a Bearer token         |
| `JIRA_BASE_URL`  | Variable | HTTPS Jira base URL, including any application context path |

For temporary pre-merge testing, commit `.github/workflows/qa-jira-connection.yaml`
and `tools/qa/jira-connection.js` on `exlm-6172` and push that branch. Each push
triggers **QA Jira Connection** without merging to the default branch. The workflow
is restricted to this repository and the exact `exlm-6172` branch, checks out the
triggering commit, and uses no package installation. Only push code you trust:
the connection-check step receives the Jira secret. No pull-request trigger is used.
The manual trigger is retained, but its Actions button requires the workflow to be
registered on the default branch; the job still rejects every other branch.
After testing, remove the temporary push trigger and restore default-branch-only
execution and checkout before adopting the workflow for ongoing use.
It calls `GET /rest/api/2/myself` without following redirects, verifies an
authenticated JSON response, and prints only success/failure diagnostics.
Neither the token nor account details are logged or uploaded.

Check the run's summary for the result. A successful response proves connectivity
and PAT authentication, not access to a particular ticket or project. An HTTP
401/403 requires checking the PAT/account permissions; HTML or redirects can mean
SSO interception or an incorrect base URL. A timeout, DNS, or TLS failure requires
checking corporate network/proxy access and trusted certificates. A GitHub-hosted
runner may not reach corporate Jira; arrange an approved runner or gateway if
necessary. Do not disable TLS verification or expose corporate Jira to work around
network restrictions.

Recognized network failures include only allowlisted error codes, never raw
exception details: `ENOTFOUND`/`EAI_AGAIN` indicate DNS lookup failures,
`ETIMEDOUT`/`UND_ERR_CONNECT_TIMEOUT` indicate connection timeouts,
`ECONNREFUSED`/`ECONNRESET` indicate rejected/reset connections, and certificate
codes identify TLS verification failures. Unknown errors retain a generic message
to avoid leaking sensitive diagnostics. A request that fails before an HTTP
response does not establish whether the PAT is valid.

Actions secrets cannot be read back locally. The live connection is not verified
until this workflow actually succeeds. The existing PR test jobs never receive
the Jira secret. No GitHub PAT is needed for this connection check.

## PR behavior

`QA Pilot Tests` runs on non-draft, same-repository PRs and subsequent updates.
Fork PRs are excluded. Tests execute with read-only repository permissions and no
Jira, model, production, or PR-writing secrets. The separate `QA Pilot Report`
workflow runs trusted default-branch reporting code and treats test artifacts only
as untrusted JSON data.

Both workflows must reach the default branch before automatic reporting works.
Keep the pilot checks **out of required branch-protection checks** while advisory.
Test failures still produce a failed execution check; advisory does not mean
turning failures into green checks. A single PR comment is updated with results,
coverage gaps, the tested commit, and a link to seven-day evidence artifacts.
Results for outdated PR commits are not posted.

Changed blocks select their existing visual specs and any functional spec named
`tools/qa/tests/<block>.spec.js`. Shared scripts, global styles, assets, dependencies,
and QA tooling expand selection to all registered specs. Blocks without tests or
without functional coverage are explicitly reported. Documentation-only changes
may select no tests; that is not a coverage pass.

The existing full visual CI remains authoritative and unchanged. The pilot also
runs selected visual specs so its report is self-contained; this duplicates some
CI work during the pilot. Visual baselines are never updated automatically.

## Current functional coverage

`grid-cards` covers standard, minimal, and wide card rendering and keyboard link
navigation; heading normalization; hidden headers; missing/URL-labelled CTAs;
wide cards without links; and standard grid columns/overflow at 320, 600, 900,
and 1440 pixels. These are current-behavior checks, not Jira-approved acceptance tests.

Fixtures serve real repository modules and CSS through Playwright routing,
using synthetic content without an EDS server or credentials. External browser
requests are blocked and click analytics is stubbed. These checks do not cover
the converter, real page bootstrap, production analytics, authenticated journeys,
live APIs, or a full accessibility audit. Keyboard and accessible-name assertions
provide limited accessibility checks only.

The report distinguishes failed, flaky, skipped, empty, and missing executions.
It does not claim that every failure is a regression introduced by the PR:
base-versus-head execution and Jira-driven expectations are future work.

## Local validation

```sh
node --test tools/qa/*.test.js
npx playwright test --config=tools/qa/playwright.config.js
```

Functional tests use the installed Chromium browser and do not compare screenshots.
If Playwright reports that Chromium is missing, install it with
`npx playwright install chromium`.

To select and execute tests for two full commit SHAs:

```sh
node tools/qa/select-tests.js <base-sha> <head-sha>
node tools/qa/run-tests.js functional
```

For visual tests, use the existing Docker commands and local EDS server documented
in [the visual suite](../visual-tests/README.md), for example:

```sh
npm run test:visual:block -- tools/visual-tests/blocks/grid-cards/grid-cards.spec.js
```

Do not hand-edit generated visual specs or accept new baselines without review.
Add handwritten functional specs separately under `tests/`. To test new blocks,
provide representative library variations/page URLs and expected behavior.
