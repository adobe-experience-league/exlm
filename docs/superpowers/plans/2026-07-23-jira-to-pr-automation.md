# Jira → PR Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `repository_dispatch`-triggered GitHub workflow that runs a new headless `auto-build` skill to turn a JIRA story into a draft PR, flag blockers, and comment back to JIRA with a summary, open questions, PR link, and preview URL.

**Architecture:** A GitHub Actions workflow (`.github/workflows/jira-to-pr.yaml`) is triggered by an HTTP POST (`repository_dispatch`) or manually (`workflow_dispatch`). It checks out the repo, restores remote skills, and runs `anthropics/claude-code-action@v1` with the prompt `/auto-build <ticket>`. The `auto-build` skill is a headless fork of the existing interactive `build` skill: it reads credentials from environment variables (populated by GitHub secrets), skips all `AskUserQuestion` gates, implements best-effort, and always opens a **draft** PR while flagging gaps to JIRA.

**Tech Stack:** GitHub Actions, `anthropics/claude-code-action@v1`, `npx skills`, bash + `curl` + `node` (JIRA REST API v2, GitHub REST API), Markdown skill files.

## Global Constraints

- Repo guard: every workflow job runs only when `github.repository == 'adobe-experience-league/exlm'` (verbatim, matches `.github/workflows/claude.yaml`).
- Ticket key format: `^[A-Z]+-[0-9]+$` (e.g. `EXLM-1234`).
- The interactive `build` skill (`.agents/skills/build/SKILL.md`) MUST NOT be modified.
- Source of truth for skills is `.agents/skills/`; `.claude/skills/<name>` is a symlink to `../../.agents/skills/<name>` (matches existing `build`).
- Credentials in CI come from **environment variables**, never a local `.env`: `JIRA_BASE_URL`, `JIRA_PAT`, `GITHUB_TOKEN`.
- The workflow maps `GITHUB_TOKEN` env → `secrets.UPDATE_PR_GITHUB_TOKEN` (a PAT, so the draft PR triggers the existing Claude PR Review workflow).
- Every run produces a **draft** PR (`"draft": true`) — never a ready-for-review PR.
- Preview URL format: `https://<BRANCH_NAME>--<repo>--<owner>.aem.live` where `BRANCH_NAME` is the lowercased ticket and owner/repo come from the git remote.
- Never stage with `git add -A` / `git add .` — stage only planned files.

---

### Task 1: Create the `auto-build` skill

**Files:**

- Create: `.agents/skills/auto-build/SKILL.md`

**Interfaces:**

- Consumes: environment variables `JIRA_BASE_URL`, `JIRA_PAT`, `GITHUB_TOKEN`; a ticket key argument passed via the prompt (`/auto-build EXLM-1234`).
- Produces: a git branch `<ticket-lowercased>`, a commit, a **draft** GitHub PR, and a JIRA comment. Invoked by the workflow in Task 3 via the `/auto-build <ticket>` prompt.

- [ ] **Step 1: Create the skill file with full content**

Create `.agents/skills/auto-build/SKILL.md` with exactly this content:

````markdown
---
name: auto-build
description: >
  Headless CI variant of the build orchestrator for the EXLM repo. Triggered by
  a GitHub workflow (repository_dispatch) with a JIRA ticket key. Fetches the
  ticket, runs the Adobe EDS skill chain non-interactively (no approval gates),
  implements best-effort, opens a DRAFT PR, flags any blockers/open questions,
  and comments back to JIRA with a summary, PR link, and preview URL. Reads
  credentials from environment variables, not .env. Invoked as /auto-build <TICKET>.
---

# Auto-Build — ExL Headless EDS Orchestrator (CI)

Non-interactive orchestrator for CI: fetch JIRA ticket → analyze-and-plan (no
approval gate) → implement best-effort → code review → commit → DRAFT PR → rich
JIRA comment. This is the headless sibling of `build`; it never calls
`AskUserQuestion` and reads credentials from environment variables.

**Roles:** Adobe EDS Senior Developer

> **Ground rule:** Never perform your own file search, grep, Agent, or codebase
> exploration. All discovery is delegated — existence checking to `/block-inventory`
> and `/block-collection-and-party`, implementation to `/content-driven-development`.
> Never call `AskUserQuestion`; there is no human in the loop. Follow the steps in
> order and delegate.

