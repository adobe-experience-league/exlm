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

| HTTP / exit | Action |
|---|---|
| curl exits non-zero | Print raw error. Note it may be a network/VPN issue. Stop. |
| 401 | "PAT invalid or expired." Stop. |
| 403 | "No access to `SESSION_TICKET`." Stop. |
| 404 | "`SESSION_TICKET` not found." Stop. |
| 200, empty summary | "Ticket may be restricted or deleted." Stop. |

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
|------|-------------|-------------|
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

| Situation | Action |
|---|---|
| Pre-commit hook fails | Print output. Run `npm run lint:fix` if available. Re-stage. New commit — never amend. |
| Hook fix fails | Record as a gap; continue to open the draft PR anyway. |
| Nothing to commit | Do not stop. Create an empty commit so a branch + draft PR can still be opened: `git commit --allow-empty -m "chore(<SESSION_TICKET>): scaffold branch — see open questions"`. Add "no implementable changes" to `GAPS`. |

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

**Write the final composed body to a file `pr-body.md` using the `Write` tool** (not
`echo`/heredoc). This keeps untrusted JIRA text and the literal `$` template
placeholders verbatim — the shell never interprets them.

### 10c. Create the DRAFT PR via GitHub REST API

Hold the title in a shell variable, then pass untrusted values as arguments
(`process.argv`) and read the body from `pr-body.md` — never splice `TICKET_SUMMARY`
or the body into a command string. This is the same safe pattern Step 11 uses; it
prevents shell injection (a `"`, backtick, or `$(...)` in JIRA text would otherwise
run in a step holding `$GITHUB_TOKEN`) and stops `$` placeholders from being expanded.

```bash
PR_TITLE="<prefix>($SESSION_TICKET): $TICKET_SUMMARY"

curl -s -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$ORG_REPO/pulls" \
  --data-binary "$(node -e '
    const fs = require("fs");
    const [title, head] = process.argv.slice(1);
    const body = fs.readFileSync("pr-body.md", "utf8");
    console.log(JSON.stringify({ title, body, head, base: "main", draft: true }));
  ' "$PR_TITLE" "$BRANCH_NAME")"
```

Here `$PR_TITLE` and `$BRANCH_NAME` are passed as separate arguments (bash quoting
keeps them as data), and the body comes from the file — so no untrusted text is ever
parsed as shell or as a JS string literal.

Parse `html_url` and store as `PR_URL`.

### 10d. PR error handling

| Situation | Action |
|---|---|
| 401 | "GITHUB_TOKEN invalid or expired." Stop. |
| 422 — PR already exists | Extract the existing PR URL, store as `PR_URL`, continue. |
| curl exits non-zero | Print raw error and stop. |

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

**Write the comment body to a file `jira-comment.md` using the `Write` tool** (not
`echo`/heredoc), for the same reason as the PR body: the summary is untrusted JIRA
text and a `$`-sequence in a shell string could expand and leak a secret
(`$JIRA_PAT`, `$GITHUB_TOKEN`) into the comment. Then read it in `node` with `fs`:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/issue/$SESSION_TICKET/comment" \
  --data-binary "$(node -e '
    const fs = require("fs");
    console.log(JSON.stringify({ body: fs.readFileSync("jira-comment.md", "utf8") }));
  ')"
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
