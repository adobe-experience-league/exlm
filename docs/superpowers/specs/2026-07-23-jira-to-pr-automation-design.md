# Jira → PR Automation — Design

> Status: Approved design · 2026-07-23
> Scope: A GitHub workflow, triggered by an HTTP POST, that turns a JIRA story
> into a draft PR using a new headless `auto-build` skill, and reports back to
> JIRA with a summary, open questions, the PR link, and a preview URL.

## 1. Goal

Automate the path from a JIRA story to a reviewable pull request:

1. An external caller (JIRA automation rule **or** a manual/ad-hoc script) sends a
   POST to GitHub.
2. A GitHub workflow runs Claude Code headlessly against the ticket.
3. Claude runs a new `auto-build` skill that fetches the ticket, plans, implements
   best-effort, reviews, and opens a **draft** PR.
4. The automation flags any blockers/open questions and comments back to JIRA with a
   summary, the open questions, the PR link, and a preview URL.

The existing interactive `build` skill is **not** modified — it keeps its
`AskUserQuestion` approval gates and local `.env` flow for interactive local use. A
separate headless skill avoids branching complexity inside `build`.

## 2. Architecture & trigger flow

```
JIRA Automation "Send web request"  ─┐
                                      ├─► POST repos/.../dispatches ─► GitHub
Manual curl / internal script       ─┘   { event_type: "jira-build",
                                             client_payload: { ticket: "EXLM-1234" } }
                                                        │
                                                        ▼
                              .github/workflows/jira-to-pr.yaml
                              (on: repository_dispatch + workflow_dispatch)
                                                        │
                              checkout → npx skills install → claude-code-action@v1
                                                        │
                                          Claude runs  /auto-build EXLM-1234
                                                        │
                        ┌───────────────────────────────┴───────────────────────────┐
                        ▼                                                             ▼
              always: DRAFT PR (branch, best-effort code)              JIRA comment: what was
              with "Open Questions / Gaps" section                     done + open questions +
                                                                       PR link + preview URL
```

Design decisions:

- **`repository_dispatch`** serves both trigger sources (JIRA automation POST and
  manual/script POST) via one endpoint and one payload shape.
- **`workflow_dispatch`** is added as a convenience so the workflow can also be run
  from the GitHub Actions UI with a `ticket` input.
- The workflow is guarded with `if: github.repository == 'adobe-experience-league/exlm'`,
  matching the existing `claude.yaml`.
- Every run produces a **draft** PR. Human review happens on the PR, not mid-run —
  this is how the automation stays non-interactive.

## 3. Components

### 3.1 GitHub workflow — `.github/workflows/jira-to-pr.yaml`

Mirrors the patterns in the existing `.github/workflows/claude.yaml`.

- **Triggers:**
  - `repository_dispatch` with `types: [jira-build]`
  - `workflow_dispatch` with an input `ticket` (string, required)
- **Ticket resolution:** read from `github.event.client_payload.ticket` (dispatch) or
  `github.event.inputs.ticket` (manual). Validate against `^[A-Z]+-[0-9]+$`; if it
  does not match, fail the job early with a clear message.
- **Guard:** `if: github.repository == 'adobe-experience-league/exlm'`
- **Permissions:** `contents: write`, `pull-requests: write`, `id-token: write`
- **Steps:**
  1. `actions/checkout@v4` with `fetch-depth: 0`
  2. `npx skills experimental_install --yes` (restores remote Adobe skills; the local
     `auto-build` skill is already present in the checkout)
  3. `anthropics/claude-code-action@v1` with:
     - `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`
     - `prompt: /auto-build <resolved-ticket>`
     - `claude_args` including `--max-turns` and an `--allowedTools` allowlist that
       covers `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, and the skill chain
       (`analyze-and-plan`, `block-inventory`, `block-collection-and-party`,
       `content-driven-development`, `code-review`)
     - `env:` block exporting the secrets the skill's bash needs:
       - `JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}`
       - `JIRA_PAT: ${{ secrets.JIRA_PAT }}`
       - `GITHUB_TOKEN: ${{ secrets.UPDATE_PR_GITHUB_TOKEN }}`

Using `UPDATE_PR_GITHUB_TOKEN` (a PAT) rather than the built-in `GITHUB_TOKEN` means
the auto-created draft PR **will** trigger the existing "Claude PR Review" workflow.

### 3.2 New skill — `.agents/skills/auto-build/SKILL.md`

`.agents/skills/` is the source of truth; the installer regenerates the mirror
directories, and `.claude/skills/auto-build` becomes a symlink to it (matching how
`build` is already set up). `auto-build` is a headless fork of `build`.

Differences from `build`:

| Concern         | `build` (interactive)                         | `auto-build` (headless)                                                                                                          |
| --------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Args            | `/build EXLM-123` from user                   | Ticket key passed in the prompt from `client_payload.ticket` / workflow input                                                    |
| Auth            | Reads local `.env`                            | Reads **env vars** injected from GitHub secrets (`JIRA_BASE_URL`, `JIRA_PAT`, `GITHUB_TOKEN`); no `.env`, no `.gitignore` checks |
| Plan approval   | `AskUserQuestion` gate (Approve/Refine/Abort) | **No gate** — writes plan, proceeds automatically                                                                                |
| Branch conflict | `AskUserQuestion`                             | Fresh CI checkout → always branch from `main`, no prompt                                                                         |
| Blockers        | n/a                                           | Captures open questions/gaps, implements what it can (best-effort), records gaps                                                 |
| PR              | Normal PR                                     | **Draft PR** (`"draft": true`) always, with an "Open Questions / Gaps" section                                                   |
| JIRA comment    | `PR: <url>` one-liner                         | Rich comment: what was done, files changed, open questions/blockers, PR link, preview URL                                        |

Step sequence:

1. **Parse ticket** — from the prompt argument; validate `^[A-Z]+-[0-9]+$`.
2. **Auth check (env vars)** — verify `JIRA_BASE_URL`, `JIRA_PAT`, `GITHUB_TOKEN` are
   present in the environment. If any is missing, stop with a clear log message.
3. **Fetch JIRA** — ticket fields + comments + mentioned tickets/PRs, reusing
   `build`'s exact curl/node parsing patterns and its error table (401/403/404/empty).
4. **Existence check (conditional)** — only for new-block tickets: run
   `/block-inventory` and `/block-collection-and-party`. Otherwise skip.
5. **Plan** — run `/analyze-and-plan`; write `plans/<ticket>-plan.md`. **Capture the
   "Open Questions" section as `GAPS`.**
6. **Branch** — always `git checkout -b <ticket-lowercase>` from `main` (fresh CI
   checkout, no conflict prompt).
7. **Implement (best-effort)** — run `/content-driven-development` using the plan.
   Record anything it could not complete (missing deps, ambiguous AC, undecidable
   design choices) and append to `GAPS`.
8. **Code review** — run `/code-review`; apply fixes.
9. **Commit** — stage only planned files (never `git add -A`), commit with a
   type-prefixed message, reusing `build`'s commit error handling.
10. **Push + draft PR** — push the branch using the token URL pattern from `build`;
    create the PR via GitHub REST API with `"draft": true` and the draft PR body
    (see §4). Reuse `build`'s PR error table (401 / 422-already-exists / non-zero).
11. **JIRA comment** — post the rich comment (see §4), including the preview URL.
    On failure: warn and continue.
12. **Log summary** — print a handoff summary to the workflow log.

## 4. Blocker / gap handling & artifacts

Strategy: **always attempt implementation; blockers become flags, not exits.** Gaps
come from the `/analyze-and-plan` "Open Questions" section plus anything
`content-driven-development` could not complete. Implementation still runs on
everything that is decidable.

### 4.1 Draft PR body (always draft)

```markdown
Jira ID: EXLM-1234
🤖 Auto-generated draft from Jira. Review before marking ready.