---

## Step 1 — Input Parsing

Parse the argument provided alongside `/auto-build`. Expected: a JIRA ticket key
matching `[A-Z]+-[0-9]+` (e.g. `EXLM-123`). Store as `SESSION_TICKET`.

**No argument** — print and stop:

```
Usage: /auto-build <JIRA-TICKET>
Example: /auto-build EXLM-123
```

**Argument does not match `[A-Z]+-[0-9]+`** — print and stop:

```
"<arg>" does not look like a JIRA ticket key.
Expected format: PROJECT-NUMBER (e.g. EXLM-123)
```

---

## Step 2 — Auth Check (environment variables)

Credentials come from the CI environment (injected from GitHub secrets), NOT a
`.env` file.

```bash
[ -n "$JIRA_BASE_URL" ] \
  && [ -n "$JIRA_PAT" ] \
  && [ -n "$GITHUB_TOKEN" ] \
  && echo "ok" || echo "missing"
```

**If missing** — identify which variables are absent and stop:

```
Auth setup required — the workflow must export these environment variables
(from GitHub secrets):
  JIRA_BASE_URL   (e.g. https://jira.corp.adobe.com)
  JIRA_PAT        (secrets.JIRA_PAT)
  GITHUB_TOKEN    (secrets.UPDATE_PR_GITHUB_TOKEN)
Missing: <list>
```

**All present** — print: `Auth OK — JIRA and GitHub credentials loaded from environment.`

---

## Step 3 — Fetch JIRA Ticket

### 3a. Fetch and parse ticket

```bash
curl -s \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/2/issue/$SESSION_TICKET?fields=summary,description,customfield_10008,components,labels,issuetype,priority,status" | node -e "
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  const d = JSON.parse(Buffer.concat(chunks).toString());
  const f = d.fields || {};
  function adfToText(node) {
    if (!node || typeof node === 'string') return node || '';
    if (node.type === 'text') return node.text || '';
    return (node.content || []).map(adfToText).join('\n');
  }
  const desc = typeof f.description === 'object' && f.description !== null
    ? adfToText(f.description)
    : (f.description || '');
  console.log(JSON.stringify({
    summary:     f.summary || '',
    description: desc,
    components:  (f.components || []).map(c => c.name).join(', '),
    labels:      (f.labels || []).join(', '),
    type:        (f.issuetype || {}).name || '',
    priority:    (f.priority || {}).name || '',
    epic:        f.customfield_10008 || 'None',
    status:      (f.status || {}).name || '',
  }));
});
"
```

Store as: `TICKET_SUMMARY`, `TICKET_DESCRIPTION`, `TICKET_COMPONENTS`, `TICKET_LABELS`,
`TICKET_TYPE`, `TICKET_PRIORITY`, `TICKET_EPIC`.

Extract acceptance criteria from `TICKET_DESCRIPTION`: look for sections headed
"Acceptance Criteria" or "AC", lines beginning with `Scenario:` / `Given` / numbered
checklist items. Store as `TICKET_AC`.

Print:

```
Fetched <SESSION_TICKET>: <TICKET_SUMMARY>
Type: <TICKET_TYPE> | Priority: <TICKET_PRIORITY> | Components: <TICKET_COMPONENTS>
```

### 3b. Error handling

| HTTP / exit         | Action                                                     |
| ------------------- | ---------------------------------------------------------- |
| curl exits non-zero | Print raw error. Note it may be a network/VPN issue. Stop. |
| 401                 | "PAT invalid or expired." Stop.                            |
| 403                 | "No access to `SESSION_TICKET`." Stop.                     |
| 404                 | "`SESSION_TICKET` not found." Stop.                        |
| 200, empty summary  | "Ticket may be restricted or deleted." Stop.               |

### 3c. Fetch comments and extract mentioned tickets & PRs

```bash
curl -s \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/2/issue/$SESSION_TICKET/comment?maxResults=50" | node -e "
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  const d = JSON.parse(Buffer.concat(chunks).toString());
  const comments = (d.comments || []).map(c => {
    const body = typeof c.body === 'object' && c.body !== null
      ? JSON.stringify(c.body)
      : (c.body || '');
    return { author: (c.author || {}).displayName || 'Unknown', body };
  });
  console.log(JSON.stringify(comments));
});
"
```

