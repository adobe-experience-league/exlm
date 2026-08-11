# Auto-Test-Creator — Design Spec

Date: 2026-08-11
Status: Approved (pending implementation)

## Problem

QA currently tracks test cases for EXLM stories in a manual Excel workbook (one sheet per
feature/hub): columns TC ID, Scenario Summary, Pre-requisite/Test Data, Step, Expected, and a
per-browser/device "Actual" result column (Desktop Chrome/Firefox/Edge/Safari, Samsung Galaxy
S21-Chrome, iPhone 14-Safari, iPad-Safari). Writing this matrix by hand for every story is slow and
disconnected from JIRA.

We want a JIRA-to-JIRA automation, modeled on the existing `tools/auto-builder` poller, that:
watches for a label on a story, analyzes it, generates the same test-case matrix, files it as a
linked JIRA issue, and links it back — no Excel, no manual transcription.

## Non-goals (out of scope for v1)

- Populating the "Actual" result columns — that stays manual QA execution.
- Any Zephyr/Xray or other test-management-plugin integration — none exists in this JIRA
  instance today; the native `Test` issue type is used instead.
- Any JIRA project other than `EXLM`.
- Sharing a scheduler/process with `auto-builder` — this is a fully separate poller.

## Prior art this builds on

- **`tools/auto-builder/poller.mjs`** — the JIRA polling/label-lifecycle/PID-lock/per-assignee
  `credentials.json`/Teams-notify plumbing is proven and gets reused as a template. The
  git-worktree/GitHub-PR half is irrelevant here (no code changes, no repo writes) and is
  dropped entirely.
- **`.agents/skills/analyze-and-plan`** — already produces structured Acceptance Criteria, Edge
  Cases, and Responsive Behavior sections from ticket context; used standalone by `/auto-build`
  today. Reused here as the primary analysis step.
- **`.agents/skills/story-writer`** — already emits Gherkin scenarios for some tickets and
  already creates/links JIRA issues (`issueLink`, `POST /rest/api/2/issue`). Its own "Next
  Steps" footer anticipates a follow-on test-case-generation skill; this is that skill. When a
  ticket already has story-writer's Gherkin scenarios, they're folded in as additional scenario
  sources.

## Confirmed JIRA facts (checked live against the EXLM project)

- A native `Test` issue type exists in the `EXLM` project (id `19`) — no plugin workaround
  needed.
- An issue link type **"Has a Test Case"** exists, with semantics: outward = `has a test case`,
  inward = `is a test case for`. This is used instead of the generic `Relates` link story-writer
  uses, since it's the semantically correct direction (story _has_ a test case; the Test issue
  _is_ a test case for the story).
- The bulk `GET /rest/api/2/issue/createmeta` endpoint 404s on this instance (permission or
  version restriction) — required-field discovery for the `Test` issue type must happen
  empirically at creation time (handle 400s by surfacing JIRA's own "field X is required"
  message), the same way any other issue creation already has to.

## Architecture

Two new pieces, both under a new `tools/auto-test-creator/` directory — no changes to
`tools/auto-builder/`.

### 1. Headless skill — `.agents/skills/auto-test-create/SKILL.md`

Non-interactive, no approval gates — same headless pattern as `/auto-build`. Invoked as
`/auto-test-create <TICKET>`.

Steps:

1. **Input parsing** — same ticket-key validation as `/auto-build` Step 1.
2. **Auth check** — same `.env` check as `/auto-build` Step 2 (`JIRA_BASE_URL`, `JIRA_PAT`).
3. **Fetch ticket** — summary, description, acceptance criteria, components, labels (same
   fetch/parse pattern as `/auto-build` Step 3a). Also fetch existing Gherkin scenarios if the
   description already contains a story-writer-style "Gherkin Scenarios" section.
4. **Analyze** — invoke `/analyze-and-plan` with the ticket context to get structured edge
   cases, refined acceptance criteria, and responsive-behavior notes. This runs even when the
   ticket has thin/no AC (best-effort — matches how `/auto-build` treats AC as optional).