## What was implemented

<summary of what CDD built>

## ⚠️ Open Questions / Gaps

- <blocker/question 1>
- <blocker/question 2>
  (or: "None — fully implemented, pending review")

<PR template test URLs>
```

If a `.github/pull_request_template.md` exists, fill its `Jira ID:` field and preserve
its placeholders, matching `build`'s behavior; otherwise use the fallback body above.

### 4.2 JIRA comment (always posted)

```
🤖 Auto-build ran for EXLM-1234.

✅ What was done:
<2–3 line summary + files changed>

⚠️ Open questions / blockers:
- <question 1>   (or "None")

🔗 Draft PR: <url>  (review before merging)
👀 Preview:  https://<branch>--exlm--adobe-experience-league.aem.live
```

### 4.3 Preview URL (composed programmatically)

Format: `https://<BRANCH_NAME>--<repo>--<owner>.aem.live`

The skill already derives `BRANCH_NAME` and parses owner/repo (`ORG_REPO`) from the
git remote, so no new inputs are required. The `.aem.live` host matches the existing
`update-pr-description.yaml` convention. For `EXLM-1234` this resolves to
`https://exlm-1234--exlm--adobe-experience-league.aem.live`.

### 4.4 Edge case — nothing implementable

If every part is blocked, still push the branch, open an **empty draft PR** that
describes the blockers, and post the JIRA comment. Never fail silently.

## 5. Secrets

Configured in GitHub → repo Settings → Secrets and variables → Actions.

| Secret                    | Purpose                                                       | Status         |
| ------------------------- | ------------------------------------------------------------- | -------------- |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude auth for `claude-code-action`                          | already exists |
| `UPDATE_PR_GITHUB_TOKEN`  | push branch + open draft PR (PAT → triggers Claude PR review) | already exists |
| `JIRA_BASE_URL`           | e.g. `https://jira.corp.adobe.com`                            | **add**        |
| `JIRA_PAT`                | JIRA personal access token (read ticket, post comments)       | **add**        |

## 6. POST contract

Used identically by the JIRA automation web-request action and any manual/ad-hoc
script:

```
POST https://api.github.com/repos/adobe-experience-league/exlm/dispatches
Authorization: Bearer <GitHub PAT with repo scope>
Accept: application/vnd.github+json

{ "event_type": "jira-build", "client_payload": { "ticket": "EXLM-1234" } }
```

The GitHub PAT used by the caller must have `repo` scope (or fine-grained
"Contents: read & write" + metadata) on the `adobe-experience-league/exlm` repo. This
is the caller's token, distinct from the workflow's `UPDATE_PR_GITHUB_TOKEN`.

## 7. Out of scope

- Changes to the interactive `build` skill.
- JIRA status transitions (e.g., moving the ticket to "In Review"). The automation
  only comments; it does not transition workflow states.
- A two-phase "approve then implement" flow. Approval happens on the draft PR.
- Auto-merging or marking the PR ready-for-review.

## 8. Files touched

| File                                 | Change                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `.github/workflows/jira-to-pr.yaml`  | new — the trigger workflow                                                       |
| `.agents/skills/auto-build/SKILL.md` | new — headless orchestrator skill                                                |
| `.claude/skills/auto-build`          | new symlink → `../../.agents/skills/auto-build` (created by installer/mirroring) |