Store as `TICKET_COMMENTS`. Scan description and all comment bodies for `[A-Z]+-[0-9]+`
keys and GitHub PR URLs. Store unique results as `MENTIONED_JIRA_KEYS` (max 5) and
`MENTIONED_GH_PRS` (max 5).

### 3d. Fetch mentioned JIRA tickets and GitHub PRs

For each key in `MENTIONED_JIRA_KEYS` — fetch summary, description, status (same curl
pattern as 3a, truncate description to 2000 chars). On 401/403/404: warn and skip. Do
not scan fetched tickets for further mentions.

For each URL in `MENTIONED_GH_PRS` — fetch title, body, state via GitHub REST API. On
failure: warn and skip.

Collect all into `MENTIONED_CONTEXT`. Print one summary line per resolved reference.

---

## Step 4 — Existence Check (Conditional)

Only run this step if the ticket involves **creating a new block**. Scan
`TICKET_SUMMARY`, `TICKET_DESCRIPTION`, and `TICKET_LABELS` for new-block signals
("create block", "new block", "build block", "add block", "implement block"; ticket
type Story or Feature with no existing block name referenced).

**If creating a new block** — run both discovery skills:

```
/block-inventory
```

Store findings as `INVENTORY_CONTEXT`.

```
/block-collection-and-party
```

Store findings as `COLLECTION_CONTEXT`.

Print:

```
Existence check complete.
  Repo blocks : <N similar blocks found>
  OOTB blocks : <N reference implementations found>
```

**If not creating a new block** — skip both. Set `INVENTORY_CONTEXT` and
`COLLECTION_CONTEXT` to `N/A`. Print: `Existence check skipped — not a new block.`

---

## Step 5 — Plan (no approval gate)

### 5a. Analyze and plan — `/analyze-and-plan`

Call `/analyze-and-plan` with the full ticket context: `TICKET_SUMMARY`,
`TICKET_DESCRIPTION`, `TICKET_AC`, `MENTIONED_CONTEXT`, `INVENTORY_CONTEXT`,
`COLLECTION_CONTEXT`.

```
/analyze-and-plan
```

This produces refined acceptance criteria, edge cases, definition of done, a proposed
changeset, and key open questions. Store the output as `CURRENT_PLAN`.

**Capture the "Open Questions" section verbatim as `GAPS`** (a list). If there are no
open questions, `GAPS` is empty.

**Write `plans/<SESSION_TICKET>-plan.md` immediately:**

```bash
[ -d plans ] || mkdir -p plans
grep -q "^plans/" .gitignore 2>/dev/null || echo "plans/" >> .gitignore
```

```markdown
# Plan: <SESSION_TICKET> — <TICKET_SUMMARY>

> Auto-generated (headless) · <ISO timestamp>
> Ticket: <JIRA_BASE_URL>/browse/<SESSION_TICKET>
> Type: <TICKET_TYPE> | Priority: <TICKET_PRIORITY> | Epic: <TICKET_EPIC>

## Refined Acceptance Criteria

<from analyze-and-plan>

## Edge Cases

<from analyze-and-plan>

## Definition of Done

<from analyze-and-plan>

## Proposed Changeset

| File | Change Type | Description |
| ---- | ----------- | ----------- |

<from analyze-and-plan>

## Open Questions

<GAPS, or "None">
```

Print: `Plan written to plans/<SESSION_TICKET>-plan.md`

### 5b. No approval gate

Do NOT call `AskUserQuestion`. Proceed directly to Step 6 with `CURRENT_PLAN` as the
plan of record.

---

## Step 6 — Create Feature Branch

Derive branch name from `SESSION_TICKET`, lowercased (e.g. `EXLM-1233` → `exlm-1233`).
Store as `BRANCH_NAME`.

The CI checkout starts on `main`. Create the branch:

```bash
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
```

Print: `Branch ready: <BRANCH_NAME>`

---

## Step 7 — Implement (best-effort)