5. **Build the test-case matrix** — merge the analysis output + any existing Gherkin scenarios
   into rows of:
   - `TC ID` (sequential integer)
   - `Scenario Summary` (one line, imperative — "Verify X does Y")
   - `Pre-requisite/Test Data`
   - `Step` (numbered sub-steps within the cell)
   - `Expected`
   - One blank `Actual` column per target browser/device:
     Desktop Chrome, Desktop Firefox, Desktop Edge, Desktop Safari, Samsung Galaxy S21-Chrome,
     iPhone 14-Safari, iPad-Safari (fixed list, matching the existing QA Excel exactly — not
     user-configurable in v1).
     Always include at minimum: a happy-path case, one negative/edge case, and (when the ticket
     involves filters/search/results) a zero-results case — mirroring the pattern already visible
     in the QA Excel (e.g. TC 8 in the example: "Count reflects the result set including the
     zero-results case").
6. **Render as JIRA wiki markup** — the `description` field on this JIRA instance renders wiki
   markup, not Markdown (confirmed: story-writer already avoids Markdown table syntax for this
   reason). Table uses `||` header cells and `|` row cells.
7. **Create the linked Test issue** —
   `POST /rest/api/2/issue` with `project.key: "EXLM"`, `issuetype: { "name": "Test" }`,
   `summary: "Test Cases: <TICKET> — <original summary>"`, `description: <rendered table>`,
   `labels: ["auto-test-create"]`.
   On a 400 listing missing required fields: retry once, supplying reasonable defaults/adding
   the fields; if it still fails, treat as a hard failure (surfaces in the label/Teams flow
   below).
8. **Link back** — `POST /rest/api/2/issueLink` with
   `type: { "name": "Has a Test Case" }`, `outwardIssue: { "key": "<TICKET>" }`,
   `inwardIssue: { "key": "<new Test issue key>" }`.
9. **Comment on the original story** — short, plain-prose comment (same tone as the `/auto-build`
   JIRA comment fix — no emoji, no "auto-test" tooling references), linking the new Test issue.
10. **Handoff summary** — same terminal-output block style as `/auto-build` Step 12.

### 2. Poller — `tools/auto-test-creator/poller.mjs`

A fresh copy of the auto-builder pattern, trimmed to what this tool actually needs:

**Kept as-is (copied/adapted from auto-builder):**

- `.env`/`config.json` loading, `assigneeScope` (`me` default), `pollIntervalSeconds`.
- Per-assignee `tools/auto-test-creator/credentials.json` (gitignored) + committed
  `credentials.example.json`, mapping assignee email → `{ jiraPat, claudeToken }`. **No
  `githubToken` field** — this tool never touches GitHub. Same `resolveIdentity()` /
  `markFailed()` fallback-to-default-PAT-for-labeling logic as auto-builder, so a broken
  per-assignee PAT can't strand a ticket in an infinite retry loop.
- PID lock, JIRA-reachability (VPN) check, structured logging to the OS log dir.
- Label lifecycle: `auto-test` → `auto-testing` → `auto-test-complete` → `auto-test-failed`.
- Teams notification via the same `TEAMS_WEBHOOK_URL` (reusing the existing Teams Workflow;
  can be pointed at a different flow/channel later by using a distinct env var if desired —
  not needed for v1).

**Dropped entirely (not applicable — no code/repo writes happen):**

- Git worktree creation/provisioning, ticket branch prep, `node_modules`/`.claude`/`.agents`
  symlinking.
- GitHub PR lookup (`repoSlug`, `findPrForTicket`).
- `worktreePath` config.
  `claude` is invoked with `cwd: REPO_ROOT` directly (safe — this tool makes zero filesystem or
  git writes, only JIRA REST calls), so there is no isolation concern.

**Changed — completion detection:**
Auto-builder confirms success by checking whether a GitHub PR exists (external evidence, since a
headless run can exit early without finishing). This tool's equivalent check: after invoking
`claude`, re-fetch the original ticket's `issuelinks` and look for a `"Has a Test Case"` link. If
none exists yet, nudge with `claude --continue` (same prompt-and-retry shape as auto-builder),
up to the same `MAX_CONTINUATIONS`.

### Config files

`tools/auto-test-creator/config.json` (committed, no secrets):

```json
{ "assigneeScope": "me", "pollIntervalSeconds": 1800 }
```

`tools/auto-test-creator/credentials.example.json` (committed template):

```json
{
  "jane.doe@adobe.com": {
    "jiraPat": "<jane's JIRA personal access token>",
    "claudeToken": "<jane's CLAUDE_CODE_OAUTH_TOKEN>"
  }
}
```

`tools/auto-test-creator/credentials.json` — gitignored (add to `.gitignore` alongside the
existing `auto-builder` entry).

### Install/uninstall

Same three-OS scheduler pattern as `tools/auto-builder/install.sh` / `install.ps1` /
`uninstall.sh` / `uninstall.ps1`, copied and re-labeled (`com.exlm.auto-test-creator-poller` /
`exlm-auto-test-creator-poller`), reading `pollIntervalSeconds` from this tool's own
`config.json`. Installed and run independently of `auto-builder` — enabling/disabling/tuning one
never affects the other.

## Error handling

- Missing/unreadable ticket, JIRA auth failure, `/analyze-and-plan` failure, or Test-issue
  creation failure → the ticket gets `auto-test-failed` (via the same `markFailed` default-PAT
  fallback as auto-builder) and a Teams failure card (if configured), with a one-line reason.
- No PR-equivalent "draft" safety net exists here (there's no code to review before merge) —
  the safety boundary instead is that the created Test issue and the linking comment are both
  plainly visible on the original ticket, so a bad/low-quality auto-generated test case is easy
  for a human to spot and fix, same as a draft PR is easy to review before merging.

## Open questions / risks for the implementation plan to address

- Exact required-field set for creating a `Test` issue in this project is unknown until first
  attempted (createmeta is inaccessible) — the implementation should handle and report JIRA's
  400 field-validation errors clearly rather than assuming a fixed field list.
- Wiki-markup table rendering for long cell content (multi-step `Step` cells) needs a real test
  against this JIRA instance to confirm it renders as expected (numbered sub-steps inside a
  table cell, `\\` line breaks in JIRA wiki markup).