Invoke `/content-driven-development` passing the full ticket context plus the plan:
`TICKET_SUMMARY`, `TICKET_DESCRIPTION`, `TICKET_AC`, `MENTIONED_CONTEXT`,
`INVENTORY_CONTEXT`, `COLLECTION_CONTEXT`, `CURRENT_PLAN`, and the contents of
`plans/<SESSION_TICKET>-plan.md`.

Instruct CDD to use the plan and skip its internal `analyze-and-plan` step, proceeding
from `content-modeling`.

```
/content-driven-development
```

CDD orchestrates `/content-modeling`, `/building-blocks`, `/testing-blocks`. Track
progress with `TodoWrite`.

**Record any part CDD could not complete** (missing dependency, ambiguous AC,
undecidable design choice) and append each to `GAPS`. Implement everything that IS
decidable — never hard-stop on a blocker.

---

## Step 8 — Code Review

```
/code-review
```

Apply any fixes surfaced by the review. Re-run lint on touched files if the review
modifies JS or CSS.

---

## Step 9 — Commit

### 9a. Stage planned files only

```bash
git add <file1> <file2> ...
```

Stage only files that appear in the Changeset. Never use `git add -A` or `git add .`.

### 9b. Create commit

Prefix by ticket type: `feat` (story/feature), `fix` (bug), `refactor`, `chore`.

```bash
git commit -m "$(cat <<'EOF'
<prefix>(<SESSION_TICKET>): <TICKET_SUMMARY>

<2–3 sentences summarising what CDD built and why>

Resolves: <SESSION_TICKET>
EOF
)"
```

### 9c. Commit error handling

| Situation             | Action                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pre-commit hook fails | Print output. Run `npm run lint:fix` if available. Re-stage. New commit — never amend.                                                                                                                                   |
| Hook fix fails        | Record as a gap; continue to open the draft PR anyway.                                                                                                                                                                   |
| Nothing to commit     | Do not stop. Create an empty commit so a branch + draft PR can still be opened: `git commit --allow-empty -m "chore(<SESSION_TICKET>): scaffold branch — see open questions"`. Add "no implementable changes" to `GAPS`. |

---

## Step 10 — Push & Draft Pull Request

### 10a. Push branch

```bash
REMOTE_URL=$(git remote get-url origin)
HTTPS_URL=$(echo "$REMOTE_URL" \
  | sed 's|git@github.com:|https://github.com/|' \
  | sed 's|https://github.com|https://'"$GITHUB_TOKEN"'@github.com|')
git push "$HTTPS_URL" HEAD:"$BRANCH_NAME"
```

The token URL is passed as a one-time argument and is never written to `.git/config`.

### 10b. Compose PR body

```bash
ORG_REPO=$(echo "$REMOTE_URL" | sed 's|.*github.com[:/]||' | sed 's|\.git$||')
```

`ORG_REPO` is `<owner>/<repo>` (e.g. `adobe-experience-league/exlm`).

Build the "Open Questions / Gaps" block from `GAPS`: one `- ` bullet per gap, or the
literal `None — fully implemented, pending review` when `GAPS` is empty.

Check for a PR template:

```bash
[ -f .github/pull_request_template.md ] && echo "exists" || echo "none"
```

**If template exists** — read it with `Read`, set `Jira ID:` → `<SESSION_TICKET>`, keep
all `$` placeholders as-is, and insert the two auto-build sections (`🤖 Auto-generated`
banner + `## What was implemented` + `## ⚠️ Open Questions / Gaps`) directly under the
`Jira ID:` line.

**If no template** — use:

```markdown
Jira ID: <SESSION_TICKET>
🤖 Auto-generated draft from Jira. Review before marking ready.

## What was implemented

<2–3 sentence summary of what CDD built>

## ⚠️ Open Questions / Gaps

<gaps block>

Test URLs:

- Before: https://main--exlm--adobe-experience-league.aem.live

$
$/en/browse?martech=off
$/en/docs?martech=off
$/en/search?martech=off
```

### 10c. Create the DRAFT PR via GitHub REST API

```bash
curl -s -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$ORG_REPO/pulls" \
  -d "$(node -e "
    console.log(JSON.stringify({
      title: '<prefix>(<SESSION_TICKET>): <TICKET_SUMMARY>',
      body:  '<PR body>',
      head:  '<BRANCH_NAME>',
      base:  'main',
      draft: true
    }))
  ")"
```

Parse `html_url` and store as `PR_URL`.

### 10d. PR error handling

| Situation               | Action                                                    |
| ----------------------- | --------------------------------------------------------- |
| 401                     | "GITHUB_TOKEN invalid or expired." Stop.                  |
| 422 — PR already exists | Extract the existing PR URL, store as `PR_URL`, continue. |
| curl exits non-zero     | Print raw error and stop.                                 |

---

## Step 11 — Comment back to JIRA

Compose the preview URL programmatically:

```
PREVIEW_URL = https://<BRANCH_NAME>--<repo>--<owner>.aem.live
```

where `<owner>` and `<repo>` are derived by splitting `ORG_REPO` on `/`. Example:
`ORG_REPO=adobe-experience-league/exlm`, `BRANCH_NAME=exlm-1234` →
`https://exlm-1234--exlm--adobe-experience-league.aem.live`.

Build the comment body:

```
🤖 Auto-build ran for <SESSION_TICKET>.

✅ What was done:
<2–3 line summary + files changed>

⚠️ Open questions / blockers:
<one "- " bullet per GAPS entry, or "None">

🔗 Draft PR: <PR_URL>  (review before merging)
👀 Preview:  <PREVIEW_URL>
```

Post it:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/issue/$SESSION_TICKET/comment" \
  -d "$(node -e "console.log(JSON.stringify({ body: process.argv[1] }))" "<comment body>")"
```

On failure: print a one-line warning and continue (do not fail the run).

---

## Step 12 — Handoff Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auto-build complete — <SESSION_TICKET>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ticket   : <SESSION_TICKET> — <TICKET_SUMMARY>
Plan     : plans/<SESSION_TICKET>-plan.md
Files    : <N> files changed
Draft PR : <PR_URL>
Preview  : <PREVIEW_URL>
Gaps     : <N open questions flagged> (see PR + JIRA comment)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
````

- [ ] **Step 2: Verify the frontmatter and required steps are present**

Run:

```bash
cd /Users/gsnair/Documents/Projects/exlm
head -12 .agents/skills/auto-build/SKILL.md
grep -n "AskUserQuestion" .agents/skills/auto-build/SKILL.md
grep -nE "^## Step (1|2|5|10|11) " .agents/skills/auto-build/SKILL.md
grep -c '"draft": true\|draft: true' .agents/skills/auto-build/SKILL.md
```

Expected:

- Frontmatter shows `name: auto-build`.
- The only `AskUserQuestion` matches are the "never call AskUserQuestion" ground-rule / Step 5b instruction lines (no actual gate).
- Steps 1, 2, 5, 10, 11 headings all present.
- `draft: true` appears at least once (Step 10c).

- [ ] **Step 3: Commit**

```bash
cd /Users/gsnair/Documents/Projects/exlm
git add .agents/skills/auto-build/SKILL.md
git commit -m "feat: add headless auto-build skill for CI Jira-to-PR automation"
```

---

### Task 2: Wire the skill into the `.claude/skills` mirror

**Files:**

- Create: `.claude/skills/auto-build` (symlink → `../../.agents/skills/auto-build`)

**Interfaces:**

- Consumes: the `.agents/skills/auto-build/` directory from Task 1.
- Produces: a discoverable `/auto-build` skill under `.claude/skills/`, matching how `build` is exposed.

- [ ] **Step 1: Confirm how `build` is mirrored**

Run:

```bash
cd /Users/gsnair/Documents/Projects/exlm
ls -la .claude/skills/build
```

Expected: `.claude/skills/build -> ../../.agents/skills/build` (a symlink).

- [ ] **Step 2: Create the matching symlink for auto-build**

```bash
cd /Users/gsnair/Documents/Projects/exlm/.claude/skills
ln -s ../../.agents/skills/auto-build auto-build
```

- [ ] **Step 3: Verify the symlink resolves**

Run:

```bash
cd /Users/gsnair/Documents/Projects/exlm
ls -la .claude/skills/auto-build
head -2 .claude/skills/auto-build/SKILL.md
```

Expected: symlink points to `../../.agents/skills/auto-build`; `head` prints `---` then `name: auto-build`.

- [ ] **Step 4: Commit**

```bash
cd /Users/gsnair/Documents/Projects/exlm
git add .claude/skills/auto-build
git commit -m "chore: expose auto-build skill via .claude/skills symlink"
```

---

### Task 3: Create the trigger workflow

**Files:**

- Create: `.github/workflows/jira-to-pr.yaml`

**Interfaces:**

- Consumes: secrets `CLAUDE_CODE_OAUTH_TOKEN`, `UPDATE_PR_GITHUB_TOKEN`, `JIRA_BASE_URL`, `JIRA_PAT`; the `/auto-build` skill from Tasks 1–2.
- Produces: a workflow that resolves a ticket key and runs `/auto-build <ticket>` headlessly.

- [ ] **Step 1: Create the workflow file with full content**

Create `.github/workflows/jira-to-pr.yaml` with exactly this content:

```yaml
name: Jira to PR

on:
  repository_dispatch:
    types: [jira-build]
  workflow_dispatch:
    inputs:
      ticket:
        description: 'JIRA ticket key (e.g. EXLM-1234)'
        required: true
        type: string

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  auto-build:
    # Only the canonical exlm repo (not exlm-stage or other copies).
    if: github.repository == 'adobe-experience-league/exlm'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Resolve and validate ticket
        id: ticket
        run: |
          TICKET="${{ github.event.client_payload.ticket || github.event.inputs.ticket }}"
          if [[ ! "$TICKET" =~ ^[A-Z]+-[0-9]+$ ]]; then
            echo "::error::Invalid or missing ticket key: '$TICKET'. Expected PROJECT-NUMBER (e.g. EXLM-1234)."
            exit 1
          fi
          echo "ticket=$TICKET" >> "$GITHUB_OUTPUT"
          echo "Resolved ticket: $TICKET"

      - name: Restore AI skills
        run: npx skills experimental_install --yes

      - uses: anthropics/claude-code-action@v1
        env:
          JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
          JIRA_PAT: ${{ secrets.JIRA_PAT }}
          GITHUB_TOKEN: ${{ secrets.UPDATE_PR_GITHUB_TOKEN }}
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          prompt: |
            /auto-build ${{ steps.ticket.outputs.ticket }}
          claude_args: |
            --max-turns 80
            --allowedTools "Bash,Read,Write,Edit,Glob,Grep,TodoWrite"
```

- [ ] **Step 2: Validate the workflow YAML**

Run:

```bash
cd /Users/gsnair/Documents/Projects/exlm
node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/jira-to-pr.yaml','utf8');require('js-yaml');console.log('yaml file read, '+s.split('\n').length+' lines')" 2>/dev/null || python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/jira-to-pr.yaml')); print('valid yaml')"
```

Expected: prints `valid yaml` (or the node line-count fallback). No parse error.

- [ ] **Step 3: Verify key fields are present**

Run:

```bash
cd /Users/gsnair/Documents/Projects/exlm
grep -nE "repository_dispatch|workflow_dispatch|jira-build|auto-build|UPDATE_PR_GITHUB_TOKEN|adobe-experience-league/exlm" .github/workflows/jira-to-pr.yaml
```

Expected: matches for the dispatch triggers, the `jira-build` type, the `/auto-build` prompt, the token mapping, and the repo guard.

- [ ] **Step 4: Commit**

```bash
cd /Users/gsnair/Documents/Projects/exlm
git add .github/workflows/jira-to-pr.yaml
git commit -m "feat: add Jira-to-PR trigger workflow (repository_dispatch + workflow_dispatch)"
```

---

### Task 4: Add operator documentation (secrets + POST contract)

**Files:**

- Create: `docs/jira-to-pr-automation.md`

**Interfaces:**

- Consumes: nothing at runtime — reference documentation for whoever configures the JIRA automation rule and GitHub secrets.
- Produces: a single doc describing required secrets and the exact POST contract.

- [ ] **Step 1: Create the operator doc**

Create `docs/jira-to-pr-automation.md` with exactly this content:

````markdown
# Jira → PR Automation

Turns a JIRA story into a **draft** PR by running the headless `auto-build` skill in
GitHub Actions. See the design spec at
`docs/superpowers/specs/2026-07-23-jira-to-pr-automation-design.md`.

## Required GitHub secrets

Configure under repo Settings → Secrets and variables → Actions:

| Secret                    | Purpose                                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude auth for `claude-code-action` (already used by `claude.yaml`)                                                                                        |
| `UPDATE_PR_GITHUB_TOKEN`  | PAT used to push the branch and open the draft PR (already exists). Being a PAT, the auto-created draft PR triggers the existing Claude PR Review workflow. |
| `JIRA_BASE_URL`           | e.g. `https://jira.corp.adobe.com`                                                                                                                          |
| `JIRA_PAT`                | JIRA personal access token (read ticket + post comments)                                                                                                    |

## Triggering

### Option A — JIRA Automation rule

Add a rule (e.g. when a story enters "Ready for Dev") with a **Send web request**
action:

- URL: `https://api.github.com/repos/adobe-experience-league/exlm/dispatches`
- Method: `POST`
- Headers:
  - `Authorization: Bearer <GitHub PAT with repo scope>`
  - `Accept: application/vnd.github+json`
- Body:
  ```json
  { "event_type": "jira-build", "client_payload": { "ticket": "{{issue.key}}" } }
  ```

### Option B — Manual / script

```bash
curl -X POST \
  -H "Authorization: Bearer <GitHub PAT with repo scope>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/adobe-experience-league/exlm/dispatches \
  -d '{ "event_type": "jira-build", "client_payload": { "ticket": "EXLM-1234" } }'
```

### Option C — GitHub Actions UI

Run the **Jira to PR** workflow via _Run workflow_ and supply the `ticket` input.

## What the automation produces

- A branch `<ticket-lowercased>` and a **draft** PR with a `What was implemented` and
  an `Open Questions / Gaps` section.
- A JIRA comment summarising what was done, listing open questions/blockers, and
  linking the draft PR plus the preview URL
  (`https://<branch>--exlm--adobe-experience-league.aem.live`).

The PR is always a draft — review it and mark it ready when satisfied.

## Notes

- The GitHub PAT the _caller_ uses (Options A/B) needs `repo` scope on
  `adobe-experience-league/exlm`; it is separate from `UPDATE_PR_GITHUB_TOKEN`.
- The automation never transitions the JIRA workflow state; it only comments.
````

- [ ] **Step 2: Verify the doc links to the spec and covers all secrets**

Run:

```bash
cd /Users/gsnair/Documents/Projects/exlm
grep -nE "CLAUDE_CODE_OAUTH_TOKEN|UPDATE_PR_GITHUB_TOKEN|JIRA_BASE_URL|JIRA_PAT|dispatches|jira-build" docs/jira-to-pr-automation.md
```

Expected: all four secrets, the dispatch URL, and the `jira-build` event type appear.

- [ ] **Step 3: Commit**

```bash
cd /Users/gsnair/Documents/Projects/exlm
git add docs/jira-to-pr-automation.md
git commit -m "docs: add Jira-to-PR automation operator guide"
```

---

## Self-Review Notes

- **Spec coverage:** §2 trigger flow → Task 3 (both dispatch triggers + guard). §3.1 workflow → Task 3. §3.2 skill → Task 1 (headless auth, no gate, best-effort, draft PR). §4 blocker/gap handling → Task 1 Steps 5a/7/9c/10b. §4.3 preview URL → Task 1 Step 11. §5 secrets → Tasks 3 + 4. §6 POST contract → Task 4. §8 files touched → Tasks 1–3 (skill, symlink, workflow); Task 4 adds the operator doc.
- **No placeholders:** angle-bracket tokens inside the skill/PR/JIRA templates (`<SESSION_TICKET>`, `<gaps block>`, etc.) are intentional runtime substitutions the skill fills at execution time, matching the existing `build` skill's convention — not plan-level TODOs.
- **Type/name consistency:** `SESSION_TICKET`, `BRANCH_NAME`, `ORG_REPO`, `GAPS`, `PR_URL`, `PREVIEW_URL`, `CURRENT_PLAN` used consistently across all steps of Task 1. Skill name `auto-build`, event type `jira-build`, and prompt `/auto-build <ticket>` consistent across Tasks 1–4.
- **Testing note:** these deliverables are config/markdown, not unit-testable code, so verification steps use YAML parsing, symlink resolution, and content greps instead of a test framework.

```

```
